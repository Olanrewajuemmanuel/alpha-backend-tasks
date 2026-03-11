import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { ISampleWorkspaceSchema, SampleWorkspace } from './sample-workspace.entity';

export interface ISampleCandidateSchema {
    id: string;
    workspaceId: string;
    fullName: string;
    email: string | null;
    createdAt: Date;
    workspace: ISampleWorkspaceSchema;
}

@Entity({ name: 'sample_candidates' })
export class SampleCandidate implements ISampleCandidateSchema {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 160 })
  fullName!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SampleWorkspace, (workspace) => workspace.candidates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: SampleWorkspace;
}
