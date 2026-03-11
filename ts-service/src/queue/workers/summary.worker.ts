import { Inject, Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { IQueue } from "../contract/queue.contract";
import { CANDIDATE_SUMMARIES_QUEUE } from "../../candidate/candidate-summaries/constants/injection-tokens";
import { CandidateSummary, RecommendedDecisionEnum, SummaryStatusEnum } from "../../entities/candidate-summaries.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CandidateDocument } from "../../entities/candidate-document.entity";
import { CandidateSummaryResult, SummarizationProvider } from "../../llm/summarization-provider.interface";
import { IWorker } from "./contract/worker.contract";
import { SUMMARIZATION_PROVIDER } from "../../llm/summarization-provider.interface";


export const CANDIDATE_SUMMARIES_GENERATION_JOB_NAME = 'candidate-summaries-generation';
export const SUMMARY_WORKER_INTERVAL = 5000;

/**
 * Consumes summary generation jobs from the queue
 */
@Injectable()
export class SummaryWorker implements IWorker {
  private readonly logger = new Logger(SummaryWorker.name);
  private readonly currentJobsIds = new Set<string>();

  constructor(
    @Inject(CANDIDATE_SUMMARIES_QUEUE)
    private readonly queueService: IQueue,
    @InjectRepository(CandidateSummary)
    private readonly candidateSummaryRepository: Repository<CandidateSummary>,
    @InjectRepository(CandidateDocument)
    private readonly candidateDocumentRepository: Repository<CandidateDocument>,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
  ) {}

  @Interval('summary-worker', SUMMARY_WORKER_INTERVAL)
  async poll(): Promise<void> {
    // Filter jobs that are in the summary queue and not currently being processed
    const jobs = this.queueService
      .getQueuedJobs()
      .filter(
        (job) =>
          job.name === CANDIDATE_SUMMARIES_GENERATION_JOB_NAME &&
          !this.currentJobsIds.has(job.id),
      );

    for (const job of jobs) {
      this.currentJobsIds.add(job.id);
      //   Delete/Dequeue job whether failed or not
      const { summaryId, candidateId } = job.payload as unknown as SummaryJob;
      await this.run(new SummaryJob(job.id, summaryId, candidateId)).finally(
        () => {
          this.currentJobsIds.delete(job.id);
          this.queueService.dequeue(job.id);
        },
      );
    }
  }

  async run(job: SummaryJob): Promise<void> {
    this.logger.log(
      `Processing summary job ${job.id} for summary ${job.summaryId} and candidate ${job.candidateId}`,
    );
    try {
      const candidateDocuments = await this.candidateDocumentRepository.find({
        where: { candidateId: job.candidateId },
      });
      
      if (candidateDocuments.length === 0) {
        const error = new Error();
        error.name = "NoDocumentsFoundError";
        error.message = "No documents found for candidate";
        throw error;
      }

      const {
        score,
        strengths,
        concerns,
        summary,
        recommendedDecision,
      }: CandidateSummaryResult = await this.summarizationProvider.generateCandidateSummary({
        candidateId: job.candidateId,
        documents: candidateDocuments.map((doc) => doc.rawText),
      });

      await this.candidateSummaryRepository.update(job.summaryId, {
        status: SummaryStatusEnum.COMPLETED,
        score,
        strengths,
        concerns,
        summary,
        recommendedDecision: recommendedDecision as unknown as RecommendedDecisionEnum,
      });
    } catch (error: unknown) {
      const err = error as Error;
      await this.candidateSummaryRepository.update(job.summaryId, {
        status: SummaryStatusEnum.FAILED,
        errorMessage: err.message ?? "Unknown error",
      });
      this.logger.error(`Failed to process summary job ${job.id}:`, error);
      throw error; // propagate err call up
    }
  }
}

// Keep as runtime JS dataclass
class SummaryJob {
  id: string;
  summaryId!: string;
  candidateId!: string;

  constructor(id: string, summaryId: string, candidateId: string) {
    this.id = id;
    this.summaryId = summaryId;
    this.candidateId = candidateId;
  }
}