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
import { Loader2, CheckCircle, XCircle, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { analyzeSEO } from "@/lib/api";
import type { SEOAnalysisResult } from "@/lib/types";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  keyphrase: z.string().min(2, "Keyphrase must be at least 2 characters")
});

export default function Home() {
  const { toast } = useToast();
  const [results, setResults] = useState<SEOAnalysisResult | null>(null);

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
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;

    // Extract the text after "Here is a better X: " pattern
    const match = text.match(/Here is a better [^:]+:\s*(.*)/);
    const recommendationText = match ? match[1].trim() : text;

    // Remove surrounding quotation marks if present
    const cleanText = recommendationText.replace(/^"|"$/g, '');

    navigator.clipboard.writeText(cleanText);
    toast({
      title: "Copied!",
      description: "Recommendation copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>SEO Analysis Tool</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL to analyze</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keyphrase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target keyphrase</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your target keyphrase" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Analyze SEO
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <div className="text-sm text-muted-foreground">
                {results.passedChecks} passes ✅ • {results.failedChecks} improvements needed ❌
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {results.checks.map((check, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {check.passed ? (
                              <CheckCircle className="h-5 w-5 text-greenText" />
                            ) : (
                              <XCircle className="h-5 w-5 text-redText" />
                            )}
                            {check.title}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {check.description}
                          </p>
                        </div>
                        {!check.passed && check.recommendation && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                  onClick={() => copyToClipboard(check.recommendation)}
                                >
                                  <Copy className="h-4 w-4" />
                                  Copy
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy recommendation to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {!check.passed && check.recommendation && (
                        <div className="mt-4 text-sm p-3 bg-background3 rounded-md">
                          {check.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}