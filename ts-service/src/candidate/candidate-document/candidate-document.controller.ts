import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { CandidateDocumentService } from "./candidate-document.service";
import { CreateCandidateDocumentDto } from "./dto/create-candidate-document.dto";
import { FakeAuthGuard } from "src/auth/fake-auth.guard";
import { WorkspaceGuard } from "src/auth/workspace.guard";
import { SelectedCandidate } from "src/auth/selected-candidate.decorator";
import { SampleCandidate } from "src/entities/sample-candidate.entity";
import { FileInterceptor } from "@nestjs/platform-express";

@UseGuards(FakeAuthGuard, WorkspaceGuard)
@Controller("candidates")
export class CandidateDocumentController {
  constructor(
    private readonly candidateDocumentService: CandidateDocumentService,
  ) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post("/:candidateId/documents")
  create(
    @Body() createCandidateDocumentDto: CreateCandidateDocumentDto,
    @SelectedCandidate() candidate: SampleCandidate,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.candidateDocumentService.create(candidate, file, createCandidateDocumentDto);
  }
}
