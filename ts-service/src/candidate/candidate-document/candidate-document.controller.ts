import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { CandidateDocumentService } from "./candidate-document.service";
import { CreateCandidateDocumentDto } from "./dto/create-candidate-document.dto";
import { FakeAuthGuard } from "../../auth/fake-auth.guard";
import { WorkspaceGuard } from "../../auth/workspace.guard";
import { SelectedCandidate } from "../../auth/selected-candidate.decorator";
import { SampleCandidate } from "../../entities/sample-candidate.entity";
import { FileInterceptor } from "@nestjs/platform-express";

@UseGuards(FakeAuthGuard, WorkspaceGuard)
@Controller("candidates/:candidateId/documents")
export class CandidateDocumentController {
  constructor(
    private readonly candidateDocumentService: CandidateDocumentService,
  ) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post()
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
