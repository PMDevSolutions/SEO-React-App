export interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SEOAnalysisResult {
  checks: SEOCheck[];
  passedChecks: number;
  failedChecks: number;
}

export interface AnalyzeRequest {
  keyphrase: string;
}