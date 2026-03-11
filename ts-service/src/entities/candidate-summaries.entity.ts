import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SampleCandidate } from './sample-candidate.entity';
import { BaseEntity } from './base.entity';

export enum SummaryStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum RecommendedDecisionEnum {
  ADVANCE = 'advance',
  REJECT = 'reject',
  HOLD = 'hold',
}

export interface ICandidateSummarySchema {
    id: string;
    candidateId: string;
}

@Entity({ name: 'candidate_summaries' })
export class CandidateSummary extends BaseEntity implements ICandidateSummarySchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({
    type: 'enum',
    enum: SummaryStatusEnum,
    default: SummaryStatusEnum.PENDING,
  })
  status!: SummaryStatusEnum;

  @Column({ type: 'int', nullable: true })
  score!: number | null;

  @Column({ type: 'text', array: true, nullable: true })
  strengths!: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  concerns!: string[] | null;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({
    name: 'recommended_decision',
    type: 'enum',
    enum: RecommendedDecisionEnum,
    nullable: true,
  })
  recommendedDecision!: RecommendedDecisionEnum | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  provider!: string | null;

  @Column({ name: 'prompt_version', type: 'varchar', length: 32, nullable: true })
  promptVersion!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @ManyToOne(() => SampleCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;
}