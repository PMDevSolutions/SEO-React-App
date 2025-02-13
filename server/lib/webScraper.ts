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

    // Get all text content
    const content = $("body").text().trim();

    // Get paragraphs - improved to handle more cases
    const paragraphs = $("article p, main p, .content p, #content p, .post-content p, p")
      .map((_: any, el: any) => {
        const text = $(el).text().trim();
        console.log("Found paragraph:", text); // Debug log
        return text;
      })
      .get()
      .filter((text: string) => text.length > 0);

    console.log("Total paragraphs found:", paragraphs.length); // Debug log
    if (paragraphs.length > 0) {
      console.log("First paragraph:", paragraphs[0]); // Debug log
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
    };
  } catch (error: any) {
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}