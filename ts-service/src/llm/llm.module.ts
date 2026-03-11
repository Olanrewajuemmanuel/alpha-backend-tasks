import { Module } from '@nestjs/common';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { CLAUDE_SUMMARIZATION_PROVIDER, SUMMARIZATION_PROVIDER } from './summarization-provider.interface';
import { ClaudeSummarizationProvider } from './claude-summarization.provider';

@Module({
  providers: [
    FakeSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      useExisting: FakeSummarizationProvider,
    },
    {
      provide: CLAUDE_SUMMARIZATION_PROVIDER,
      useClass: ClaudeSummarizationProvider,
    }
  ],
  exports: [SUMMARIZATION_PROVIDER, FakeSummarizationProvider],
})
export class LlmModule {}
