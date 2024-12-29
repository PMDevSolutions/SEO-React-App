// Basic type definitions for Webflow Designer Extension API
interface Extension {
  registerPanel(config: PanelConfig): void;
  webflow: {
    getCurrentPage(): Promise<{ url: string } | null>;
  };
  notify: {
    error(message: string): void;
  };
}

interface PanelConfig {
  id: string;
  title: string;
  render(): HTMLElement | Promise<HTMLElement>;
}

interface SEOAnalysisResult {
  passedChecks: number;
  failedChecks: number;
  checks: {
    passed: boolean;
    title: string;
    description: string;
    recommendation?: string;
  }[];
}

import { analyzeSEO } from "../lib/api";

let extension: Extension;

export function init(ext: Extension) {
  extension = ext;

  // Register the extension panel
  extension.registerPanel({
    id: "seo-analysis-panel",
    title: "SEO Analysis",
    render: renderPanel,
  });
}

async function renderPanel() {
  const panel = document.createElement("div");
  panel.className = "p-4 space-y-4 bg-background text-foreground";

  // Get current page URL
  const currentPage = await extension.webflow.getCurrentPage();
  const pageUrl = currentPage?.url || "";

  // Create the form
  const form = createAnalysisForm(pageUrl);
  panel.appendChild(form);

  // Create results container
  const resultsContainer = document.createElement("div");
  resultsContainer.id = "seo-results";
  resultsContainer.className = "mt-4";
  panel.appendChild(resultsContainer);

  return panel;
}

function createAnalysisForm(pageUrl: string) {
  const form = document.createElement("form");
  form.className = "space-y-4";

  // URL input (hidden, we'll use the current page URL)
  const urlInput = document.createElement("input");
  urlInput.type = "hidden";
  urlInput.value = pageUrl;

  // Keyphrase input
  const keyphraseInput = document.createElement("input");
  keyphraseInput.type = "text";
  keyphraseInput.placeholder = "Enter target keyphrase";
  keyphraseInput.className = "w-full p-2 bg-background2 border border-border text-foreground rounded-none";

  // Submit button
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "w-full p-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity rounded-none";
  submitButton.textContent = "Analyze SEO";

  form.appendChild(urlInput);
  form.appendChild(keyphraseInput);
  form.appendChild(submitButton);

  // Handle form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = "Analyzing...";

    try {
      const result = await analyzeSEO({
        url: urlInput.value,
        keyphrase: keyphraseInput.value
      });

      displayResults(result);
    } catch (error: any) {
      extension.notify.error("Failed to analyze SEO: " + error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Analyze SEO";
    }
  };

  return form;
}

function displayResults(results: SEOAnalysisResult) {
  const container = document.getElementById("seo-results");
  if (!container) return;

  container.innerHTML = "";

  // Summary
  const summary = document.createElement("div");
  summary.className = "mb-4 p-3 bg-background2 rounded-none";
  summary.textContent = `${results.passedChecks} passes ✅ • ${results.failedChecks} improvements needed ❌`;
  container.appendChild(summary);

  // Results list
  results.checks.forEach(check => {
    const checkEl = document.createElement("div");
    checkEl.className = "mb-4 p-4 border border-border rounded-none";

    const header = document.createElement("div");
    header.className = "flex items-center gap-2 mb-2";
    header.innerHTML = `
      ${check.passed ? "✅" : "❌"}
      <strong class="text-text1">${check.title}</strong>
    `;

    const description = document.createElement("p");
    description.className = "text-sm text-text2";
    description.textContent = check.description;

    checkEl.appendChild(header);
    checkEl.appendChild(description);

    if (!check.passed && check.recommendation) {
      const recommendation = document.createElement("div");
      recommendation.className = "mt-2 p-2 bg-background3 text-sm";
      recommendation.textContent = check.recommendation;
      checkEl.appendChild(recommendation);
    }

    container.appendChild(checkEl);
  });
}