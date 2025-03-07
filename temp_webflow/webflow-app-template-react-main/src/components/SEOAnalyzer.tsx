import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  XCircle,
  Copy,
  AlertTriangle,
  CircleAlert,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { analyzeSEO } from "@/lib/api";
import type { SEOAnalysisResult, SEOCheck } from "@/lib/types";

const formSchema = z.object({
  keyphrase: z.string().min(2, "Keyphrase must be at least 2 characters"),
});

interface SEOAnalyzerProps {
  selectedElement: any;
}

export default function SEOAnalyzer({ selectedElement }: SEOAnalyzerProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<SEOAnalysisResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyphrase: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Get the current page from Webflow
      const page = await webflow.getCurrentPage();

      if (!page) {
        throw new Error("Could not detect the current page in Webflow Designer");
      }

      // Check production URL first
      if (page.productionUrl) {
        return analyzeSEO({
          url: page.productionUrl,
          keyphrase: data.keyphrase,
        });
      }

      // If no production URL, try staging URL
      if (page.stagingUrl) {
        return analyzeSEO({
          url: page.stagingUrl,
          keyphrase: data.keyphrase,
        });
      }

      // If neither URL exists, throw an error
      throw new Error(
        "This page hasn't been published yet. Please publish to either production or staging to analyze SEO."
      );
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  });

  const copyToClipboard = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Recommendation copied to clipboard"
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">SEO Analysis</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="keyphrase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Keyphrase</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter target keyphrase" />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Analyzing..." : "Analyze SEO"}
          </Button>
        </form>
      </Form>

      {results && (
        <ScrollArea className="h-[500px] w-full">
          <div className="space-y-4">
            {results.checks.map((check, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border p-4 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      {check.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {check.title}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                  </div>
                  {!check.passed && check.recommendation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(check.recommendation)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  )}
                </div>
                {!check.passed && check.recommendation && (
                  <div className="mt-4 text-sm p-3 bg-gray-50 rounded">
                    {check.recommendation}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}