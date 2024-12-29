import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getGPTRecommendation(
  checkType: string,
  keyphrase: string,
  context?: string
): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
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
          content: `Generate a specific example for fixing this SEO issue: ${checkType} for keyphrase ${keyphrase}.
          Current content: ${context}
          Remember to format as Here is a better [element]: followed by your concrete example without quotation marks.`
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