import { Module } from "@nestjs/common";
import { CandidateSummariesService } from "./candidate-summaries.service";
import { CandidateSummariesController } from "./candidate-summaries.controller";
import { AuthModule } from "../../auth/auth.module";
import { SampleModule } from "../../sample/sample.module";
import { QueueService } from "../../queue/queue.service";
import { CANDIDATE_SUMMARIES_QUEUE } from "./constants/injection-tokens";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CandidateSummary } from "../../entities/candidate-summaries.entity";
import { CandidateDocument } from "../../entities/candidate-document.entity";
import { QueueModule } from "../../queue/queue.module";

@Module({
  imports: [
    AuthModule,
    SampleModule,
    QueueModule,
    TypeOrmModule.forFeature([CandidateSummary, CandidateDocument]),
  ],
  controllers: [CandidateSummariesController],
  providers: [
    CandidateSummariesService,
    {
      useExisting: QueueService,
      provide: CANDIDATE_SUMMARIES_QUEUE,
    },
  ],
})
export class CandidateSummariesModule {}
