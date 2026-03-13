export type RecommendedDecision = 'advance' | 'hold' | 'reject';

export interface CandidateSummaryResult {
  score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  recommendedDecision: RecommendedDecision;
  provider?: string;
  promptVersion?: string;
}

export interface CandidateSummaryInput {
  candidateId: string;
  documents: string[];
}

export interface SummarizationProvider {
  generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult>;
}

export const SUMMARIZATION_PROVIDER = Symbol('SUMMARIZATION_PROVIDER');
export const CLAUDE_SUMMARIZATION_PROVIDER = Symbol('CLAUDE_SUMMARIZATION_PROVIDER');
