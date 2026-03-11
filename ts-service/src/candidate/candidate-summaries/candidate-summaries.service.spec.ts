import { Test, TestingModule } from '@nestjs/testing';
import { CandidateSummariesService } from './candidate-summaries.service';

describe('CandidateSummariesService', () => {
  let service: CandidateSummariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateSummariesService],
    }).compile();

    service = module.get<CandidateSummariesService>(CandidateSummariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
