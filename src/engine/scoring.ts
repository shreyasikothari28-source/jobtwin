import type {
  CandidateResult,
  JDAnalysis,
  ScoreComponent,
  SkillEvidence,
  WeightConfig,
} from '../types';
import {
  computeEvidenceDensity,
  checkNegativeEvidence,
  checkSemanticMatch,
  extractJDSkills,
  findKeywordMatches,
  type KeywordMatch,
} from './keywordEngine';
import { computeResumeVsJDSimilarity, computeIDF } from './tfidf';
import { getAncestors, getDescendants, getRelatedSkills, getSkillById } from '../data/taxonomy';

export const DEFAULT_WEIGHTS: WeightConfig = {
  semantic: 30,
  keyword: 20,
  density: 15,
  coverage: 15,
  transferability: 10,
  missing: 10,
};

export function analyzeJD(jdText: string): JDAnalysis {
  const requiredSkills = extractJDSkills(jdText);
  return {
    rawText: jdText,
    requiredSkills,
    skillGraph: requiredSkills,
  };
}

export interface ScoreCandidateParams {
  id: string;
  fileName: string;
  rawText: string;
  parseStatus: 'ok' | 'unparseable' | 'empty';
  parseError?: string;
  jd: JDAnalysis;
  weights: WeightConfig;
  idf: ReturnType<typeof computeIDF>;
}

