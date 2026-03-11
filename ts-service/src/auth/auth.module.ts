import { Module, forwardRef } from '@nestjs/common';

import { FakeAuthGuard } from './fake-auth.guard';
import { WorkspaceGuard } from './workspace.guard';
import { SampleModule } from '../sample/sample.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SampleCandidate } from '../entities/sample-candidate.entity';

@Module({
  imports: [forwardRef(() => SampleModule), TypeOrmModule.forFeature([SampleCandidate])],
  providers: [FakeAuthGuard, WorkspaceGuard],
  exports: [FakeAuthGuard, WorkspaceGuard],
})
export class AuthModule {}
