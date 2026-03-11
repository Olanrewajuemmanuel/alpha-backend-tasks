import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SampleCandidate } from '../entities/sample-candidate.entity';

export const SelectedCandidate = createParamDecorator(
  (_, ctx: ExecutionContext): SampleCandidate => {
    return ctx.switchToHttp().getRequest().candidate;
  },
);