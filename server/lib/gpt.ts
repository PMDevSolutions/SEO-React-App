import OpenAI from "openai";
import { log } from "../vite";

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000 // 30 second timeout
  });
} catch (error: any) {
  log(`Failed to initialize OpenAI client: ${error.message}`);
}

export async function getGPTRecommendation(
  checkType: string,
  keyphrase: string,
  context?: string
): Promise<string> {
  try {
    if (!openai) {
      log("OpenAI client not initialized");
      return "Unable to generate recommendation. OpenAI client not configured.";
    }

    if (!process.env.OPENAI_API_KEY) {
      log("OpenAI API key is not configured");
      return "Unable to generate recommendation. API key not configured.";
    }

    log(`Generating recommendation for ${checkType} with keyphrase: ${keyphrase}`);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert providing actionable recommendations. 
          Always provide a concrete example incorporating the keyphrase.
          Format your response as: Here is a better [element]: [concrete example]
          Keep responses under 155 characters for meta descriptions.
          Do not use quotation marks around the example.
          Focus on being specific and immediately actionable.`
        },
        {
          role: "user",
          content: `Generate a specific example for fixing this SEO issue: ${checkType} for keyphrase "${keyphrase}".
          Current content: ${context || "Not provided"}
          Remember to format as Here is a better [element]: followed by your concrete example without quotation marks.`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim() || 
      "Unable to generate recommendation at this time.";

    // Remove any remaining quotation marks from the response
    return content.replace(/["']/g, '');
  } catch (error: any) {
    log(`GPT API Error: ${error.message}`);
    if (error.code === 'insufficient_quota') {
      return "API quota exceeded. Please try again later.";
    }
    if (error.code === 'context_length_exceeded') {
      return "Content too long for analysis. Please try with shorter content.";
    }
    return "Unable to generate recommendation. Please try again later.";
  }
}