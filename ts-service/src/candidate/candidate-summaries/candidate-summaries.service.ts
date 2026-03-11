import { Injectable } from '@nestjs/common';
import { CreateCandidateSummaryDto } from './dto/create-candidate-summary.dto';

@Injectable()
export class CandidateSummariesService {
  create(createCandidateSummaryDto: CreateCandidateSummaryDto) {
    return 'This action adds a new candidateSummary';
  }

  findAll() {
    return `This action returns all candidateSummaries`;
  }

  findOne(id: number) {
    return `This action returns a #${id} candidateSummary`;
  }
}
