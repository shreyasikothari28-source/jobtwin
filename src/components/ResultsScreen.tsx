import { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  GitCompare,
  Trophy,
  AlertCircle,
  FileX,
  Search,
} from 'lucide-react';
import type { CandidateResult, JDAnalysis, WeightConfig } from '../types';
import CandidateDetail from './CandidateDetail';
import CompareTop3 from './CompareTop3';

interface ResultsScreenProps {
  candidates: CandidateResult[];
  jd: JDAnalysis;
  weights: WeightConfig;
  onBack: () => void;
}

export default function ResultsScreen({ candidates, jd, weights, onBack }: ResultsScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnparseable, setShowUnparseable] = useState(true);

  const selected = candidates.find((c) => c.id === selectedId);

  const parseable = candidates.filter((c) => c.parseStatus === 'ok');
  const unparseable = candidates.filter((c) => c.parseStatus !== 'ok');

  const filtered = parseable.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = parseable.slice(0, 3);

  const evidenceColor = (evidence: string) => {
    switch (evidence) {
      case 'direct': return 'bg-green-500';
      case 'semantic': return 'bg-yellow-500';
      case 'missing': return 'bg-slate-300';
      case 'negative': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  if (showCompare) {
    return (
      <CompareTop3
        candidates={top3}
        jd={jd}
        weights={weights}
        allCandidates={candidates}
        onBack={() => setShowCompare(false)}
      />
    );
  }

  if (selected) {
    return (
      <CandidateDetail
        candidate={selected}
        jd={jd}
        weights={weights}
        allCandidates={candidates}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">JOB-TWIN</h1>
                <p className="text-xs text-slate-500">
                  {parseable.length} ranked · {unparseable.length} unparseable · {jd.requiredSkills.length} JD skills detected
                </p>
              </div>
            </div>
            {top3.length >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <GitCompare className="w-4 h-4" />
                Compare Top 3
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidates..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          {unparseable.length > 0 && (
            <button
              onClick={() => setShowUnparseable(!showUnparseable)}
              className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" />
              {unparseable.length} unparseable
            </button>
          )}
        </div>

        {/* Ranked Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Candidate</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-64">Skill Coverage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">Direct/Sem/Miss</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate) => {
                  const direct = candidate.skills.filter((s) => s.evidence === 'direct').length;
                  const semantic = candidate.skills.filter((s) => s.evidence === 'semantic').length;
                  const missing = candidate.skills.filter((s) => s.evidence === 'missing' || s.evidence === 'negative').length;

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => setSelectedId(candidate.id)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                          candidate.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          candidate.rank === 2 ? 'bg-slate-100 text-slate-600' :
                          candidate.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'text-slate-500'
                        }`}>
                          {candidate.rank <= 3 && <Trophy className="w-4 h-4" />}
                          {candidate.rank > 3 && candidate.rank}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 group-hover:text-slate-700">{candidate.name}</div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">{candidate.fileName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900 tabular-nums">{candidate.finalScore}</span>
                          <span className="text-xs text-slate-400">/100</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {candidate.skills.slice(0, 12).map((s) => (
                            <div
                              key={s.skillId}
                              className={`w-2 h-6 rounded-sm ${evidenceColor(s.evidence)}`}
                              title={`${s.skillLabel}: ${s.evidence}`}
                            />
                          ))}
                          {candidate.skills.length > 12 && (
                            <span className="text-xs text-slate-400 ml-1">+{candidate.skills.length - 12}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600 font-medium">{direct}D</span>
                          <span className="text-yellow-600 font-medium">{semantic}S</span>
                          <span className="text-red-500 font-medium">{missing}M</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unparseable Files */}
        {showUnparseable && unparseable.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-amber-200 shadow-sm">
            <div className="p-4 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <FileX className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">Unparseable Resumes ({unparseable.length})</h3>
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {unparseable.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileX className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate">{c.fileName}</span>
                  </div>
                  <span className="text-xs text-amber-600 flex-shrink-0 ml-3">
                    {c.parseError || c.parseStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
