import { Injectable, Logger } from "@nestjs/common";
import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from "./summarization-provider.interface";
import { IsString, IsNumber, IsArray, validate } from "class-validator";
import Anthropic from "@anthropic-ai/sdk";

class SummarizationOutputDTO {
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

const MODEL = "claude-sonnet-4-20250514";

@Injectable()
export class ClaudeSummarizationProvider implements SummarizationProvider {
  private readonly logger = new Logger(ClaudeSummarizationProvider.name);
  private readonly client!: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    this.client = new Anthropic({
      apiKey,
    });
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const documentBlock = input.documents.map((text) => `--- ${text}`);
    const prompt = `
You are an expert technical recruiter. Analyze the following candidate documents and return a structured JSON evaluation.

CANDIDATE DOCUMENTS:
${documentBlock}

Return ONLY a valid JSON object with exactly this shape, no explanation, no markdown, no backticks:
{
  "score": <integer 0-100 representing overall candidate strength>,
  "strengths": [<list of strength strings>],
  "concerns": [<list of concern strings>],
  "summary": "<concise narrative summary of the candidate>",
  "recommendedDecision": "<one of: advance, reject, hold>"
}
    `.trim();

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    if (!rawText) {
      throw new Error("Claude returned an empty response");
    }

    this.logger.debug(`Claude raw response: ${rawText}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(`Claude response was not valid JSON: ${rawText}`);
    }

    const validated = new SummarizationOutputDTO(parsed as any);
    const errors = await validate(validated);
    if (errors.length > 0) {
      throw new Error(
        `Claude response failed schema validation: ${errors.map((e) => e.toString()).join(", ")}`,
      );
    }

    return validated;
  }
}
