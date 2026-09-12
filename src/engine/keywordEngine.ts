import { ALIAS_MAP, getAncestors, getDescendants, getRelatedSkills, getSkillById } from '../data/taxonomy';
import type { SkillEvidence } from '../types';

// Action verbs that indicate project-context usage of a skill
const ACTION_VERBS = [
  'built', 'developed', 'implemented', 'created', 'designed', 'architected',
  'deployed', 'maintained', 'optimized', 'integrated', 'configured', 'managed',
  'led', 'wrote', 'engineered', 'refactored', 'migrated', 'automated', 'built',
  'delivered', 'launched', 'shipped', 'spearheaded', 'established', 'improved',
  'built', 'scaled', 'designed', 'tested', 'debugged', 'documented', 'mentored',
];

const SKILL_SECTION_PATTERNS = [
  /^(?:technical\s+)?skills\s*[:\-]/im,
  /^technologies\s*[:\-]/im,
  /^tech\s+stack\s*[:\-]/im,
  /^tools\s*[:\-]/im,
  /^core\s+competenc/i,
  /^areas\s+of\s+expertise/im,
  /^programming\s+languages\s*[:\-]/im,
  /^frameworks\s*[:\-]/im,
];

export interface KeywordMatch {
  skillId: string;
  count: number;
  inSkillSection: boolean;
  withActionVerb: boolean;
  evidenceLines: string[];
}

// Extract lines from text
function getLines(text: string): string[] {
  return text.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 0);
}

// Check if a line is a "Skills:" section header
function isSkillSectionLine(line: string): boolean {
  return SKILL_SECTION_PATTERNS.some((p) => p.test(line));
}

// Find all skill keyword matches in resume text
export function findKeywordMatches(resumeText: string): Map<string, KeywordMatch> {
  const lines = getLines(resumeText);
  const matches = new Map<string, KeywordMatch>();
  const lowerText = resumeText.toLowerCase();

  // For each skill, check if any of its aliases appear in the text
  for (const [alias, skillId] of Object.entries(ALIAS_MAP)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundaries for short aliases to avoid false positives
    const pattern = alias.length <= 3
      ? new RegExp(`\\b${escaped}\\b`, 'gi')
      : new RegExp(escaped, 'gi');

    const regexMatches = lowerText.match(pattern);
    if (!regexMatches || regexMatches.length === 0) continue;

    const existing = matches.get(skillId);
    if (existing) {
      existing.count += regexMatches.length;
    } else {
      matches.set(skillId, {
        skillId,
        count: regexMatches.length,
        inSkillSection: false,
        withActionVerb: false,
        evidenceLines: [],
      });
    }
  }

  // Now check context: is each match in a skill section or near action verbs?
  for (const [skillId, match] of matches) {
    const skill = getSkillById(skillId);
    if (!skill) continue;

    const aliasesToCheck = [skill.label, ...skill.aliases].map((a) => a.toLowerCase());

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const found = aliasesToCheck.some((alias) => {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = alias.length <= 3
          ? new RegExp(`\\b${escaped}\\b`, 'i')
          : new RegExp(escaped, 'i');
        return pattern.test(lowerLine);
      });

      if (found) {
        if (isSkillSectionLine(line)) {
          match.inSkillSection = true;
        }
        const hasActionVerb = ACTION_VERBS.some((verb) => {
          const escaped = verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerLine);
        });
        if (hasActionVerb) {
          match.withActionVerb = true;
          match.evidenceLines.push(line);
        } else if (!match.inSkillSection && match.evidenceLines.length < 3) {
          match.evidenceLines.push(line);
        }
      }
    }
  }

  return matches;
}

// Extract required skills from JD text
export function extractJDSkills(jdText: string): string[] {
  const lowerText = jdText.toLowerCase();
  const found = new Set<string>();

  for (const [alias, skillId] of Object.entries(ALIAS_MAP)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = alias.length <= 3
      ? new RegExp(`\\b${escaped}\\b`, 'i')
      : new RegExp(escaped, 'i');

    if (pattern.test(lowerText)) {
      found.add(skillId);
      // Also add parent skills if child is found
      const ancestors = getAncestors(skillId);
      for (const a of ancestors) {
        found.add(a);
      }
    }
  }

  return Array.from(found);
}

// Compute evidence density for a single skill
export function computeEvidenceDensity(
  skillId: string,
  match: KeywordMatch | undefined,
  resumeText: string
): { density: number; evidenceLines: string[] } {
  if (!match) {
    return { density: 0, evidenceLines: [] };
  }

  let density = 0;

  // Base points for presence
  density += 0.1;

  // Points for frequency (capped)
  density += Math.min(match.count * 0.1, 0.3);

  // Points for action verb context (project evidence)
  if (match.withActionVerb) {
    density += 0.4;
  }

  // Penalty for only being in skills section (bare listing)
  if (match.inSkillSection && !match.withActionVerb) {
    density = Math.min(density, 0.25);
  }

  // Bonus for appearing in multiple contexts
  if (match.evidenceLines.length >= 3) {
    density += 0.1;
  }

  density = Math.min(density, 1.0);

  return { density, evidenceLines: match.evidenceLines.slice(0, 5) };
}

// Check for negative evidence: skill required by JD, resume has related work but never mentions it
export function checkNegativeEvidence(
  skillId: string,
  keywordMatches: Map<string, KeywordMatch>,
  resumeText: string
): boolean {
  // If the skill IS mentioned, it's not negative
  if (keywordMatches.has(skillId)) return false;

  // Check if resume mentions related skills (descendants, ancestors, related)
  const related = [
    ...getDescendants(skillId),
    ...getAncestors(skillId),
    ...getRelatedSkills(skillId),
  ];

  const hasRelatedWork = related.some((rId) => keywordMatches.has(rId));

  // If resume has related work but NOT the specific required skill
  // AND the resume is substantial (not a short text)
  if (hasRelatedWork && resumeText.length > 500) {
    return true;
  }

  return false;
}

// Check for semantic/transferable match
export function checkSemanticMatch(
  skillId: string,
  keywordMatches: Map<string, KeywordMatch>
): { isSemantic: boolean; transferableFrom: string[] } {
  if (keywordMatches.has(skillId)) {
    return { isSemantic: false, transferableFrom: [] };
  }

  const transferableFrom: string[] = [];

  // Check descendants (child skills imply parent capability)
  const descendants = getDescendants(skillId);
  for (const desc of descendants) {
    if (keywordMatches.has(desc)) {
      transferableFrom.push(desc);
    }
  }

  // Check ancestors (parent skills imply possible familiarity with children)
  const ancestors = getAncestors(skillId);
  for (const anc of ancestors) {
    if (keywordMatches.has(anc)) {
      transferableFrom.push(anc);
    }
  }

  // Check related skills
  const related = getRelatedSkills(skillId);
  for (const rel of related) {
    if (keywordMatches.has(rel)) {
      transferableFrom.push(rel);
    }
  }

  return {
    isSemantic: transferableFrom.length > 0,
    transferableFrom,
  };
}
