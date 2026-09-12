import { useState } from 'react';
import InputScreen from '@/components/InputScreen';
import ResultsScreen from '@/components/ResultsScreen';
import { analyzeJD, DEFAULT_WEIGHTS } from '@/engine/scoring';
import { processResumes, type ProcessItem } from '@/engine/processing';
import type { CandidateResult, JDAnalysis, ProcessProgress, WeightConfig } from '@/types';

type Screen = 'input' | 'results';

function App() {
  const [screen, setScreen] = useState<Screen>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [jd, setJd] = useState<JDAnalysis | null>(null);
  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS);

  const handleRun = async (jdText: string, files: File[], w: WeightConfig) => {
    setIsProcessing(true);
    setProgress({ current: 0, total: files.length, fileName: '', phase: 'Starting' });
    setWeights(w);

    const jdAnalysis = analyzeJD(jdText);
    setJd(jdAnalysis);

    const items: ProcessItem[] = files.map((file, i) => ({
      file,
      fileName: file.name,
    }));

    try {
      const results = await processResumes(items, jdAnalysis, w, setProgress);
      setCandidates(results);
      setScreen('results');
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  const handleBack = () => {
    setScreen('input');
    setCandidates([]);
    setJd(null);
  };

  if (screen === 'results' && jd) {
    return (
      <ResultsScreen
        candidates={candidates}
        jd={jd}
        weights={weights}
        onBack={handleBack}
      />
    );
  }

  return (
    <InputScreen
      onRun={handleRun}
      isProcessing={isProcessing}
      progress={progress}
    />
  );
}

export default App;
