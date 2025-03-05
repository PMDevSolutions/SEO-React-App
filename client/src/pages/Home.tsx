import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  AlertTriangle,
  CircleAlert,
  Info,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { analyzeSEO } from "@/lib/api";
import type { SEOAnalysisResult, SEOCheck } from "@/lib/types";
import { ProgressCircle } from "@/components/ui/progress-circle";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  keyphrase: z.string().min(2, "Keyphrase must be at least 2 characters")
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const iconAnimation = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const shouldShowCopyButton = (checkTitle: string) => {
  return !checkTitle.toLowerCase().includes("density") &&
         !checkTitle.toLowerCase().includes("image format") &&
         !checkTitle.toLowerCase().includes("content length") &&
         !checkTitle.toLowerCase().includes("og image") &&
         !checkTitle.toLowerCase().includes("heading hierarchy") &&
         !checkTitle.toLowerCase().includes("code minification");
  // Removed the h1 heading and h2 headings exclusions to allow copy buttons
};

// Get priority icon based on priority level
const getPriorityIcon = (priority: string, className: string = "h-4 w-4") => {
  switch (priority) {
    case 'high':
      return <AlertTriangle className={`${className} text-redText`} />;
    case 'medium':
      return <CircleAlert className={`${className} text-yellowText`} />;
    case 'low':
      return <Info className={`${className} text-blueText`} />;
    default:
      return null;
  }
};

// Get priority text based on priority level
const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high':
      return "High Priority";
    case 'medium':
      return "Medium Priority";
    case 'low':
      return "Low Priority";
    default:
      return "";
  }
};

// Group checks by category
const groupChecksByCategory = (checks: SEOCheck[]) => {
  const categories = {
    "Page Settings": ["Keyphrase in Title", "Keyphrase in Meta Description", "Keyphrase in URL", "OG Title and Description"],
    "Content": ["Keyphrase in H1 Heading", "Keyphrase in H2 Headings", "Heading Hierarchy", "Content Length", "Keyphrase Density", "Keyphrase in Introduction"],
    "Links": ["Internal Links", "Outbound Links"],
    "Images": ["Image Alt Attributes", "Next-Gen Image Formats", "OG Image"],
    "Technical": ["Code Minification"]
  };

  const grouped: Record<string, SEOCheck[]> = {};

  // Initialize all categories
  Object.keys(categories).forEach(category => {
    grouped[category] = [];
  });

  // Group checks by category
  checks.forEach(check => {
    for (const [category, checkTitles] of Object.entries(categories)) {
      if (checkTitles.includes(check.title)) {
        grouped[category].push(check);
        break;
      }
    }
  });

  return grouped;
};

// Get status for a category
const getCategoryStatus = (checks: SEOCheck[]) => {
  if (!checks || checks.length === 0) return "neutral";

  const passedCount = checks.filter(check => check.passed).length;

  if (passedCount === checks.length) return "complete";
  if (passedCount === 0) return "todo";
  return "inprogress";
};

// Get status icon for a category
const getCategoryStatusIcon = (status: string) => {
  switch (status) {
    case "complete":
      return <CheckCircle className="h-6 w-6 text-greenText" />;
    case "inprogress":
      return <CircleAlert className="h-6 w-6 text-yellowText" />;
    case "todo":
      return <XCircle className="h-6 w-6 text-redText" />;
    default:
      return <Info className="h-6 w-6 text-blueText" />;
  }
};

// Calculate the overall SEO score based on check priorities
const calculateSEOScore = (checks: SEOCheck[]): number => {
  if (!checks || checks.length === 0) return 0;

  // Define weights for different priority levels
  const weights = {
    high: 3,
    medium: 2,
    low: 1
  };

  // Calculate total possible points
  let totalPossiblePoints = 0;
  checks.forEach(check => {
    totalPossiblePoints += weights[check.priority] || weights.medium;
  });

  // Calculate earned points
  let earnedPoints = 0;
  checks.forEach(check => {
    if (check.passed) {
      earnedPoints += weights[check.priority] || weights.medium;
    }
  });

  // Calculate percentage score (0-100)
  return Math.round((earnedPoints / totalPossiblePoints) * 100);
};

// Get score rating text
const getScoreRatingText = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Work";
  return "Poor";
};

