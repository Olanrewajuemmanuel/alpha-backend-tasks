import { Module } from '@nestjs/common';
import { CandidateSummariesService } from './candidate-summaries.service';
import { CandidateSummariesController } from './candidate-summaries.controller';

@Module({
  controllers: [CandidateSummariesController],
  providers: [CandidateSummariesService],
})
export class CandidateSummariesModule {}
