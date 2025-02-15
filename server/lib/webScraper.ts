import { load } from "cheerio";

interface ScrapedData {
  title: string;
  metaDescription: string;
  content: string;
  paragraphs: string[];
  subheadings: string[];
  images: Array<{ src: string; alt: string }>;
  internalLinks: string[];
  outboundLinks: string[];
  ogMetadata: {
    title: string;
    description: string;
    image: string;
    imageWidth: string;
    imageHeight: string;
  };
}

export async function scrapeWebpage(url: string): Promise<ScrapedData> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);

    // Get base URL for resolving relative links
    const baseUrl = new URL(url);

    // Extract meta information
    const title = $("title").text().trim();
    const metaDescription = $('meta[name="description"]').attr("content") || "";

    // Extract Open Graph metadata
    const ogMetadata = {
      title: $('meta[property="og:title"]').attr("content") || "",
      description: $('meta[property="og:description"]').attr("content") || "",
      image: $('meta[property="og:image"]').attr("content") || "",
      imageWidth: $('meta[property="og:image:width"]').attr("content") || "",
      imageHeight: $('meta[property="og:image:height"]').attr("content") || ""
    };

    // Get all text content
    const content = $("body").text().trim();

    console.log("Scraping paragraphs...");
    console.log("Total p tags found:", $("p").length);

    // Get paragraphs with more detailed selector and logging
    const allParagraphElements = $("article p, main p, .content p, #content p, .post-content p, p");
    console.log("Found elements with paragraph selectors:", allParagraphElements.length);

    const paragraphs = allParagraphElements
      .map((_: any, el: any) => {
        const $el = $(el);
        const text = $el.text().trim();
        const parentClass = $el.parent().attr('class') || 'no-parent-class';
        console.log(`Paragraph found in ${parentClass}:`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        return text;
      })
      .get()
      .filter((text: string) => text.length > 0);

    console.log(`After filtering, found ${paragraphs.length} non-empty paragraphs`);
    if (paragraphs.length > 0) {
      console.log("First paragraph content:", paragraphs[0]);
    } else {
      console.log("No valid paragraphs found");
    }

    // Get subheadings
    const subheadings = $("h1, h2, h3, h4, h5, h6")
      .map((_: any, el: any) => $(el).text().trim())
      .get()
      .filter((text: string) => text.length > 0);

    // Get images with alt text
    const images = $("img")
      .map((_: any, el: any) => ({
        src: $(el).attr("src") || "",
        alt: $(el).attr("alt") || "",
      }))
      .get();

    // Get internal and outbound links
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];

    $("a[href]").each((_: any, el: any) => {
      const href = $(el).attr("href");
      if (!href) return;

      try {
        const linkUrl = new URL(href, baseUrl.origin);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push(href);
        } else {
          outboundLinks.push(href);
        }
      } catch (error: any) {
        // Invalid URL, skip
      }
    });

    return {
      title,
      metaDescription,
      content,
      paragraphs,
      subheadings,
      images,
      internalLinks,
      outboundLinks,
      ogMetadata,
    };
  } catch (error: any) {
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}