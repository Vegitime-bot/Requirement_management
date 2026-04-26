"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Sparkles, CheckCircle, AlertCircle, GitCompare } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = "http://100.73.184.77:8010";

interface ExtractedReq {
  title: string;
  description: string;
  priority: string;
  confidence: number;
  is_product_requirement: boolean;
  reason: string;
}

interface Suggestion {
  extracted_index: number;
  action: "create" | "update" | "skip";
  reason: string;
  existing_id?: string;
  similarity?: number;
}

export default function IngestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("product_id");

  const [step, setStep] = useState<"input" | "analyzing" | "review">("input");
  const [contextText, setContextText] = useState("");
  const [sourceType, setSourceType] = useState("email");
  const [extracted, setExtracted] = useState<ExtractedReq[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedActions, setSelectedActions] = useState<Record<number, string>>({});
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!contextText.trim() || !productId) return;

    setStep("analyzing");
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/ingest/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          context_text: contextText,
          source_type: sourceType,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      setExtracted(data.extracted);
      setSuggestions(data.suggestions);
      
      // Initialize selected actions from suggestions
      const initial: Record<number, string> = {};
      data.suggestions.forEach((s: Suggestion) => {
        initial[s.extracted_index] = s.action;
      });
      setSelectedActions(initial);
      
      setStep("review");
    } catch (err: any) {
      setError(err.message);
      setStep("input");
    }
  };

  const handleApply = async () => {
    if (!productId) return;

    setApplying(true);
    try {
      const actions = Object.entries(selectedActions).map(([idx, action]) => ({
        extracted_index: parseInt(idx),
        type: action,
        existing_id: suggestions.find(s => s.extracted_index === parseInt(idx))?.existing_id,
      }));

      const res = await fetch(`${API_BASE_URL}/ingest/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          extracted_requirements: extracted,
          actions,
        }),
      });

      if (!res.ok) throw new Error("Failed to apply");

      // Navigate to product requirements
      router.push(`/products/${productId}`);
    } catch (err: any) {
      setError(err.message);
      setApplying(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-500 hover:bg-green-600";
      case "update": return "bg-blue-500 hover:bg-blue-600";
      case "skip": return "bg-gray-500 hover:bg-gray-600";
      default: return "bg-gray-500";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "create": return "Create New";
      case "update": return "Update Existing";
      case "skip": return "Skip";
      default: return action;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={productId ? `/products/${productId}` : "/"}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Ingest Context</h1>
                <p className="text-muted-foreground text-sm">
                  Extract requirements from documents, emails, or specs
                </p>
              </div>
            </div>

            {step === "review" && (
              <Button onClick={handleApply} disabled={applying}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {applying ? "Applying..." : "Apply Changes"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {step === "input" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paste Context</CardTitle>
                <CardDescription>
                  Paste email, spec document, meeting notes, or any text containing requirements.
                  The AI will filter out non-requirements like deadlines, requests, etc.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Source Type</Label>
                    <Select value={sourceType} onValueChange={setSourceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="spec">Specification</SelectItem>
                        <SelectItem value="meeting">Meeting Notes</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder={`Example:\n\nFrom: Product Manager\nSubject: New Features for Q2\n\nThe system must support user authentication via OAuth.\nWe also need to implement real-time notifications.\nPlease fix the login bug ASAP.\nDeadline: End of month.`}
                  rows={12}
                />

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!contextText.trim() || !productId}
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Context
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "analyzing" && (
          <div className="max-w-md mx-auto text-center py-12">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-xl font-bold mb-2">Analyzing Context</h2>
            <p className="text-muted-foreground">AI is extracting requirements and filtering non-requirements...⏎\n            </p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Review Extracted Requirements</h2>
                <p className="text-muted-foreground">
                  Review AI suggestions and select actions for each item.
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {extracted.filter((_, i) => selectedActions[i] !== "skip").length} to apply
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              {extracted.map((req, idx) => {
                const suggestion = suggestions.find(s => s.extracted_index === idx);
                const isProductReq = req.is_product_requirement;

                return (
                  <Card 
                    key={idx} 
                    className={!isProductReq ? "opacity-60" : ""}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {/* Checkbox for selection */}
                        <div className="pt-1">
                          {!isProductReq ? (
                            <Badge variant="outline" className="text-gray-500">
                              Skip
                            </Badge>
                          ) : (
                            <Select
                              value={selectedActions[idx] || "skip"}
                              onValueChange={(v) => setSelectedActions({
                                ...selectedActions,
                                [idx]: v
                              })}
                            >
                              <SelectTrigger className={`w-32 text-white ${getActionColor(selectedActions[idx])}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="create">➕ Create New</SelectItem>
                                <SelectItem value="update">📝 Update Existing</SelectItem>
                                <SelectItem value="skip">⏭️ Skip</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{req.title}</span>
                            <Badge 
                              variant={req.priority === 'high' ? 'destructive' : 'secondary'}
                            >
                              {req.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(req.confidence * 100)}% confidence
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-2">
                            {req.description}
                          </p>

                          {/* AI Reason */}
                          <div className="flex items-center gap-2 text-xs">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-muted-foreground">{req.reason}</span>
                          </div>

                          {/* Suggestion reason */}
                          {suggestion && suggestion.action !== "skip" && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <div className="flex items-center gap-2">
                                <GitCompare className="h-4 w-4 text-primary" />
                                <span>{suggestion.reason}</span>
                                {suggestion.similarity && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(suggestion.similarity * 100)}% match
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
