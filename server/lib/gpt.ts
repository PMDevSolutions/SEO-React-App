import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getGPTRecommendation(
  checkType: string,
  keyphrase: string,
  context?: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert providing actionable recommendations. Focus on being specific and practical. Format your response as a concise recommendation starting with an action verb. Context: ${checkType} check failed for keyphrase "${keyphrase}".`
        },
        {
          role: "user",
          content: `Generate a specific recommendation for fixing this SEO issue. Current content context: ${context}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || 
      "Unable to generate recommendation at this time.";
  } catch (error: any) {
    console.error("GPT API Error:", error);
    return "Unable to generate recommendation. Please try again later.";
  }
}