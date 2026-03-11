import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { SampleCandidate } from "../../entities/sample-candidate.entity";
import {
  CandidateSummary,
  SummaryStatusEnum,
} from "../../entities/candidate-summaries.entity";
import { CandidateDocument } from "../../entities/candidate-document.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateCandidateSummaryDto } from "./dto/create-candidate-summary.dto";
import { CANDIDATE_SUMMARIES_QUEUE } from "./constants/injection-tokens";
import { RetrieveCandidateSummaryResponseDto } from "./dto/retrieve-candidate-summary.dto";
import { IQueue } from "../../queue/contract/queue.contract";

@Injectable()
export class CandidateSummariesService {
  constructor(
    @InjectRepository(CandidateSummary)
    private candidateSummaryRepository: Repository<CandidateSummary>,
    @InjectRepository(CandidateDocument)
    private candidateDocumentRepository: Repository<CandidateDocument>,
    @Inject(CANDIDATE_SUMMARIES_QUEUE)
    private readonly queueService: IQueue,
  ) {}
  async create(candidate: SampleCandidate) {
    try {
      const candidateDocuments = await this.candidateDocumentRepository.find({
        where: { candidateId: candidate.id },
      });
      if (candidateDocuments.length === 0) {
        throw new UnprocessableEntityException(
          "This candidate has no documents to summarize.",
        );
      }
      const newSummary = {
        candidateId: candidate.id,
        status: SummaryStatusEnum.PENDING,
      };
      const summary = await this.candidateSummaryRepository.save(newSummary);

      this.queueService.enqueue(CANDIDATE_SUMMARIES_QUEUE.toString(), {
        summaryId: summary.id,
      });
      return CreateCandidateSummaryDto.fromEntity(summary);
    } catch (error) {
      const err = error as Error;
      throw err;
    }
  }

  async findAll(candidateId: string) {
    const summaries = await this.candidateSummaryRepository.find({
      where: { candidateId },
    });
    return summaries.map(RetrieveCandidateSummaryResponseDto.fromEntity);
  }

  async findOne(candidateId: string, summaryId: string) {
    try {
      const summary = await this.candidateSummaryRepository.findOne({
        where: { candidateId, id: summaryId },
      });
      if (!summary) {
        throw new NotFoundException("Summary not found.");
      }
      return RetrieveCandidateSummaryResponseDto.fromEntity(summary);
    } catch (error) {
      const err = error as Error;
      throw new BadRequestException(err.message, err.stack);
    }
  }
}
