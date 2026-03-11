import { Module } from "@nestjs/common";
import { CandidateDocumentModule } from "./candidate-document/candidate-document.module";
import { CandidateSummariesModule } from "./candidate-summaries/candidate-summaries.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SampleCandidate } from "../entities/sample-candidate.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SampleCandidate
        ]),
        CandidateDocumentModule,
        CandidateSummariesModule,
    ],
    exports: [CandidateModule, CandidateDocumentModule, CandidateSummariesModule],
})
export class CandidateModule {}
