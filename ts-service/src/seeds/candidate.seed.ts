import { Seeder } from "typeorm-extension";
import { SampleCandidate } from "../entities/sample-candidate.entity";
import { DataSource } from "typeorm";

export default class CandidateSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(SampleCandidate);
    const sampleCandidates = [
      {
        id: "1", // hard-coded ids to track seeds easily
        workspaceId: "1",
        fullName: "John Doe",
        email: "john.doe@example.com",
      },
      {
        id: "2",
        workspaceId: "1",
        fullName: "Jane Smith",
        email: "jane.smith@example.com",
      },
      {
        id: "3",
        workspaceId: "2",
        fullName: "Scarlett Johannsen",
        email: "scarlett.johannsen@example.com",
      },
      {
        id: "4",
        workspaceId: "3",
        fullName: "Larry Olaleru",
        email: "larry.olaleru@example.com",
      },
    ];

    const allCandidates = await repository.find({
      take: 100,
    });

    const missingCandidates = sampleCandidates.filter(
      (candidate) => !allCandidates.find((sc) => sc.email === candidate.email),
    );

    if (missingCandidates.length > 0) {
      await repository.save(missingCandidates);
    }
  }
}
