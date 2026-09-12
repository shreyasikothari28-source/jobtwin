// Core type definitions for JOB-TWIN

export interface SkillNode {
  id: string;
  label: string;
  parent?: string;
  category: SkillCategory;
  aliases: string[];
  related?: string[];
}

export type SkillCategory =
  | 'Backend'
  | 'Frontend'
  | 'Database'
  | 'DevOps'
  | 'Tools'
  | 'Languages'
  | 'Cloud'
  | 'Data'
  | 'Mobile'
  | 'Soft Skills';

export type EvidenceType = 'direct' | 'semantic' | 'missing' | 'negative';

export interface SkillEvidence {
  skillId: string;
  skillLabel: string;
  evidence: EvidenceType;
  density: number;
  evidenceQuotes: string[];
  transferableFrom?: string[];
}

export interface ScoreComponent {
  label: string;
  value: number;
  weight: number;
  weighted: number;
}

export interface CandidateResult {
  id: string;
  fileName: string;
  name: string;
  rawText: string;
  parseStatus: 'ok' | 'unparseable' | 'empty';
  parseError?: string;
  skills: SkillEvidence[];
  scoreComponents: ScoreComponent[];
  finalScore: number;
  rank: number;
  coverage: number;
  counterfactual?: CounterfactualResult;
}

export interface CounterfactualResult {
  skillAdded: string;
  originalScore: number;
  newScore: number;
  originalRank: number;
  newRank: number;
  rankChanged: boolean;
}

export interface WeightConfig {
  semantic: number;
  keyword: number;
  density: number;
  coverage: number;
  transferability: number;
  missing: number;
}

export interface JDAnalysis {
  rawText: string;
  requiredSkills: string[];
  skillGraph: string[];
}

export interface ProcessProgress {
  current: number;
  total: number;
  fileName: string;
  phase: string;
}
