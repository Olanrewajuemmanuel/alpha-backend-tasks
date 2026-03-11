import { DataSource } from 'typeorm';
import { CandidateDocument, DocumentTypeEnum } from '../entities/candidate-document.entity';
import { Seeder } from 'typeorm-extension';

export class CandidateDocumentSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(CandidateDocument);

    const documents: Partial<CandidateDocument>[] = [
      {
        candidateId: '1',
        documentType: DocumentTypeEnum.RESUME,
        fileName: 'resume.pdf',
        storageKey: 'uploads/candidates/1/resume-001.pdf',
        rawText: 'John Doe\nSoftware Engineer\njohn.doe@example.com',
      },
    ];

    await repository.save(documents);
  }
}
