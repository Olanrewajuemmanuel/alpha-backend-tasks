import { Test, TestingModule } from '@nestjs/testing';
import { CandidateDocumentService } from './candidate-document.service';

describe('CandidateDocumentService', () => {
  let service: CandidateDocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateDocumentService],
    }).compile();

    service = module.get<CandidateDocumentService>(CandidateDocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
