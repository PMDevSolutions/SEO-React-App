import type { Express } from "express";
import { createServer } from "http";
import { analyzeSEOElements } from "./lib/seoAnalyzer";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/analyze", async (req, res) => {
    try {
      const { url, keyphrase } = req.body;
      
      if (!url || !keyphrase) {
        return res.status(400).json({ message: "URL and keyphrase are required" });
      }

      const results = await analyzeSEOElements(url, keyphrase);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
