import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { ISampleCandidateSchema, SampleCandidate } from './sample-candidate.entity';

export interface ISampleWorkspaceSchema {
    id: string;
    name: string;
    createdAt: Date;
    candidates: ISampleCandidateSchema[];
}

@Entity({ name: 'sample_workspaces' })
export class SampleWorkspace implements ISampleWorkspaceSchema {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => SampleCandidate, (candidate) => candidate.workspace)
  candidates!: SampleCandidate[];
}
