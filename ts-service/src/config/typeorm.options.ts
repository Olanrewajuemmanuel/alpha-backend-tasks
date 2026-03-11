import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SampleCandidate } from "../entities/sample-candidate.entity";
import { SampleWorkspace } from "../entities/sample-workspace.entity";
import { CandidateDocument } from "../entities/candidate-document.entity";
import { CandidateSummary } from "../entities/candidate-summaries.entity";
import { DataSourceOptions } from "typeorm";

import { SeederOptions } from "typeorm-extension";

export const defaultDatabaseUrl =
  "postgres://assessment_user:assessment_pass@localhost:5432/assessment_db";

export const getTypeOrmOptions = (
  databaseUrl: string,
): TypeOrmModuleOptions & DataSourceOptions & SeederOptions => ({
  type: "postgres",
  url: databaseUrl,
  entities: [
    SampleCandidate,
    SampleWorkspace,
    CandidateDocument,
    CandidateSummary,
  ],
  migrations: [__dirname + "/src/migrations/**/*{.ts,.js}"],
  migrationsTableName: "typeorm_migrations",
  synchronize: false,
  logging: false,
  seeds: [__dirname + "/src/seeds/**/*{.ts,.js}"],
});
