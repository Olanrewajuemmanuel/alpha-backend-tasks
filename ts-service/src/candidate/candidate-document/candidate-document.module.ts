import { Module } from "@nestjs/common";
import { CandidateDocumentService } from "./candidate-document.service";
import { CandidateDocumentController } from "./candidate-document.controller";
import { AuthModule } from "../../auth/auth.module";
import { SampleModule } from "../../sample/sample.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CandidateDocument } from "../../entities/candidate-document.entity";
import { DocumentStorageFacade } from "../../document-storage/document-storage.facade";

@Module({
  imports: [
    AuthModule,
    SampleModule,
    TypeOrmModule.forFeature([CandidateDocument]),
  ],
  controllers: [CandidateDocumentController],
  providers: [CandidateDocumentService, DocumentStorageFacade],
})
export class CandidateDocumentModule {}
