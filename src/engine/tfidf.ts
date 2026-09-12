// TF-IDF + Cosine Similarity engine — fully client-side, no external models

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
  'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'some', 'any', 'no', 'not', 'as', 'if',
  'than', 'then', 'so', 'up', 'out', 'about', 'into', 'over', 'after', 'also',
  'more', 'most', 'other', 'such', 'only', 'own', 'same', 'very', 'just',
  'now', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him',
  'them', 'us', 'am', 'get', 'got', 'one', 'two', 'three', 'per', 'etc',
  'e.g', 'i.e', 'eg', 'ie', 'year', 'years', 'experience', 'work', 'working',
  'role', 'position', 'team', 'company', 'candidate', 'job', 'description',
  'requirements', 'responsibilities', 'qualification', 'qualifications',
  'preferred', 'required', 'must', 'plus', 'nice', 'have', 'strong',
  'ability', 'skills', 'skill', 'knowledge', 'proficiency', 'excellent',
  'good', 'great', 'including', 'include', 'includes', 'using', 'use', 'used',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalize by max frequency
  const max = Math.max(1, ...tf.values());
  for (const [key, val] of tf) {
    tf.set(key, val / max);
  }
  return tf;
}

export interface IDFMap {
  idf: Map<string, number>;
  docCount: number;
}

export function computeIDF(documents: string[][]): IDFMap {
  const docFreq = new Map<string, number>();
  const docCount = documents.length;

  for (const tokens of documents) {
    const unique = new Set(tokens);
    for (const token of unique) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [token, freq] of docFreq) {
    idf.set(token, Math.log((1 + docCount) / (1 + freq)) + 1);
  }

  return { idf, docCount };
}

export function computeTFIDF(tf: Map<string, number>, idf: Map<string, number>): Map<string, number> {
  const tfidf = new Map<string, number>();
  for (const [token, freq] of tf) {
    const idfVal = idf.get(token) || 0;
    tfidf.set(token, freq * idfVal);
  }
  return tfidf;
}

export function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const [key, valA] of vecA) {
    magA += valA * valA;
    const valB = vecB.get(key);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }
  for (const [, valB] of vecB) {
    magB += valB * valB;
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

export interface TFIDFResult {
  tfidfVector: Map<string, number>;
  similarity: number;
}

export function computeResumeVsJDSimilarity(
  resumeText: string,
  jdText: string,
  idf: IDFMap
): number {
  const resumeTokens = tokenize(resumeText);
  const jdTokens = tokenize(jdText);

  const resumeTF = termFrequency(resumeTokens);
  const jdTF = termFrequency(jdTokens);

  const resumeTFIDF = computeTFIDF(resumeTF, idf.idf);
  const jdTFIDF = computeTFIDF(jdTF, idf.idf);

  return cosineSimilarity(resumeTFIDF, jdTFIDF);
}

// Compute word overlap for specific terms (not just full TF-IDF)
export function termOverlap(resumeText: string, terms: string[]): Map<string, number> {
  const lower = resumeText.toLowerCase();
  const result = new Map<string, number>();
  for (const term of terms) {
    const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = lower.match(new RegExp(escaped, 'g'));
    result.set(term, matches ? matches.length : 0);
  }
  return result;
}
