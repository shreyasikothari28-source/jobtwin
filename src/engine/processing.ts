import type { CandidateResult, JDAnalysis, ProcessProgress, WeightConfig } from '../types';
import { parseResumeFile, type ParseResult } from './fileParser';
import { scoreCandidate, rankCandidates } from './scoring';
import { computeIDF, tokenize } from './tfidf';

export interface ProcessItem {
  file: File;
  fileName: string;
}

export interface ProcessResult {
  candidates: CandidateResult[];
  jd: JDAnalysis;
}

const BATCH_SIZE = 5;

export async function processResumes(
  items: ProcessItem[],
  jd: JDAnalysis,
  weights: WeightConfig,
  onProgress: (progress: ProcessProgress) => void
): Promise<CandidateResult[]> {
  const total = items.length;

  // Phase 1: Parse all resumes in batches
  const parseResults: { item: ProcessItem; result: ParseResult }[] = [];
  const allTexts: string[][] = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        onProgress({
          current: i + batch.indexOf(item) + 1,
          total,
          fileName: item.fileName,
          phase: 'Parsing resumes',
        });
        const result = await parseResumeFile(item.file);
        return { item, result };
      })
    );

    for (const br of batchResults) {
      parseResults.push(br);
      allTexts.push(tokenize(br.result.text || br.item.fileName));
    }

    // Yield to UI
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Compute IDF across all resumes + JD
  const jdTokens = tokenize(jd.rawText);
  allTexts.push(jdTokens);
  const idf = computeIDF(allTexts);

  // Phase 2: Score all candidates
  const candidates: CandidateResult[] = [];

  for (let i = 0; i < parseResults.length; i += BATCH_SIZE) {
    const batch = parseResults.slice(i, i + BATCH_SIZE);

    for (const { item, result } of batch) {
      onProgress({
        current: i + batch.indexOf(batch.find((b) => b.item === item)!) + 1,
        total,
        fileName: item.fileName,
        phase: 'Scoring candidates',
      });

      const candidate = scoreCandidate({
        id: `cand_${i}_${item.fileName}`,
        fileName: item.fileName,
        rawText: result.text,
        parseStatus: result.status,
        parseError: result.error,
        jd,
        weights,
        idf,
      });
      candidates.push(candidate);
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Phase 3: Rank
  const ranked = rankCandidates(candidates);
  onProgress({ current: total, total, fileName: '', phase: 'Done' });

  return ranked;
}
