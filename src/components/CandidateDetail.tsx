import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  TrendingUp,
  Quote,
  FlaskConical,
} from 'lucide-react';
import type { CandidateResult, JDAnalysis, WeightConfig } from '../types';
import { computeCounterfactual } from '../engine/scoring';
import { CATEGORIES, getSkillById } from '../data/taxonomy';

interface CandidateDetailProps {
  candidate: CandidateResult;
  jd: JDAnalysis;
  weights: WeightConfig;
  allCandidates: CandidateResult[];
  onBack: () => void;
}

const evidenceConfig = {
  direct: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Direct Match' },
  semantic: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Semantic/Transferable' },
  missing: { icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Missing' },
  negative: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Negative Evidence' },
};

export default function CandidateDetail({ candidate, jd, weights, allCandidates, onBack }: CandidateDetailProps) {
  const [counterfactualSkill, setCounterfactualSkill] = useState<string | null>(null);
  const [counterfactualResult, setCounterfactualResult] = useState<ReturnType<typeof computeCounterfactual> | null>(null);

  const missingSkills = candidate.skills.filter((s) => s.evidence === 'missing' || s.evidence === 'negative');

  const runCounterfactual = (skillId: string) => {
    setCounterfactualSkill(skillId);
    const result = computeCounterfactual(candidate, skillId, allCandidates, jd, weights);
    setCounterfactualResult(result);
  };

  // Group skills by category
  const skillsByCategory = useMemo(() => {
    const grouped: Record<string, typeof candidate.skills> = {};
    for (const skill of candidate.skills) {
      const node = getSkillById(skill.skillId);
      const cat = node?.category || 'Tools';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(skill);
    }
    return grouped;
  }, [candidate]);

  const maxComponentValue = Math.max(...candidate.scoreComponents.map((c) => c.weighted), 0.01);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{candidate.name}</h1>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  candidate.rank <= 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  #{candidate.rank}
                </span>
              </div>
              <p className="text-xs text-slate-500">{candidate.fileName}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 tabular-nums">{candidate.finalScore}</div>
              <div className="text-xs text-slate-400">Final Score</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Score Breakdown */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Score Breakdown</h2>
            <div className="space-y-3">
              {candidate.scoreComponents.map((comp) => (
                <div key={comp.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{comp.label}</span>
                    <span className="text-sm tabular-nums text-slate-500">
                      {(comp.value * 100).toFixed(0)}% × {(comp.weight * 100).toFixed(0)}% = <span className="font-semibold text-slate-700">{(comp.weighted * 100).toFixed(1)}</span>
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all"
                      style={{ width: `${(comp.weighted / maxComponentValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capability Graph Visualization */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Capability Graph — JD Skill Match</h2>
            <div className="space-y-4">
              {CATEGORIES.map((category) => {
                const skills = skillsByCategory[category];
                if (!skills || skills.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => {
                        const cfg = evidenceConfig[skill.evidence];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={skill.skillId}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            <span className="text-sm font-medium text-slate-700">{skill.skillLabel}</span>
                            {skill.transferableFrom && skill.transferableFrom.length > 0 && (
                              <span className="text-xs text-slate-400">
                                ← {skill.transferableFrom.map((t) => getSkillById(t)?.label || t).join(', ')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Evidence Density Breakdown */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Evidence Density Breakdown</h2>
            <div className="space-y-3">
              {candidate.skills.map((skill) => {
                const cfg = evidenceConfig[skill.evidence];
                return (
                  <div key={skill.skillId} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                        <span className="text-sm font-medium text-slate-800">{skill.skillLabel}</span>
                        <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cfg.color.replace('text-', 'bg-')}`}
                            style={{ width: `${skill.density * 100}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-slate-500 w-8 text-right">{(skill.density * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    {skill.evidenceQuotes.length > 0 ? (
                      <div className="space-y-1 ml-4">
                        {skill.evidenceQuotes.map((quote, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                            <Quote className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                            <span className="italic">{quote.length > 150 ? quote.slice(0, 150) + '...' : quote}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="ml-4 text-xs text-slate-400 italic">No project-context evidence found — skill may only appear in a bare skills list.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Counterfactual Analysis */}
        {missingSkills.length > 0 && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">What Would Change the Ranking?</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Select a missing or negatively-evidenced skill to simulate what happens if the candidate had it. The engine recomputes their score and rank.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {missingSkills.map((skill) => (
                  <button
                    key={skill.skillId}
                    onClick={() => runCounterfactual(skill.skillId)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      counterfactualSkill === skill.skillId
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    + {skill.skillLabel}
                  </button>
                ))}
              </div>

              {counterfactualResult && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-semibold text-slate-900">
                      Simulating: if {candidate.name} had {getSkillById(counterfactualResult.skillAdded)?.label || counterfactualResult.skillAdded}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Before</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-700 tabular-nums">{counterfactualResult.originalScore}</span>
                        <span className="text-sm text-slate-400">Rank #{counterfactualResult.originalRank}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full mt-1">
                        <div className="h-full bg-slate-400 rounded-full" style={{ width: `${counterfactualResult.originalScore}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">After</div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold tabular-nums ${counterfactualResult.newScore > counterfactualResult.originalScore ? 'text-green-600' : 'text-slate-700'}`}>
                          {counterfactualResult.newScore}
                        </span>
                        <span className="text-sm text-slate-400">Rank #{counterfactualResult.newRank}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full mt-1">
                        <div className={`h-full rounded-full ${counterfactualResult.newScore > counterfactualResult.originalScore ? 'bg-green-500' : 'bg-slate-400'}`} style={{ width: `${counterfactualResult.newScore}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${counterfactualResult.rankChanged ? 'bg-blue-50 border border-blue-200' : 'bg-slate-100 border border-slate-200'}`}>
                    <p className="text-sm text-slate-700">
                      {counterfactualResult.rankChanged ? (
                        <>
                          Ranking would change: <strong>{candidate.name}</strong> would move from #{counterfactualResult.originalRank} to #{counterfactualResult.newRank}
                          {counterfactualResult.newRank < counterfactualResult.originalRank ? ' (improvement)' : ' (decline)'}.
                        </>
                      ) : (
                        <>Ranking would not change — <strong>{candidate.name}</strong> stays at #{counterfactualResult.originalRank}, but score increases from {counterfactualResult.originalScore} to {counterfactualResult.newScore}.</>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
