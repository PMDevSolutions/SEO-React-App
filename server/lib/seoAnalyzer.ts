import { scrapeWebpage } from "./webScraper";
import { getGPTRecommendation } from "./gpt";
import type { SEOCheck } from "@/lib/types";

interface SuccessMessages {
  [key: string]: string;
}

// Helper function to calculate keyphrase density
function calculateKeyphraseDensity(content: string, keyphrase: string): {
  density: number;
  occurrences: number;
  totalWords: number;
} {
  // Normalize content and keyphrase
  const normalizedContent = content.toLowerCase().trim();
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();

  // Count total words in content
  const totalWords = normalizedContent.split(/\s+/).filter(word => word.length > 0).length;

  // Count non-overlapping occurrences of the keyphrase
  const regex = new RegExp(`\\b${normalizedKeyphrase}\\b`, 'gi');
  const matches = normalizedContent.match(regex) || [];
  const occurrences = matches.length;

  // Calculate density as percentage
  const density = (occurrences * (normalizedKeyphrase.split(/\s+/).length)) / totalWords * 100;

  return {
    density,
    occurrences,
    totalWords
  };
}

export async function analyzeSEOElements(url: string, keyphrase: string) {
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

    // Update counting logic to be independent of recommendation generation
    if (passed) {
      passedChecks++;
    } else {
      failedChecks++;
      if (!skipRecommendation) {
        recommendation = await getGPTRecommendation(title, keyphrase, context);
      }
    }

    const successDescription = passed ? getSuccessMessage(title) : description;

    checks.push({
      title,
      description: successDescription,
      passed,
      recommendation
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
      "Outbound Links": "Excellent! You've included relevant outbound links.",
      "Next-Gen Image Formats": "Excellent! Your images use modern, optimized formats."
    };
    return messages[checkType] || "Well done!";
  };

  // 1. Title analysis
  const titleHasKeyphrase = scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase());
  await addCheck(
    "Keyphrase in Title",
    "The focus keyphrase should appear in the page title",
    titleHasKeyphrase,
    scrapedData.title
  );

  // 2. Meta description analysis
  const metaDescHasKeyphrase = scrapedData.metaDescription?.toLowerCase().includes(keyphrase.toLowerCase());
  await addCheck(
    "Keyphrase in Meta Description",
    "The meta description should contain the focus keyphrase",
    metaDescHasKeyphrase,
    scrapedData.metaDescription
  );

  // 3. URL analysis
  const slugHasKeyphrase = url.toLowerCase().includes(keyphrase.toLowerCase());
  await addCheck(
    "Keyphrase in URL",
    "The URL should contain the focus keyphrase",
    slugHasKeyphrase,
    url
  );

  // 4. Content length
  const minWordCount = 300;
  const wordCount = scrapedData.content.split(/\s+/).length;
  await addCheck(
    "Content Length",
    `Your content has ${wordCount} words. For good SEO, aim for at least ${minWordCount} words to provide comprehensive coverage of your topic.`,
    wordCount >= minWordCount,
    `Current word count: ${wordCount}`,
    true // Skip GPT recommendation as we have custom message
  );

  // 5. Keyphrase density
  const densityResult = calculateKeyphraseDensity(scrapedData.content, keyphrase);
  const goodDensity = densityResult.density >= 0.5 && densityResult.density <= 2.5;

  await addCheck(
    "Keyphrase Density",
    `Keyphrase density should be between 0.5% and 2.5%. Current density: ${densityResult.density.toFixed(1)}% (${densityResult.occurrences} occurrences in ${densityResult.totalWords} words)`,
    goodDensity,
    `Content length: ${densityResult.totalWords} words, Keyphrase occurrences: ${densityResult.occurrences}`,
    true // Skip GPT recommendation for density
  );

  // 6. Keyphrase in first paragraph
  console.log("Analyzing first paragraph...");
  let firstParagraph = scrapedData.paragraphs[0] || "";
  let keyphraseInIntro = false;
  let introContext = "No introduction paragraph found";

  console.log("Total paragraphs available:", scrapedData.paragraphs.length);
  console.log("First paragraph content:", firstParagraph);
  console.log("Keyphrase to check:", keyphrase);

  if (firstParagraph) {
    // Convert both strings to lowercase and remove extra whitespace
    const words = firstParagraph.toLowerCase().split(/\s+/);
    const keyphraseWords = keyphrase.toLowerCase().split(/\s+/);

    // Check if all words from the keyphrase appear in sequence
    const normalizedParagraph = words.join(' ');
    const normalizedKeyphrase = keyphraseWords.join(' ');

    console.log("Normalized paragraph:", normalizedParagraph);
    console.log("Normalized keyphrase:", normalizedKeyphrase);

    // Check if the normalized keyphrase appears in the normalized paragraph
    keyphraseInIntro = normalizedParagraph.includes(normalizedKeyphrase);
    introContext = firstParagraph;

    console.log("Keyphrase found in intro:", keyphraseInIntro);
  } else {
    console.log("No first paragraph found");
  }

  await addCheck(
    "Keyphrase in Introduction",
    keyphraseInIntro
      ? "The focus keyphrase appears naturally in the first paragraph"
      : "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
    keyphraseInIntro,
    introContext
  );

  // 7. Subheadings analysis
  const subheadingsWithKeyphrase = scrapedData.subheadings.some(
    (heading: string) => heading.toLowerCase().includes(keyphrase.toLowerCase())
  );
  await addCheck(
    "Keyphrase in Subheadings",
    "The focus keyphrase should appear in at least one subheading",
    subheadingsWithKeyphrase,
    scrapedData.subheadings.join("\n")
  );

  // 8. Image alt text analysis
  const altTextsWithKeyphrase = scrapedData.images.some(
    (img: { src: string; alt: string }) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())
  );
  await addCheck(
    "Image Alt Attributes",
    "At least one image should have an alt attribute containing the focus keyphrase",
    altTextsWithKeyphrase,
    JSON.stringify(scrapedData.images)
  );

  // 9. Internal links analysis
  const hasInternalLinks = scrapedData.internalLinks.length > 0;
  await addCheck(
    "Internal Links",
    "The page should contain internal links to other pages",
    hasInternalLinks,
    `Found ${scrapedData.internalLinks.length} internal links`
  );

  // 10. Outbound links analysis
  const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
  await addCheck(
    "Outbound Links",
    "The page should contain outbound links to authoritative sources",
    hasOutboundLinks,
    `Found ${scrapedData.outboundLinks.length} outbound links`
  );

  // Add new check for next-gen image formats
  const nextGenFormats = ['.webp', '.avif', '.svg'];
  let imageFormatRecommendation = "";
  let hasNextGenImages = false;

  if (scrapedData.images.length === 0) {
    imageFormatRecommendation = "No images found on the page. Consider adding relevant images using modern formats like WebP or AVIF to enhance user experience and page load times.";
    hasNextGenImages = false;
  } else {
    const nonOptimizedImages = scrapedData.images.filter(img => {
      const imgUrl = img.src.toLowerCase();
      return !nextGenFormats.some(format => imgUrl.endsWith(format));
    });

    hasNextGenImages = nonOptimizedImages.length === 0;

    if (!hasNextGenImages) {
      const imageList = nonOptimizedImages.map(img => img.src).join('\n');
      imageFormatRecommendation = `Convert these images to WebP or AVIF format for better performance:\n${imageList}\n\nUse tools like cwebp or online converters to optimize these images.`;
    }
  }

  await addCheck(
    "Next-Gen Image Formats",
    "Images should use modern formats like WebP, AVIF, or SVG for better performance",
    hasNextGenImages,
    scrapedData.images.map(img => img.src).join(', '),
    true // Skip GPT recommendation as we have custom recommendations
  );

  return {
    checks,
    passedChecks,
    failedChecks
  };
}