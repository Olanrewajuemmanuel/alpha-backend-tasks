import { CandidateSummary } from "../../../entities/candidate-summaries.entity";

export class CreateCandidateSummaryDto {
  summaryId!: string;
  status!: string;
  message!: string;
  next!: string;
  requestTimestamp!: Date;

  static fromEntity(summary: CandidateSummary): CreateCandidateSummaryDto {
    const dto = new CreateCandidateSummaryDto();
    dto.summaryId = summary.id;
    dto.status = summary.status;
    dto.message = "Summary generation is being processed";
    dto.next = `/candidates/${summary.candidateId}/summaries/${summary.id}`;
    dto.requestTimestamp = new Date();
    return dto;
  }
}
