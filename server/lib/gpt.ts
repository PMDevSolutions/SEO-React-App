import OpenAI from "openai";

const openai = new OpenAI({ apiKey: "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" });

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
          content: `You are an SEO expert providing actionable recommendations. 
          Always provide a concrete example incorporating the keyphrase.
          Format your response as: "Here is a better [element]: [concrete example]"
          Keep responses under 155 characters for meta descriptions.
          Do not use quotation marks around the example.
          Focus on being specific and immediately actionable.`
        },
        {
          role: "user",
          content: `Generate a specific example for fixing this SEO issue: "${checkType}" for keyphrase "${keyphrase}".
          Current content: ${context}
          Remember to format as "Here is a better [element]:" followed by your concrete example without quotation marks.`
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