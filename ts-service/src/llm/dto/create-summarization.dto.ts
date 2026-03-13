import { IsArray, IsNumber, IsString } from "class-validator";

export class SummarizationOutputDTO {
  @IsNumber()
  score!: number;
  @IsArray()
  @IsString({ each: true })
  strengths!: string[];
  @IsArray()
  @IsString({ each: true })
  concerns!: string[];
  @IsString()
  summary!: string;
  @IsString()
  recommendedDecision!: "advance" | "reject" | "hold";

  constructor(opts: Partial<SummarizationOutputDTO>) {
    Object.assign(this, opts);
  }
}