import { Repository } from "typeorm";
import { Injectable, BadRequestException } from "@nestjs/common";
import { CreateCandidateDocumentDto } from "./dto/create-candidate-document.dto";
import { SampleCandidate } from "../../entities/sample-candidate.entity";
import { CandidateDocument } from "../../entities/candidate-document.entity";
import { randomUUID } from "crypto";
import { DocumentStorageFacade } from "../../document-storage/document-storage.facade";
import { InjectRepository } from "@nestjs/typeorm";
import { Logger } from "@nestjs/common";

@Injectable()
export class CandidateDocumentService {
  private readonly logger = new Logger(CandidateDocumentService.name);
  constructor(
    private readonly documentStorage: DocumentStorageFacade,
    @InjectRepository(CandidateDocument)
    private readonly candidateDocumentRepository: Repository<CandidateDocument>,
  ) {}

  async create(
    candidate: SampleCandidate,
    file: Express.Multer.File,
    createCandidateDocumentDto: CreateCandidateDocumentDto,
  ) {
    try {
      const storageKey = `candidates/${candidate.workspaceId}/${candidate.id}/${randomUUID()}-${createCandidateDocumentDto.fileName}`;

      await this.documentStorage.upload(storageKey, file.mimetype, file.buffer, file.originalname);

      const rawText = this.documentStorage.getUTF8(file.buffer);

      const newDocument = {
        candidateId: candidate.id,
        workspaceId: candidate.workspaceId,
        documentType: createCandidateDocumentDto.documentType,
        fileName: createCandidateDocumentDto.fileName,
        storageKey,
        rawText,
      };
      return this.candidateDocumentRepository.save(newDocument);
    } catch (error) {
      const err = error as Error;
      this.logger.error("Error uploading document:", err);
      throw new BadRequestException(err.message, err.stack);
    }
  }
}
