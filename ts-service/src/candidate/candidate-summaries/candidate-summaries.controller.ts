import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CandidateSummariesService } from './candidate-summaries.service';
import { CreateCandidateSummaryDto } from './dto/create-candidate-summary.dto';


@Controller('candidates')
export class CandidateSummariesController {
  constructor(private readonly candidateSummariesService: CandidateSummariesService) {}

  @Get("/:candidateId/summaries")
  findAll() {
    return this.candidateSummariesService.findAll();
  }

  @Get("/:candidateId/summaries/:summaryId")
  findOne(@Param('summaryId') summaryId: string) {
    return this.candidateSummariesService.findOne(+summaryId);
  }

  @Post("/:candidateId/summaries/generate")
  create(@Body() createCandidateSummaryDto: CreateCandidateSummaryDto) {
    return this.candidateSummariesService.create(createCandidateSummaryDto);
  } 

}
