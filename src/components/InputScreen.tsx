import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Link2,
  FileText,
  Play,
  Settings2,
  X,
  FolderOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { WeightConfig, ProcessProgress } from '../types';
import { DEFAULT_WEIGHTS } from '../engine/scoring';
import { fetchDriveFolder, downloadDriveFile, type DriveFile } from '../engine/driveFetcher';

interface InputScreenProps {
  onRun: (jdText: string, files: File[], weights: WeightConfig) => void;
  isProcessing: boolean;
  progress: ProcessProgress | null;
}

export default function InputScreen({ onRun, isProcessing, progress }: InputScreenProps) {
  const [jdText, setJdText] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveError, setDriveError] = useState('');
  const [driveResolvedFiles, setDriveResolvedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => /\.(pdf|docx?|)$/i.test(f.name) || f.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDriveFetch = async () => {
    if (!driveUrl.trim()) return;
    setDriveLoading(true);
    setDriveError('');
    setDriveFiles([]);
    setDriveResolvedFiles([]);

    const result = await fetchDriveFolder(driveUrl);
    setDriveLoading(false);

    if (result.error) {
      setDriveError(result.error);
    } else {
      setDriveFiles(result.files);
      // Download each file and convert to File objects
      const downloaded: File[] = [];
      for (const df of result.files) {
        try {
          const blob = await downloadDriveFile(df);
          const file = new File([blob], df.name, { type: df.mimeType });
          downloaded.push(file);
        } catch {
          // Skip files that fail to download
        }
      }
      setDriveResolvedFiles(downloaded);
    }
  };

  const totalFiles = files.length + driveResolvedFiles.length;
  const canRun = jdText.trim().length > 20 && totalFiles > 0 && !isProcessing;

  const handleRun = () => {
    const allFiles = [...files, ...driveResolvedFiles];
    onRun(jdText, allFiles, weights);
  };

  const weightLabels: { key: keyof WeightConfig; label: string }[] = [
    { key: 'semantic', label: 'Semantic Capability Match' },
    { key: 'keyword', label: 'Explicit Keyword Match' },
    { key: 'density', label: 'Evidence Density' },
    { key: 'coverage', label: 'Required-Skill Coverage' },
    { key: 'transferability', label: 'Skill Transferability' },
    { key: 'missing', label: 'Missing/Negative Penalty' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">JOB-TWIN</h1>
              <p className="text-xs text-slate-500">Resume Shortlisting Engine</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* JD Input */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Job Description</h2>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here. The engine will extract required skills and build a capability graph from this text."
              className="w-full h-48 px-4 py-3 text-sm text-slate-800 border border-slate-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
            />
            <p className="mt-2 text-xs text-slate-500">
              {jdText.trim().length} characters — minimum 20 required
            </p>
          </div>
        </section>

        {/* Resume Sources */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Drive Link */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Google Drive Folder</h2>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Paste a folder link set to "Anyone with the link." Resumes will be fetched automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  onClick={handleDriveFetch}
                  disabled={!driveUrl.trim() || driveLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                >
                  {driveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                  Fetch
                </button>
              </div>
              {driveError && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{driveError}</p>
                </div>
              )}
              {driveFiles.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700">
                      Found {driveFiles.length} files{driveResolvedFiles.length === driveFiles.length ? ' — all downloaded' : ` — downloading...`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Upload Zone */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-900">Upload Resumes</h2>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Drag & drop or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF and DOCX — up to 300+ files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </section>
        </div>

        {/* File List */}
        {(files.length > 0 || driveResolvedFiles.length > 0) && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Files ({totalFiles})
                </h2>
                <button
                  onClick={() => { setFiles([]); setDriveResolvedFiles([]); setDriveFiles([]); }}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {files.map((f, i) => (
                  <div key={`up_${i}`} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{f.name}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {driveResolvedFiles.map((f, i) => (
                  <div key={`drive_${i}`} className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{f.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Weight Configuration */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6">
            <button
              onClick={() => setShowWeights(!showWeights)}
              className="flex items-center gap-2 w-full"
            >
              <Settings2 className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Scoring Weights</h2>
              <span className="ml-auto text-sm text-slate-500">
                {showWeights ? 'Hide' : 'Customize'}
              </span>
            </button>
            {showWeights && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-500">
                  Adjust the weight of each scoring component. Values are relative — the engine normalizes them automatically.
                </p>
                {weightLabels.map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-slate-700">{label}</label>
                      <span className="text-sm text-slate-500 tabular-nums">{weights[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={weights[key]}
                      onChange={(e) => setWeights((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full accent-slate-900"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-600">Total (normalized automatically)</span>
                  <span className="text-sm tabular-nums text-slate-500">
                    {Object.values(weights).reduce((a, b) => a + b, 0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Run Button + Progress */}
        <div className="sticky bottom-0 bg-slate-50 pt-4 pb-6 -mx-6 px-6 border-t border-slate-200">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button
              onClick={handleRun}
              disabled={!canRun}
              className="px-6 py-3 text-base font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {isProcessing ? 'Processing...' : 'Run Ranking'}
            </button>
            <div className="flex-1">
              {isProcessing && progress ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">
                      {progress.phase}: {progress.fileName}
                    </span>
                    <span className="text-sm tabular-nums text-slate-500">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-300"
                      style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {totalFiles} {totalFiles === 1 ? 'resume' : 'resumes'} ready — {jdText.trim().length > 20 ? 'JD provided' : 'paste a job description to begin'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
