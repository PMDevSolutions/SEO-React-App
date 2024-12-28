import { scrapeWebpage } from "./webScraper";
import { getGPTRecommendation } from "./gpt";

export async function analyzeSEOElements(url: string, keyphrase: string) {
  const scrapedData = await scrapeWebpage(url);
  const checks = [];
  let passedChecks = 0;
  let failedChecks = 0;

  // Helper function to add check results
  const addCheck = async (title: string, description: string, passed: boolean, context?: string, skipRecommendation: boolean = false) => {
    let recommendation = "";
    if (!passed && !skipRecommendation) {
      recommendation = await getGPTRecommendation(title, keyphrase, context);
      failedChecks++;
    } else {
      passedChecks++;
    }

    // Change description for passed checks to be more encouraging
    const successDescription = passed ? getSuccessMessage(title) : description;

    checks.push({
      title,
      description: successDescription,
      passed,
      recommendation
    });
  };

  // Helper function to get encouraging success messages
  const getSuccessMessage = (checkType: string) => {
    const messages = {
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
    "Content should be at least 300 words long",
    wordCount >= minWordCount,
    `Current word count: ${wordCount}`
  );

  // 5. Keyphrase density
  const keyphraseCount = (scrapedData.content.toLowerCase().match(new RegExp(keyphrase.toLowerCase(), 'g')) || []).length;
  const density = (keyphraseCount / wordCount) * 100;
  const goodDensity = density >= 0.5 && density <= 2.5;
  await addCheck(
    "Keyphrase Density",
    "Keyphrase density should be between 0.5% and 2.5%",
    goodDensity,
    `Current density: ${density.toFixed(1)}%`,
    true // Skip recommendation for density check
  );

  // 6. Keyphrase in first paragraph
  const firstParagraph = scrapedData.paragraphs[0] || "";
  const keyphraseInIntro = firstParagraph.toLowerCase().includes(keyphrase.toLowerCase());
  await addCheck(
    "Keyphrase in Introduction",
    "The focus keyphrase should appear in the first paragraph",
    keyphraseInIntro,
    firstParagraph
  );

  // 7. Subheadings analysis
  const subheadingsWithKeyphrase = scrapedData.subheadings.some(
    h => h.toLowerCase().includes(keyphrase.toLowerCase())
  );
  await addCheck(
    "Keyphrase in Subheadings",
    "The focus keyphrase should appear in at least one subheading",
    subheadingsWithKeyphrase,
    scrapedData.subheadings.join("\n")
  );

  // 8. Image alt text analysis
  const altTextsWithKeyphrase = scrapedData.images.some(
    img => img.alt?.toLowerCase().includes(keyphrase.toLowerCase())
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

  return {
    checks,
    passedChecks,
    failedChecks
  };
}