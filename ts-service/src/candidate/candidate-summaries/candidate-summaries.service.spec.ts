import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CandidateSummary } from '../../entities/candidate-summaries.entity';
import { CandidateDocument } from '../../entities/candidate-document.entity';
import { SampleCandidate } from '../../entities/sample-candidate.entity';
import { CandidateSummariesService } from './candidate-summaries.service';
import { IQueue } from '../../queue/contract/queue.contract';
import { CreateCandidateSummaryDto } from './dto/create-candidate-summary.dto';
import { RetrieveCandidateSummaryResponseDto } from './dto/retrieve-candidate-summary.dto';
import { SummaryStatusEnum } from '../../entities/candidate-summaries.entity';
import { CANDIDATE_SUMMARIES_QUEUE } from './constants/injection-tokens';
import { DocumentTypeEnum } from '../../entities/candidate-document.entity';

describe('CandidateSummariesService', () => {
  let service: CandidateSummariesService;
  let candidateSummaryRepository: jest.Mocked<Repository<CandidateSummary>>;
  let candidateDocumentRepository: jest.Mocked<Repository<CandidateDocument>>;
  let queueService: jest.Mocked<IQueue>;

  const mockCandidateSummaryRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCandidateDocumentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockQueueService = {
    enqueue: jest.fn(),
    getQueuedJobs: jest.fn(),
    dequeue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateSummariesService,
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: mockCandidateSummaryRepository,
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: mockCandidateDocumentRepository,
        },
        {
          provide: CANDIDATE_SUMMARIES_QUEUE,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<CandidateSummariesService>(CandidateSummariesService);
    candidateSummaryRepository = module.get(getRepositoryToken(CandidateSummary));
    candidateDocumentRepository = module.get(getRepositoryToken(CandidateDocument));
    queueService = module.get(CANDIDATE_SUMMARIES_QUEUE);
  });

  const mockCandidate: SampleCandidate = {
    id: 'candidate-1',
    fullName: 'John Doe',
    email: 'john@example.com',
  } as SampleCandidate;

  const mockDocuments: CandidateDocument[] = [
    {
      id: 'doc-1',
      candidateId: 'candidate-1',
      documentType: DocumentTypeEnum.RESUME,
      fileName: 'resume.pdf',
      storageKey: 'storage-key-1',
      rawText: 'Resume content here',
    } as any,
    {
      id: 'doc-2',
      candidateId: 'candidate-1',
      documentType: DocumentTypeEnum.COVER_LETTER,
      fileName: 'cover-letter.pdf',
      storageKey: 'storage-key-2',
      rawText: 'Cover letter content here',
    } as any,
  ];

  describe('create', () => {
    it('should create summary and enqueue job when candidate has documents', async () => {
      const expectedSummary = {
        id: 'summary-1',
        candidateId: mockCandidate.id,
        status: SummaryStatusEnum.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCandidateDocumentRepository.find.mockResolvedValue(mockDocuments);
      mockCandidateSummaryRepository.save.mockResolvedValue(expectedSummary);
      mockQueueService.enqueue.mockReturnValue({
        id: 'job-1',
        name: 'candidate-summaries-generation',
        payload: { summaryId: 'summary-1', candidateId: 'candidate-1' },
        enqueuedAt: new Date().toISOString(),
      });

      const result = await service.create(mockCandidate);

      expect(candidateDocumentRepository.find).toHaveBeenCalledWith({
        where: { candidateId: mockCandidate.id },
      });
      expect(candidateSummaryRepository.save).toHaveBeenCalledWith({
        candidateId: mockCandidate.id,
        status: SummaryStatusEnum.PENDING,
      });
      expect(queueService.enqueue).toHaveBeenCalledWith(
        'candidate-summaries-generation',
        { summaryId: 'summary-1', candidateId: 'candidate-1' }
      );
      expect(result).toBeInstanceOf(CreateCandidateSummaryDto);
      expect((result as any).summaryId).toBe('summary-1');
      expect((result as any).status).toBe(SummaryStatusEnum.PENDING);
    });

    it('should throw UnprocessableEntityException when candidate has no documents', async () => {
      mockCandidateDocumentRepository.find.mockResolvedValue([]);

      await expect(service.create(mockCandidate))
        .rejects.toThrow(UnprocessableEntityException);
      await expect(service.create(mockCandidate))
        .rejects.toThrow('This candidate has no documents to summarize.');

      expect(candidateSummaryRepository.save).not.toHaveBeenCalled();
      expect(queueService.enqueue).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockCandidateDocumentRepository.find.mockRejectedValue(dbError);

      await expect(service.create(mockCandidate))
        .rejects.toThrow(dbError);

      expect(candidateSummaryRepository.save).not.toHaveBeenCalled();
      expect(queueService.enqueue).not.toHaveBeenCalled();
    });

    it('should work with single document', async () => {
      const singleDocument = [mockDocuments[0]];
      const expectedSummary = {
        id: 'summary-2',
        candidateId: mockCandidate.id,
        status: SummaryStatusEnum.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCandidateDocumentRepository.find.mockResolvedValue(singleDocument);
      mockCandidateSummaryRepository.save.mockResolvedValue(expectedSummary);
      mockQueueService.enqueue.mockReturnValue({
        id: 'job-2',
        name: 'candidate-summaries-generation',
        payload: { summaryId: 'summary-2', candidateId: 'candidate-1' },
        enqueuedAt: new Date().toISOString(),
      });

      const result = await service.create(mockCandidate);

      expect((result as any).summaryId).toBe('summary-2');
      expect(queueService.enqueue).toHaveBeenCalledWith(
        'candidate-summaries-generation',
        { summaryId: 'summary-2', candidateId: 'candidate-1' }
      );
    });
  });

  describe('findAll', () => {
    it('should return all summaries for a candidate', async () => {
      const mockSummaries = [
        {
          id: 'summary-1',
          candidateId: mockCandidate.id,
          status: SummaryStatusEnum.COMPLETED,
          score: 85,
          strengths: ['Strong technical skills'],
          concerns: ['Limited experience'],
          summary: 'Good candidate overall',
          recommendedDecision: 'advance',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'summary-2',
          candidateId: mockCandidate.id,
          status: SummaryStatusEnum.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as CandidateSummary[];

      mockCandidateSummaryRepository.find.mockResolvedValue(mockSummaries);

      const result = await service.findAll(mockCandidate.id);

      expect(candidateSummaryRepository.find).toHaveBeenCalledWith({
        where: { candidateId: mockCandidate.id },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(RetrieveCandidateSummaryResponseDto);
      expect(result[0].id).toBe('summary-1');
      expect(result[0].status).toBe(SummaryStatusEnum.COMPLETED);
      expect(result[1].id).toBe('summary-2');
      expect(result[1].status).toBe(SummaryStatusEnum.PENDING);
    });

    it('should return empty array when candidate has no summaries', async () => {
      mockCandidateSummaryRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockCandidate.id);

      expect(result).toEqual([]);
      expect(candidateSummaryRepository.find).toHaveBeenCalledWith({
        where: { candidateId: mockCandidate.id },
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      mockCandidateSummaryRepository.find.mockRejectedValue(dbError);

      await expect(service.findAll(mockCandidate.id))
        .rejects.toThrow(dbError);
    });
  });

  describe('findOne', () => {
    const mockSummary = {
      id: 'summary-1',
      candidateId: mockCandidate.id,
      status: SummaryStatusEnum.COMPLETED,
      score: 90,
      strengths: ['Excellent communication', 'Strong technical background'],
      concerns: ['No management experience'],
      summary: 'Highly recommended candidate',
      recommendedDecision: 'advance',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CandidateSummary;

    it('should return summary when found', async () => {
      mockCandidateSummaryRepository.findOne.mockResolvedValue(mockSummary);

      const result = await service.findOne(mockCandidate.id, 'summary-1');

      expect(candidateSummaryRepository.findOne).toHaveBeenCalledWith({
        where: { candidateId: mockCandidate.id, id: 'summary-1' },
      });
      expect(result).toBeInstanceOf(RetrieveCandidateSummaryResponseDto);
      expect(result.id).toBe('summary-1');
      expect(result.status).toBe(SummaryStatusEnum.COMPLETED);
      expect(result.score).toBe(90);
    });

    it('should throw NotFoundException when summary not found', async () => {
      mockCandidateSummaryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockCandidate.id, 'non-existent'))
        .rejects.toThrow(BadRequestException);
      await expect(service.findOne(mockCandidate.id, 'non-existent'))
        .rejects.toThrow('Summary not found.');

      expect(candidateSummaryRepository.findOne).toHaveBeenCalledWith({
        where: { candidateId: mockCandidate.id, id: 'non-existent' },
      });
    });

    it('should throw NotFoundException when summary belongs to different candidate', async () => {
      const otherCandidateSummary = { ...mockSummary, candidateId: 'other-candidate' };
      mockCandidateSummaryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockCandidate.id, 'summary-1'))
        .rejects.toThrow(BadRequestException);

      expect(candidateSummaryRepository.findOne).toHaveBeenCalledWith({
        where: { candidateId: mockCandidate.id, id: 'summary-1' },
      });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockCandidateSummaryRepository.findOne.mockRejectedValue(dbError);

      await expect(service.findOne(mockCandidate.id, 'summary-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: create -> findAll -> findOne', async () => {
      const expectedSummary = {
        id: 'summary-1',
        candidateId: mockCandidate.id,
        status: SummaryStatusEnum.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCandidateDocumentRepository.find.mockResolvedValue(mockDocuments);
      mockCandidateSummaryRepository.save.mockResolvedValue(expectedSummary);
      mockQueueService.enqueue.mockReturnValue({
        id: 'job-1',
        name: 'candidate-summaries-generation',
        payload: { summaryId: 'summary-1', candidateId: 'candidate-1' },
        enqueuedAt: new Date().toISOString(),
      });

      const createdSummary = await service.create(mockCandidate);

      mockCandidateSummaryRepository.find.mockResolvedValue([expectedSummary]);
      const allSummaries = await service.findAll(mockCandidate.id);

      mockCandidateSummaryRepository.findOne.mockResolvedValue(expectedSummary);
      const foundSummary = await service.findOne(mockCandidate.id, 'summary-1');

      expect((createdSummary as any).summaryId).toBe('summary-1');
      expect(allSummaries).toHaveLength(1);
      expect((allSummaries[0] as any).id).toBe('summary-1');
      expect((foundSummary as any).id).toBe('summary-1');
    });
  });
});
