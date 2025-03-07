import type { Express } from "express";
import { createServer } from "http";
import { analyzeSEOElements } from "./lib/seoAnalyzer";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Log environment variable status for OpenAI API (without exposing the key)
  const useGPT = process.env.USE_GPT_RECOMMENDATIONS !== "false";
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');

  console.log(`[SEO Analyzer] GPT Recommendations: ${useGPT ? "Enabled" : "Disabled"}`);
  console.log(`[SEO Analyzer] OpenAI Key: ${hasOpenAIKey ? "Provided" : "Not provided or invalid"}`);

  if (useGPT && !hasOpenAIKey) {
    console.warn("[SEO Analyzer] WARNING: GPT recommendations are enabled but no valid OpenAI API key was provided. Will use fallback recommendations.");
  }

  // SEO Analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      const { keyphrase } = req.body;

      if (!keyphrase) {
        return res.status(400).json({ message: "Keyphrase is required" });
      }

      const results = await analyzeSEOElements(keyphrase);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}