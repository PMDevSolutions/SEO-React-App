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
         !checkTitle.toLowerCase().includes("h1/h2 keyword");
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

    const match = text.match(/Here is a better [^:]+:\s*(.*)/);
    const recommendationText = match ? match[1].trim() : text;
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
                  <CardTitle className="text-center">Analysis Results</CardTitle>
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-sm text-muted-foreground text-center"
                  >
                    {results.passedChecks} passes ✅ • {results.failedChecks} improvements needed ❌
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4 w-full">
                    <motion.div
                      variants={container}
                      initial="hidden"
                      animate="show"
                      className="space-y-5 w-full"
                    >
                      {results.checks.map((check, index) => (
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
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}