import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import { ISampleCandidateSchema, SampleCandidate } from './sample-candidate.entity';

export enum DocumentTypeEnum {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  OTHER = 'other',
}

export interface ICandidateDocumentSchema {
    id: string;
    candidateId: string;
    documentType: DocumentTypeEnum;
    fileName: string;
    storageKey: string;
    rawText: string;
    candidate: ISampleCandidateSchema;

}

@Entity({ name: 'candidate_documents' })
export class CandidateDocument extends BaseEntity implements ICandidateDocumentSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentTypeEnum,
  })
  documentType!: DocumentTypeEnum;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey!: string;

  @Column({ name: 'raw_text', type: 'text' })
  rawText!: string;

  @ManyToOne(() => SampleCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;
}