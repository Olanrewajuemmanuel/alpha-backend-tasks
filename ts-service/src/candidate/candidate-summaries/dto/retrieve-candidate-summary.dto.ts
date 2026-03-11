import { SummaryStatusEnum, RecommendedDecisionEnum, CandidateSummary } from '../../../entities/candidate-summaries.entity';

export class RetrieveCandidateSummaryResponseDto {
  id!: string;
  candidateId!: string;
  status!: SummaryStatusEnum;
  score!: number | null;
  strengths!: string[] | null;
  concerns!: string[] | null;
  summary!: string | null;
  recommendedDecision!: RecommendedDecisionEnum | null;
  provider!: string | null;
  promptVersion!: string | null;
  errorMessage!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(summary: CandidateSummary): RetrieveCandidateSummaryResponseDto {
    const dto = new RetrieveCandidateSummaryResponseDto();
    dto.id = summary.id;
    dto.candidateId = summary.candidateId;
    dto.status = summary.status;
    dto.score = summary.score;
    dto.strengths = summary.strengths;
    dto.concerns = summary.concerns;
    dto.summary = summary.summary;
    dto.recommendedDecision = summary.recommendedDecision;
    dto.provider = summary.provider;
    dto.promptVersion = summary.promptVersion;
    dto.errorMessage = summary.errorMessage;
    dto.createdAt = summary.createdAt;
    dto.updatedAt = summary.updatedAt;
    return dto;
  }
}