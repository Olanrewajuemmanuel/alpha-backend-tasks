import { Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CandidateSummariesService } from './candidate-summaries.service';
import { FakeAuthGuard } from '../../auth/fake-auth.guard';
import { WorkspaceGuard } from '../../auth/workspace.guard';
import { SelectedCandidate } from '../../auth/selected-candidate.decorator';
import { SampleCandidate } from '../../entities/sample-candidate.entity';


@UseGuards(FakeAuthGuard, WorkspaceGuard)
@Controller('candidates/:candidateId/summaries')
export class CandidateSummariesController {
  constructor(private readonly candidateSummariesService: CandidateSummariesService) {}

  @Get()
  findAll(@SelectedCandidate() candidate: SampleCandidate) {
    return this.candidateSummariesService.findAll(candidate.id);
  }

  @Get(":summaryId")
  findOne(@SelectedCandidate() candidate: SampleCandidate, @Param('summaryId') summaryId: string) {
    return this.candidateSummariesService.findOne(candidate.id, summaryId);
  }

  @Post("generate")
  @HttpCode(HttpStatus.ACCEPTED)
  create(@SelectedCandidate() candidate: SampleCandidate) {
    return this.candidateSummariesService.create(candidate);
  } 

}
