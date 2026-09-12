import { ArrowLeft, GitCompare, Trophy, CheckCircle2, AlertTriangle, MinusCircle, XCircle } from 'lucide-react';
import type { CandidateResult, JDAnalysis, WeightConfig } from '../types';
import { generateComparisonExplanation } from '../engine/scoring';

interface CompareTop3Props {
  candidates: CandidateResult[];
  jd: JDAnalysis;
  weights: WeightConfig;
  allCandidates: CandidateResult[];
  onBack: () => void;
}

const evidenceConfig = {
  direct: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Direct' },
  semantic: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Semantic' },
  missing: { icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Missing' },
  negative: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Negative' },
};

export default function CompareTop3({ candidates, onBack }: CompareTop3Props) {
  const explanation = generateComparisonExplanation(candidates);
  const maxScore = Math.max(...candidates.map((c) => c.finalScore), 1);

  // Collect all unique skills from JD
  const allSkills = candidates[0]?.skills.map((s) => ({ id: s.skillId, label: s.skillLabel })) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-slate-700" />
              <h1 className="text-xl font-bold text-slate-900">Compare Top 3</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Score Comparison Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {candidates.map((candidate, idx) => (
            <div
              key={candidate.id}
              className={`bg-white rounded-xl border shadow-sm p-6 ${
                idx === 0 ? 'border-yellow-300 ring-1 ring-yellow-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-slate-100 text-slate-600' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {idx < 3 ? <Trophy className="w-4 h-4" /> : <span className="text-sm font-bold">{candidate.rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{candidate.name}</h3>
                  <p className="text-xs text-slate-400">Rank #{candidate.rank}</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-slate-900 tabular-nums">{candidate.finalScore}</span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}
                  style={{ width: `${(candidate.finalScore / maxScore) * 100}%` }}
                />
              </div>
              {/* Mini score breakdown */}
              <div className="space-y-1.5">
                {candidate.scoreComponents.map((comp) => (
                  <div key={comp.label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{comp.label}</span>
                    <span className="tabular-nums text-slate-700 font-medium">{(comp.weighted * 100).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Skill-by-Skill Comparison */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Skill-by-Skill Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Skill</th>
                    {candidates.map((c) => (
                      <th key={c.id} className="text-center px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allSkills.map((skillInfo) => {
                    return (
                      <tr key={skillInfo.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-sm font-medium text-slate-700">{skillInfo.label}</td>
                        {candidates.map((c) => {
                          const skill = c.skills.find((s) => s.skillId === skillInfo.id);
                          if (!skill) return <td key={c.id} className="px-3 py-2 text-center text-slate-300">—</td>;
                          const cfg = evidenceConfig[skill.evidence];
                          const Icon = cfg.icon;
                          return (
                            <td key={c.id} className="px-3 py-2 text-center">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${cfg.bg} ${cfg.border} border`}>
                                <Icon className={`w-3 h-3 ${cfg.color}`} />
                                <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Auto-Generated Explanation */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Analysis</h2>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
