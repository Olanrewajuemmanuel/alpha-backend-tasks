import { Injectable, Logger } from "@nestjs/common";
import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from "./summarization-provider.interface";
import { validate } from "class-validator";
import { SummarizationOutputDTO } from "./dto/create-summarization.dto";
import { InferenceClient } from "@huggingface/inference";

const MODEL = "deepseek-ai/DeepSeek-V3-0324"; // Prefer smaller models that are free

@Injectable()
export class HuggingFaceSummarizationProvider implements SummarizationProvider {
  private readonly logger = new Logger(HuggingFaceSummarizationProvider.name);
  private readonly client!: InferenceClient;

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY is not set");
    }
    this.client = new InferenceClient(apiKey);
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
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

    const response = await this.client.chatCompletion({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1024,
    });

    const rawText = response.choices
      .map((choice) => choice.message?.content ?? "")
      .join("")
      .trim();

    if (!rawText) {
      throw new Error("HuggingFace returned an empty response");
    }

    this.logger.debug(`HuggingFace raw response: ${rawText}`);

    // Strip markdown code fences if model wraps output in them
    // Huggingface models sometimes wrap JSON in ```json ... ``` even when explicitly told not to
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("HuggingFace response was not valid JSON");
    }

    const validated = new SummarizationOutputDTO(parsed as any);
    const errors = await validate(validated);
    if (errors.length > 0) {
      throw new Error(
        `HuggingFace response failed schema validation: ${errors.map((e) => e.toString()).join(", ")}`,
      );
    }

    return {
      ...validated,
      provider: `huggingface - ${MODEL}`,
      promptVersion: "v1",
    };
  }
}