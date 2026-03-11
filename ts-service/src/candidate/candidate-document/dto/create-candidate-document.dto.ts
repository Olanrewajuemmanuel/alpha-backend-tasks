import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DocumentTypeEnum } from '../../../entities/candidate-document.entity';

export class CreateCandidateDocumentDto {
  @IsEnum(DocumentTypeEnum)
  documentType!: DocumentTypeEnum;

  @IsString()
  @IsNotEmpty()
  fileName!: string;
}