export default function Home() {
  const { toast } = useToast();
  const [results, setResults] = useState<SEOAnalysisResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      keyphrase: ""
    }
  });

  const mutation = useMutation({
    mutationFn: analyzeSEO,
    onSuccess: (data) => {
      setResults(data);
      setSelectedCategory(null); // Reset selected category on new analysis
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;

    // Extract just the text of the suggestion, not the explanation
    let cleanText = "";

    // Try to extract the specific text suggestion from various formats
    if (text.includes("Here is a better")) {
      // Format: "Here is a better [element]: [example]"
      const match = text.match(/Here is a better [^:]+:\s*(.*)/);
      cleanText = match ? match[1].trim() : text;
    } else if (text.includes("Utilize") && text.includes("as an H")) {
      // Format: "Utilize 'Example text' as an H1/H2 heading..."
      const match = text.match(/Utilize ['"]([^'"]+)['"]/);
      cleanText = match ? match[1].trim() : text;
    } else if (text.includes("Add an H")) {
      // Format: "Add an H1/H2 with 'Example text'..."
      const match = text.match(/with ['"]([^'"]+)['"]/);
      cleanText = match ? match[1].trim() : text;
    } else {
      // Default extraction of text inside quotes
      const quotedText = text.match(/['"]([^'"]+)['"]/);
      cleanText = quotedText ? quotedText[1].trim() : text;
    }

    // Clean up any remaining quotes
    cleanText = cleanText.replace(/^"|"$/g, '');

    navigator.clipboard.writeText(cleanText);
    toast({
      title: "Copied!",
      description: "Recommendation copied to clipboard"
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  // Group checks for the overview
  const groupedChecks = results ? groupChecksByCategory(results.checks) : null;

  // Get checks for the selected category
  const selectedCategoryChecks = selectedCategory && groupedChecks 
    ? groupedChecks[selectedCategory] || [] 
    : [];

  // Calculate overall SEO score
  const seoScore = results ? calculateSEOScore(results.checks) : 0;
  const scoreRating = getScoreRatingText(seoScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 md:p-6"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center">SEO Analysis Tool</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>URL to analyze</FormLabel>
                        <FormControl>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full"
                          >
                            <Input
                              placeholder="https://example.com"
                              {...field}
                              className="w-full"
                            />
                          </motion.div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="keyphrase"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Target keyphrase</FormLabel>
                        <FormControl>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full"
                          >
                            <Input
                              placeholder="Enter your target keyphrase"
                              {...field}
                              className="w-full"
                            />
                          </motion.div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full pt-2"
                  >
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full h-11"
                    >
                      {mutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Analyze SEO
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <Card className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {selectedCategory ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedCategory(null)}
                          className="mr-2"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <CardTitle>{selectedCategory} SEO</CardTitle>
                      </div>
                    ) : (
                      <CardTitle className="text-center">Analysis Results</CardTitle>
                    )}
                  </div>
                  {!selectedCategory && (
                    <div className="flex flex-col items-center justify-center mt-4">
                      <ProgressCircle 
                        value={seoScore} 
                        size={140} 
                        strokeWidth={10}
                        scoreText="SEO Score" 
                      />
                      <div className="mt-2 text-center">
                        <p className="text-lg font-medium">{scoreRating}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {results.passedChecks} passed ✅ • {results.failedChecks} to improve ❌
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedCategory && (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-sm text-muted-foreground text-center"
                    >
                      {results.passedChecks} passes ✅ • {results.failedChecks} improvements needed ❌
                    </motion.div>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedCategory ? (
                    // Show checks for the selected category
                    <ScrollArea className="h-[600px] pr-4 w-full">
                      <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-5 w-full"
                      >
                        {selectedCategoryChecks.map((check, index) => (
                          <motion.div
                            key={index}
                            variants={item}
                            className="border p-4 w-full rounded-lg hover:bg-background2 transition-colors"
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className="space-y-2 flex-1">
                                <motion.div
                                  className="font-medium flex items-center gap-2"
                                >
                                  <motion.div
                                    variants={iconAnimation}
                                    initial="initial"
                                    animate="animate"
                                  >
                                    {check.passed ? (
                                      <CheckCircle className="h-5 w-5 text-greenText flex-shrink-0" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-redText flex-shrink-0" />
                                    )}
                                  </motion.div>
                                  {check.title}

                                  {/* Priority Icon */}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <motion.div
                                          variants={iconAnimation}
                                          initial="initial"
                                          animate="animate"
                                          className="ml-2"
                                        >
                                          {getPriorityIcon(check.priority)}
                                        </motion.div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>SEO Impact: {getPriorityText(check.priority)}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </motion.div>
                                <p className="text-sm text-muted-foreground">
                                  {check.description}
                                </p>
                              </div>
                              {!check.passed && check.recommendation && shouldShowCopyButton(check.title) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="ml-4"
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center gap-2"
                                          onClick={() => copyToClipboard(check.recommendation)}
                                        >
                                          <Copy className="h-4 w-4" />
                                          Copy
                                        </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy recommendation to clipboard</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {!check.passed && check.recommendation && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 text-sm p-4 bg-background3 rounded-md w-full"
                              >
                                {check.recommendation}
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    </ScrollArea>
                  ) : (
                    // Show overview categories
                    <div className="space-y-6">
                      {groupedChecks && Object.entries(groupedChecks).map(([category, checks]) => {
                        const status = getCategoryStatus(checks);
                        const passedCount = checks.filter(check => check.passed).length;
                        return (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-4 hover:bg-background2 transition-colors cursor-pointer"
                            onClick={() => setSelectedCategory(category)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-medium">{category} SEO</h3>
                              <div className="flex items-center gap-2">
                                {getCategoryStatusIcon(status)}
                                <span className="text-sm text-muted-foreground">
                                  {passedCount}/{checks.length} passed
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              {checks.map((check, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  {check.passed ? 
                                    <CheckCircle className="h-4 w-4 text-greenText flex-shrink-0" /> : 
                                    <XCircle className="h-4 w-4 text-redText flex-shrink-0" />
                                  }
                                  <span>{check.title}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}