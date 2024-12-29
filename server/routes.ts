import type { Express } from "express";
import { analyzeSEOElements } from "./lib/seoAnalyzer";
import { log } from "./vite";

export function registerRoutes(app: Express) {
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url, keyphrase } = req.body;

      if (!url || !keyphrase) {
        return res.status(400).json({ message: "URL and keyphrase are required" });
      }

      log(`Analyzing SEO for URL: ${url} with keyphrase: ${keyphrase}`);
      const results = await analyzeSEOElements(url, keyphrase);
      res.json(results);
    } catch (error: any) {
      log(`Error analyzing SEO: ${error.message}`);
      res.status(500).json({ message: error.message });
    }
  });
}