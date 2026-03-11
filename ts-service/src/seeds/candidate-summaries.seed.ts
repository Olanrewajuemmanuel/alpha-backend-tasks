import { CandidateSummary, RecommendedDecisionEnum, SummaryStatusEnum } from '../entities/candidate-summaries.entity';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

export class CandidateSummariesSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(CandidateSummary);

    const summaries: Partial<CandidateSummary>[] = [
      {
        candidateId: '1',
        recommendedDecision: RecommendedDecisionEnum.ADVANCE,
        status: SummaryStatusEnum.COMPLETED,
        score: 85,
        strengths: ['Strong technical skills, good communication'],
        summary: 'John Doe is a software engineer with 5 years of experience in web development.',
        provider: 'openai',
        promptVersion: 'v1',
      },
    ];

    await repository.save(summaries);
  }
}
