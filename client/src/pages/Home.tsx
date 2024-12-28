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
import { motion, AnimatePresence } from "framer-motion";
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background p-4 md:p-8"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
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
                          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Input placeholder="https://example.com" {...field} />
                          </motion.div>
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
                          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Input placeholder="Enter your target keyphrase" {...field} />
                          </motion.div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="w-full"
                    >
                      {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Analyze SEO
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-sm text-muted-foreground"
                  >
                    {results.passedChecks} passes ✅ • {results.failedChecks} improvements needed ❌
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <motion.div
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className="space-y-6"
                    >
                      {results.checks.map((check, index) => (
                        <motion.div
                          key={index}
                          variants={item}
                          className="border p-4"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-medium flex items-center gap-2"
                              >
                                {check.passed ? (
                                  <CheckCircle className="h-5 w-5 text-greenText" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-redText" />
                                )}
                                {check.title}
                              </motion.div>
                              <p className="text-sm text-muted-foreground">
                                {check.description}
                              </p>
                            </div>
                            {!check.passed && check.recommendation && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                              className="mt-4 text-sm p-3 bg-background3"
                            >
                              {check.recommendation}
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}