function extractNameFromResume(fileName: string, rawText: string): string {
  // Try to extract name from first few lines of resume
  const lines = rawText.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines.slice(0, 5)) {
    // A name is typically 2-4 words, no numbers, reasonable length
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      line.length < 50 &&
      !/\d/.test(line) &&
      !/@/.test(line) &&
      !/resume|curriculum|cv/i.test(line) &&
      /^[A-Za-z\s.'-]+$/.test(line)
    ) {
      return line;
    }
  }
  // Fall back to filename
  return fileName
    .replace(/\.(pdf|docx?)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function scoreCandidate(params: ScoreCandidateParams): CandidateResult {
  const { id, fileName, rawText, parseStatus, parseError, jd, weights, idf } = params;

  if (parseStatus !== 'ok' || rawText.trim().length === 0) {
    return {
      id,
      fileName,
      name: parseStatus === 'unparseable' ? fileName.replace(/\.(pdf|docx?)$/i, '') : extractNameFromResume(fileName, rawText),
      rawText,
      parseStatus: parseStatus === 'ok' ? 'empty' : parseStatus,
      parseError,
      skills: [],
      scoreComponents: [],
      finalScore: 0,
      rank: 0,
      coverage: 0,
    };
  }

  const keywordMatches = findKeywordMatches(rawText);
  const skillEvidences: SkillEvidence[] = [];
  const totalWeight = weights.semantic + weights.keyword + weights.density + weights.coverage + weights.transferability + weights.missing;

  // Per-skill analysis
  let directCount = 0;
  let semanticCount = 0;
  let missingCount = 0;
  let negativeCount = 0;
  let totalDensity = 0;
  let transferableCount = 0;

  for (const skillId of jd.requiredSkills) {
    const skill = getSkillById(skillId);
    if (!skill) continue;

    const match = keywordMatches.get(skillId);
    const densityResult = computeEvidenceDensity(skillId, match, rawText);
    const negativeCheck = checkNegativeEvidence(skillId, keywordMatches, rawText);
    const semanticCheck = checkSemanticMatch(skillId, keywordMatches);

    let evidence: SkillEvidence['evidence'];

    if (match) {
      evidence = 'direct';
      directCount++;
    } else if (negativeCheck) {
      evidence = 'negative';
      negativeCount++;
    } else if (semanticCheck.isSemantic) {
      evidence = 'semantic';
      semanticCount++;
      transferableCount += semanticCheck.transferableFrom.length;
    } else {
      evidence = 'missing';
      missingCount++;
    }

    totalDensity += densityResult.density;

    skillEvidences.push({
      skillId,
      skillLabel: skill.label,
      evidence,
      density: densityResult.density,
      evidenceQuotes: densityResult.evidenceLines,
      transferableFrom: semanticCheck.transferableFrom,
    });
  }

  // Compute component scores
  const requiredCount = jd.requiredSkills.length || 1;

  // Semantic Capability Match: TF-IDF cosine similarity
  const semanticScore = computeResumeVsJDSimilarity(rawText, jd.rawText, idf);

  // Explicit Keyword Match: ratio of direct matches
  const keywordScore = directCount / requiredCount;

  // Evidence Density: average density across all required skills
  const densityScore = totalDensity / requiredCount;

  // Required-Skill Coverage: (direct + semantic) / total required
  const coverageScore = (directCount + semanticCount) / requiredCount;

  // Skill Transferability: average transferable connections per semantic match
  const transferabilityScore = semanticCount > 0 ? Math.min(transferableCount / (semanticCount * 2), 1) : 0;

  // Missing/Negative Evidence penalty
  const missingPenalty = (missingCount + negativeCount * 1.5) / requiredCount;
  const missingScore = Math.max(0, 1 - missingPenalty);

  const components: ScoreComponent[] = [
    { label: 'Semantic Capability Match', value: semanticScore, weight: weights.semantic / totalWeight, weighted: 0 },
    { label: 'Explicit Keyword Match', value: keywordScore, weight: weights.keyword / totalWeight, weighted: 0 },
    { label: 'Evidence Density', value: densityScore, weight: weights.density / totalWeight, weighted: 0 },
    { label: 'Required-Skill Coverage', value: coverageScore, weight: weights.coverage / totalWeight, weighted: 0 },
    { label: 'Skill Transferability', value: transferabilityScore, weight: weights.transferability / totalWeight, weighted: 0 },
    { label: 'Missing/Negative Penalty', value: missingScore, weight: weights.missing / totalWeight, weighted: 0 },
  ];

  let finalScore = 0;
  for (const comp of components) {
    comp.weighted = comp.value * comp.weight;
    finalScore += comp.weighted;
  }

  finalScore = Math.round(finalScore * 100);

  return {
    id,
    fileName,
    name: extractNameFromResume(fileName, rawText),
    rawText,
    parseStatus: 'ok',
    parseError,
    skills: skillEvidences,
    scoreComponents: components,
    finalScore,
    rank: 0,
    coverage: Math.round(coverageScore * 100),
  };
}

export function rankCandidates(candidates: CandidateResult[]): CandidateResult[] {
  const sorted = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
  sorted.forEach((c, i) => {
    c.rank = i + 1;
  });
  return sorted;
}

// Counterfactual: what if this candidate had a missing skill?
export function computeCounterfactual(
  candidate: CandidateResult,
  missingSkillId: string,
  allCandidates: CandidateResult[],
  jd: JDAnalysis,
  weights: WeightConfig
): { originalScore: number; newScore: number; originalRank: number; newRank: number; rankChanged: boolean; skillAdded: string } {
  if (!candidate.skills.some((s) => s.skillId === missingSkillId && (s.evidence === 'missing' || s.evidence === 'negative'))) {
    return {
      originalScore: candidate.finalScore,
      newScore: candidate.finalScore,
      originalRank: candidate.rank,
      newRank: candidate.rank,
      rankChanged: false,
      skillAdded: missingSkillId,
    };
  }

  // Simulate adding the skill: modify the candidate's skills and recompute
  const modifiedSkills = candidate.skills.map((s) => {
    if (s.skillId === missingSkillId) {
      return {
        ...s,
        evidence: 'direct' as const,
        density: 0.6,
        evidenceQuotes: ['[Simulated: skill added for counterfactual analysis]'],
      };
    }
    return s;
  });

  // Recompute scores with modified skills
  const requiredCount = jd.requiredSkills.length || 1;
  const directCount = modifiedSkills.filter((s) => s.evidence === 'direct').length;
  const semanticCount = modifiedSkills.filter((s) => s.evidence === 'semantic').length;
  const missingCount = modifiedSkills.filter((s) => s.evidence === 'missing').length;
  const negativeCount = modifiedSkills.filter((s) => s.evidence === 'negative').length;
  const totalDensity = modifiedSkills.reduce((sum, s) => sum + s.density, 0);

  const totalWeight = weights.semantic + weights.keyword + weights.density + weights.coverage + weights.transferability + weights.missing;

  // Keep semantic TF-IDF the same (adding a keyword doesn't change TF-IDF much)
  const semanticComp = candidate.scoreComponents.find((c) => c.label === 'Semantic Capability Match')!;
  const semanticScore = semanticComp.value;

  const keywordScore = directCount / requiredCount;
  const densityScore = totalDensity / requiredCount;
  const coverageScore = (directCount + semanticCount) / requiredCount;
  const transferabilityScore = candidate.scoreComponents.find((c) => c.label === 'Skill Transferability')!.value;
  const missingPenalty = (missingCount + negativeCount * 1.5) / requiredCount;
  const missingScore = Math.max(0, 1 - missingPenalty);

  const newScore = Math.round(
    (semanticScore * (weights.semantic / totalWeight) +
      keywordScore * (weights.keyword / totalWeight) +
      densityScore * (weights.density / totalWeight) +
      coverageScore * (weights.coverage / totalWeight) +
      transferabilityScore * (weights.transferability / totalWeight) +
      missingScore * (weights.missing / totalWeight)) * 100
  );

  // Compute new rank
  const otherScores = allCandidates
    .filter((c) => c.id !== candidate.id)
    .map((c) => c.finalScore);
  otherScores.push(newScore);
  otherScores.sort((a, b) => b - a);
  const newRank = otherScores.indexOf(newScore) + 1;

  return {
    originalScore: candidate.finalScore,
    newScore,
    originalRank: candidate.rank,
    newRank,
    rankChanged: newRank !== candidate.rank,
    skillAdded: missingSkillId,
  };
}

// Generate comparison explanation for Compare Top 3
export function generateComparisonExplanation(
  candidates: CandidateResult[]
): string {
  if (candidates.length < 2) return '';

  const explanations: string[] = [];

  for (let i = 0; i < candidates.length - 1; i++) {
    const higher = candidates[i];
    const lower = candidates[i + 1];

    const higherDirect = higher.skills.filter((s) => s.evidence === 'direct').map((s) => s.skillLabel);
    const lowerDirect = lower.skills.filter((s) => s.evidence === 'direct').map((s) => s.skillLabel);
    const lowerSemantic = lower.skills.filter((s) => s.evidence === 'semantic').map((s) => s.skillLabel);
    const lowerMissing = lower.skills.filter((s) => s.evidence === 'missing' || s.evidence === 'negative').map((s) => s.skillLabel);
    const higherMissing = higher.skills.filter((s) => s.evidence === 'missing' || s.evidence === 'negative').map((s) => s.skillLabel);

    const parts: string[] = [];

    // What higher has directly that lower doesn't
    const higherOnlyDirect = higherDirect.filter((s) => !lowerDirect.includes(s));
    if (higherOnlyDirect.length > 0) {
      parts.push(`${higher.name} shows direct evidence for ${higherOnlyDirect.slice(0, 3).join(', ')}`);
    }

    // What lower relies on semantically
    if (lowerSemantic.length > 0) {
      parts.push(`while ${lower.name} relies on transferable evidence for ${lowerSemantic.slice(0, 3).join(', ')}`);
    }

    // What lower is missing
    if (lowerMissing.length > 0) {
      const alsoMissingInHigher = lowerMissing.filter((s) => higherMissing.includes(s));
      const lowerOnlyMissing = lowerMissing.filter((s) => !higherMissing.includes(s));
      if (lowerOnlyMissing.length > 0) {
        parts.push(`and lacks demonstrated ${lowerOnlyMissing.slice(0, 3).join(', ')}`);
      }
    }

    // Evidence density difference
    const higherDensity = higher.scoreComponents.find((c) => c.label === 'Evidence Density')?.value || 0;
    const lowerDensity = lower.scoreComponents.find((c) => c.label === 'Evidence Density')?.value || 0;
    if (higherDensity > lowerDensity + 0.1) {
      parts.push(`${higher.name} also shows stronger project-backed evidence (density ${(higherDensity * 100).toFixed(0)}% vs ${(lowerDensity * 100).toFixed(0)}%)`);
    }

    if (parts.length > 0) {
      explanations.push(`${higher.name} ranks #${higher.rank} above ${lower.name} (#${lower.rank}) because ${parts.join(', ')}.`);
    } else {
      explanations.push(`${higher.name} ranks slightly above ${lower.name} with an overall score of ${higher.finalScore} vs ${lower.finalScore}.`);
    }
  }

  return explanations.join(' ');
}
