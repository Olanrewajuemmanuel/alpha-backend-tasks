import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CandidateDocument } from '../../entities/candidate-document.entity';
import { SampleCandidate } from '../../entities/sample-candidate.entity';
import { CandidateDocumentService } from './candidate-document.service';
import { DocumentStorageFacade } from '../../document-storage/document-storage.facade';
import { CreateCandidateDocumentDto } from './dto/create-candidate-document.dto';
import { DocumentTypeEnum } from '../../entities/candidate-document.entity';

describe('CandidateDocumentService', () => {
  let service: CandidateDocumentService;
  let documentStorage: DocumentStorageFacade;
  let candidateDocumentRepository: jest.Mocked<Repository<CandidateDocument>>;

  const mockDocumentStorage = {
    upload: jest.fn(),
    getUTF8: jest.fn(),
  };

  const mockCandidateDocumentRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateDocumentService,
        {
          provide: DocumentStorageFacade,
          useValue: mockDocumentStorage,
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: mockCandidateDocumentRepository,
        },
      ],
    }).compile();

    service = module.get<CandidateDocumentService>(CandidateDocumentService);
    documentStorage = module.get<DocumentStorageFacade>(DocumentStorageFacade);
    candidateDocumentRepository = module.get(getRepositoryToken(CandidateDocument));
  });

  const mockCandidate: SampleCandidate = {
    id: 'candidate-1',
    workspaceId: 'workspace-1',
    fullName: 'John Doe',
    email: 'john@example.com',
  } as SampleCandidate;

  const mockFile: Express.Multer.File = {
    originalname: 'resume.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('mock file content'),
    size: 1024,
    fieldname: 'file',
    encoding: '7bit',
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockCreateDto: CreateCandidateDocumentDto = {
    fileName: 'resume.pdf',
    documentType: DocumentTypeEnum.RESUME,
  };

  describe('create', () => {
    it('should create and save candidate document successfully', async () => {
      const expectedStorageKey = 'candidates/workspace-1/candidate-1/uuid-resume.pdf';
      const expectedRawText = 'extracted text content';
      const expectedDocument = {
        candidateId: mockCandidate.id,
        workspaceId: mockCandidate.workspaceId,
        documentType: mockCreateDto.documentType,
        fileName: mockCreateDto.fileName,
        storageKey: expectedStorageKey,
        rawText: expectedRawText,
        id: 'doc-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDocumentStorage.upload.mockResolvedValue(undefined);
      mockDocumentStorage.getUTF8.mockReturnValue(expectedRawText);
      mockCandidateDocumentRepository.save.mockResolvedValue(expectedDocument);

      const result = await service.create(mockCandidate, mockFile, mockCreateDto);

      expect(documentStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^candidates\/workspace-1\/candidate-1\/.*-resume\.pdf$/),
        mockFile.mimetype,
        mockFile.buffer,
        mockFile.originalname
      );
      expect(documentStorage.getUTF8).toHaveBeenCalledWith(mockFile.buffer);
      expect(candidateDocumentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateId: mockCandidate.id,
          workspaceId: mockCandidate.workspaceId,
          documentType: mockCreateDto.documentType,
          fileName: mockCreateDto.fileName,
          storageKey: expect.stringMatching(/^candidates\/workspace-1\/candidate-1\/.*-resume\.pdf$/),
          rawText: expectedRawText,
        })
      );
      expect(result).toEqual(expectedDocument);
    });

    it('should throw BadRequestException when document storage upload fails', async () => {
      const uploadError = new Error('Storage upload failed');
      mockDocumentStorage.upload.mockRejectedValue(uploadError);

      await expect(service.create(mockCandidate, mockFile, mockCreateDto))
        .rejects.toThrow(BadRequestException);

      expect(candidateDocumentRepository.save).not.toHaveBeenCalled();
    });

    it('should handle different document types correctly', async () => {
      const coverLetterDto: CreateCandidateDocumentDto = {
        fileName: 'cover-letter.docx',
        documentType: DocumentTypeEnum.COVER_LETTER,
      };

      mockDocumentStorage.upload.mockResolvedValue(undefined);
      mockDocumentStorage.getUTF8.mockReturnValue('cover letter text');
      mockCandidateDocumentRepository.save.mockResolvedValue({
        id: 'doc-2',
        candidateId: mockCandidate.id,
        workspaceId: mockCandidate.workspaceId,
        documentType: 'cover_letter',
        fileName: 'cover-letter.docx',
        storageKey: 'storage-key',
        rawText: 'cover letter text',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(mockCandidate, mockFile, coverLetterDto);

      expect(result.documentType).toBe('cover_letter');
      expect(result.fileName).toBe('cover-letter.docx');
      expect(candidateDocumentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          documentType: 'cover_letter',
          fileName: 'cover-letter.docx',
        })
      );
    });

    it('should generate unique storage keys for multiple documents', async () => {
      const secondFile = { ...mockFile, originalname: 'transcript.pdf' };
      const secondDto: CreateCandidateDocumentDto = {
        fileName: 'transcript.pdf',
        documentType: DocumentTypeEnum.OTHER,
      };

      mockDocumentStorage.upload.mockResolvedValue(undefined);
      mockDocumentStorage.getUTF8.mockReturnValue('transcript text');
      mockCandidateDocumentRepository.save.mockResolvedValue({
        id: 'doc-3',
        candidateId: mockCandidate.id,
        workspaceId: mockCandidate.workspaceId,
        documentType: DocumentTypeEnum.OTHER,
        fileName: 'transcript.pdf',
        storageKey: 'storage-key-2',
        rawText: 'transcript text',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.create(mockCandidate, mockFile, mockCreateDto);
      await service.create(mockCandidate, secondFile, secondDto);

      expect(documentStorage.upload).toHaveBeenCalledTimes(2);
      expect(documentStorage.upload).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/^candidates\/workspace-1\/candidate-1\/.*-resume\.pdf$/),
        mockFile.mimetype,
        mockFile.buffer,
        mockFile.originalname
      );
      expect(documentStorage.upload).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/^candidates\/workspace-1\/candidate-1\/.*-transcript\.pdf$/),
        secondFile.mimetype,
        secondFile.buffer,
        secondFile.originalname
      );
    });
  });
});
