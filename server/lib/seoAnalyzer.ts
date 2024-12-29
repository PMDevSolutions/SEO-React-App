import { scrapeWebpage } from "./webScraper";
import { getGPTRecommendation } from "./gpt";
import type { SEOCheck } from "@/lib/types";

interface SuccessMessages {
  [key: string]: string;
}

export async function analyzeSEOElements(url: string, keyphrase: string) {
  try {
    const scrapedData = await scrapeWebpage(url);
    const checks: SEOCheck[] = [];
    let passedChecks = 0;
    let failedChecks = 0;

    // Helper function to add check results
    const addCheck = async (
      title: string,
      description: string,
      passed: boolean,
      context?: string,
      skipRecommendation = false
    ) => {
      let recommendation = "";
      if (!passed && !skipRecommendation) {
        try {
          recommendation = await getGPTRecommendation(title, keyphrase, context);
        } catch (error: any) {
          console.error(`GPT recommendation error for ${title}:`, error);
          recommendation = "Unable to generate recommendation at this time.";
        }
        failedChecks++;
      } else {
        passedChecks++;
      }

      // Get success message for passed checks
      const successDescription = passed ? getSuccessMessage(title) : description;

      checks.push({
        title,
        description: successDescription,
        passed,
        recommendation: recommendation || undefined
      });
    };

    // Helper function to get encouraging success messages
    const getSuccessMessage = (checkType: string): string => {
      const messages: SuccessMessages = {
        "Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
        "Keyphrase in Meta Description": "Perfect! Your meta description effectively uses the keyphrase.",
        "Keyphrase in URL": "Excellent! Your URL is SEO-friendly with the keyphrase.",
        "Content Length": "Well done! Your content length is good for SEO.",
        "Keyphrase Density": "Perfect! Your keyphrase density is within the optimal range.",
        "Keyphrase in Introduction": "Excellent! You've included the keyphrase in your introduction.",
        "Keyphrase in Subheadings": "Great work! Your subheadings include the keyphrase.",
        "Image Alt Attributes": "Well done! Your images are properly optimized with the keyphrase.",
        "Internal Links": "Perfect! You have a good number of internal links.",
        "Outbound Links": "Excellent! You've included relevant outbound links."
      };
      return messages[checkType] || "Well done!";
    };

    // Run checks
    const wordCount = scrapedData.content.split(/\s+/).length;
    const keyphraseCount = (scrapedData.content.toLowerCase().match(new RegExp(keyphrase.toLowerCase(), 'g')) || []).length;
    const density = (keyphraseCount / wordCount) * 100;

    const checksToRun = [
      {
        title: "Keyphrase in Title",
        check: () => scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase()),
        description: "The focus keyphrase should appear in the page title",
        context: scrapedData.title
      },
      {
        title: "Keyphrase in Meta Description",
        check: () => scrapedData.metaDescription?.toLowerCase().includes(keyphrase.toLowerCase()),
        description: "The meta description should contain the focus keyphrase",
        context: scrapedData.metaDescription
      },
      {
        title: "Keyphrase in URL",
        check: () => url.toLowerCase().includes(keyphrase.toLowerCase()),
        description: "The URL should contain the focus keyphrase",
        context: url
      },
      {
        title: "Content Length",
        check: () => wordCount >= 300,
        description: "Content should be at least 300 words long",
        context: `Current word count: ${wordCount}`
      },
      {
        title: "Keyphrase Density",
        check: () => density >= 0.5 && density <= 2.5,
        description: `Current density: ${density.toFixed(1)}%`,
        context: `Current density: ${density.toFixed(1)}%`,
        skipRecommendation: true
      },
      {
        title: "Keyphrase in Introduction",
        check: () => (scrapedData.paragraphs[0] || "").toLowerCase().includes(keyphrase.toLowerCase()),
        description: "The focus keyphrase should appear in the first paragraph",
        context: scrapedData.paragraphs[0] || ""
      },
      {
        title: "Keyphrase in Subheadings",
        check: () => scrapedData.subheadings.some(heading => heading.toLowerCase().includes(keyphrase.toLowerCase())),
        description: "The focus keyphrase should appear in at least one subheading",
        context: scrapedData.subheadings.join("\n")
      },
      {
        title: "Image Alt Attributes",
        check: () => scrapedData.images.some(img => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())),
        description: "At least one image should have an alt attribute containing the focus keyphrase",
        context: JSON.stringify(scrapedData.images)
      },
      {
        title: "Internal Links",
        check: () => scrapedData.internalLinks.length > 0,
        description: "The page should contain internal links to other pages",
        context: `Found ${scrapedData.internalLinks.length} internal links`
      },
      {
        title: "Outbound Links",
        check: () => scrapedData.outboundLinks.length > 0,
        description: "The page should contain outbound links to authoritative sources",
        context: `Found ${scrapedData.outboundLinks.length} outbound links`
      }
    ];

    for (const check of checksToRun) {
      try {
        const passed = check.check();
        await addCheck(check.title, check.description, passed, check.context, check.skipRecommendation);
      } catch (error: any) {
        console.error(`Error in check ${check.title}:`, error);
        checks.push({
          title: check.title,
          description: "Error occurred while checking this element",
          passed: false,
          recommendation: "Unable to analyze this element. Please try again later."
        });
        failedChecks++;
      }
    }

    return {
      checks,
      passedChecks,
      failedChecks
    };
  } catch (error: any) {
    console.error("SEO Analysis error:", error);
    throw new Error(`Failed to analyze SEO elements: ${error.message}`);
  }
}