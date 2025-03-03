import { load } from "cheerio";

interface ScrapedData {
  title: string;
  metaDescription: string;
  content: string;
  paragraphs: string[];
  subheadings: string[];
  headings: Array<{ level: number; text: string }>;
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
  resources: {
    js: Array<{ url: string; content?: string; minified?: boolean }>;
    css: Array<{ url: string; content?: string; minified?: boolean }>;
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

    // Get headings with their levels
    const headings = $("h1, h2, h3, h4, h5, h6")
      .map((_: any, el: any) => {
        const tagName = $(el).prop('tagName').toLowerCase();
        const level = parseInt(tagName.substring(1), 10); // Extract the number from "h1", "h2", etc.
        return {
          level,
          text: $(el).text().trim()
        };
      })
      .get()
      .filter((heading: { level: number; text: string }) => heading.text.length > 0);

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

    // Extract JavaScript and CSS resources
    const jsResources: Array<{ url: string; content?: string; minified?: boolean }> = [];
    const cssResources: Array<{ url: string; content?: string; minified?: boolean }> = [];

    // Collect script sources
    $("script[src]").each((_: any, el: any) => {
      const src = $(el).attr("src");
      if (src) {
        try {
          const fullUrl = new URL(src, baseUrl.origin).toString();
          jsResources.push({ url: fullUrl });
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Collect stylesheet links
    $("link[rel='stylesheet']").each((_: any, el: any) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const fullUrl = new URL(href, baseUrl.origin).toString();
          cssResources.push({ url: fullUrl });
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Also look for inline styles
    $("style").each((_: any, el: any) => {
      const content = $(el).html();
      if (content && content.trim()) {
        cssResources.push({ 
          url: 'inline-style',
          content: content.trim(),
          minified: isMinified(content.trim())
        });
      }
    });

    // Look for inline scripts
    $("script:not([src])").each((_: any, el: any) => {
      const content = $(el).html();
      if (content && content.trim()) {
        jsResources.push({ 
          url: 'inline-script',
          content: content.trim(),
          minified: isMinified(content.trim())
        });
      }
    });

    return {
      title,
      metaDescription,
      content,
      paragraphs,
      subheadings,
      headings,
      images,
      internalLinks,
      outboundLinks,
      ogMetadata,
      resources: {
        js: jsResources,
        css: cssResources
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}

// Helper function to determine if a code snippet is minified
function isMinified(code: string): boolean {
  if (!code || code.length < 50) return true; // Too short to analyze

  // Check for multiple newlines (non-minified code typically has many)
  const newlineRatio = (code.match(/\n/g) || []).length / code.length;

  // Check for excessive whitespace
  const whitespaceRatio = (code.match(/\s/g) || []).length / code.length;

  // Check for long lines (minified code typically has very long lines)
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  let avgLineLength = 0;
  if (lines.length > 0) {
    avgLineLength = code.length / lines.length;
  }

  // Content with very few newlines, low whitespace ratio and long average line lengths is likely minified
  return (newlineRatio < 0.01 && whitespaceRatio < 0.15) || avgLineLength > 500;
}