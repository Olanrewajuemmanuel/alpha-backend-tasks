import { Module } from "@nestjs/common";

import { QueueService } from "./queue.service";
import { SummaryWorker } from "./workers/summary.worker";
import { CANDIDATE_SUMMARIES_QUEUE } from "../candidate/candidate-summaries/constants/injection-tokens";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CandidateDocument } from "../entities/candidate-document.entity";
import { CandidateSummary } from "../entities/candidate-summaries.entity";
import { HuggingFaceSummarizationProvider } from "../llm/huggingface-summarization.provider";
import { SUMMARIZATION_PROVIDER } from "../llm/summarization-provider.interface";

@Module({
  imports: [TypeOrmModule.forFeature([CandidateDocument, CandidateSummary])],
  providers: [
    QueueService,
    SummaryWorker,
    {
      provide: CANDIDATE_SUMMARIES_QUEUE,
      useExisting: QueueService,
    },
    {
      provide: SUMMARIZATION_PROVIDER,
      useClass: HuggingFaceSummarizationProvider,
    },
  ],
  exports: [QueueService],
})
export class QueueModule {}
