import { CandidateSummary } from "../../../entities/candidate-summaries.entity";

export class CreateCandidateSummaryDto {
  summaryId!: string;
  status!: string;
  message!: string;

  static fromEntity(summary: CandidateSummary): CreateCandidateSummaryDto {
    const dto = new CreateCandidateSummaryDto();
    dto.summaryId = summary.id;
    dto.status = summary.status;
    dto.message = "Summary generation queued";
    return dto;
  }
}
