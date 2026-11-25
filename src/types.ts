export type AIProvider = 'deepseek' | 'zhipu';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface InfoCardData {
  id: string;
  title: string;
  tag: string;
  isMalicious: boolean;
  category: string;
  hp: number;
  reason: string;
}

export interface MistakeRecord {
  card: InfoCardData;
  type: 'missed_malicious' | 'killed_safe';
}

export interface CategoryStat {
  total: number;
  correct: number;
}

export interface GameReport {
  score: number;
  maxCombo: number;
  waveReached: number;
  accuracy: number;
  totalHandled: number;
  correctCount: number;
  categoryStats: Record<string, CategoryStat>;
  mistakes: MistakeRecord[];
}

export interface AnalyzeResult {
  source: string;
  riskScore: number;
  verdict: string;
  category: string;
  highlights: string[];
  advice: string;
}
