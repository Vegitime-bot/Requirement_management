"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Sparkles, CheckCircle, AlertCircle, GitCompare, Tag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import Link from "next/link";

const API_BASE_URL = "/api";

interface ExtractedReq {
  title: string;
  description: string;
  priority: string;
  category?: string;
  category_id?: string;
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

interface SuggestedCategory {
  code: string;
  name: string;
  reason: string;
  example_requirements: string[];
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
  const [categories, setCategories] = useState<Array<{id: string, name: string, code: string}>>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<SuggestedCategory[]>([]);
  const [approvedCategories, setApprovedCategories] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!contextText.trim()) {
      setError("Please enter context text to analyze");
      return;
    }
    if (!productId) {
      setError("Product ID is missing. Please navigate from a product page.");
      return;
    }

    setStep("analyzing");
    setError(null);

    console.log("[DEBUG] Sending request:", { productId, contextText, sourceType });

    try {
      // Fetch categories for this product
      const catRes = await fetch(`${API_BASE_URL}/products/${productId}/categories/`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      const res = await fetch(`${API_BASE_URL}/ingest/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          context_text: contextText,
          source_type: sourceType,
        }),
      });

      console.log("[DEBUG] Response status:", res.status);

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        console.error("[DEBUG] Error response:", errText);
        let errMsg = `Analysis failed (${res.status})`;
        try {
          const errData = JSON.parse(errText);
          errMsg = errData.detail || errMsg;
        } catch {
          if (errText) errMsg += `: ${errText.substring(0, 200)}`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setExtracted(data.extracted);
      setSuggestions(data.suggestions);
      setSuggestedCategories(data.suggested_categories || []);
      setApprovedCategories(new Set()); // Reset
      
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

      // Build approved categories list
      const approvedCats = suggestedCategories
        .filter(cat => approvedCategories.has(cat.code))
        .map(cat => ({
          code: cat.code,
          name: cat.name,
        }));

      const res = await fetch(`${API_BASE_URL}/ingest/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          extracted_requirements: extracted,
          actions,
          suggested_categories: approvedCats,
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
      case "create": return "bg-emerald-500 hover:bg-emerald-600";
      case "update": return "bg-blue-500 hover:bg-blue-600";
      case "skip": return "bg-slate-400 hover:bg-slate-500";
      default: return "bg-slate-400";
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

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-50 text-red-700 border-red-200",
      medium: "bg-blue-50 text-blue-700 border-blue-200",
      low: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return styles[priority] || styles.low;
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <PageHeader title="Ingest Context" subtitle="Extract requirements from documents, emails, or specs" />

      {/* Sub Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={productId ? `/products/${productId}` : "/"}>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>

          {step === "review" && (
            <Button 
              onClick={handleApply} 
              disabled={applying}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {applying ? "Applying..." : "Apply Changes"}
            </Button>
          )}
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 flex-1">
        {step === "input" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Paste Context</h2>
                <p className="text-slate-500">
                  Paste email, spec document, meeting notes, or any text containing requirements.
                  The AI will filter out non-requirements like deadlines, requests, etc.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Source Type</Label>
                  <Select value={sourceType} onValueChange={(v) => setSourceType(v || 'email')}>
                    <SelectTrigger className="h-11 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="spec">Specification</SelectItem>
                      <SelectItem value="meeting">Meeting Notes</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder={`Example:

From: Product Manager
Subject: New Features for Q2

The system must support user authentication via OAuth.
We also need to implement real-time notifications.
Please fix the login bug ASAP.
Deadline: End of month.`}
                  rows={12}
                  className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                />

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!contextText.trim() || !productId}
                    size="lg"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Context
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-indigo-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Analyzing Context</h2>
            <p className="text-slate-500">AI is extracting requirements and filtering non-requirements...</p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Review Extracted Requirements</h2>
                <p className="text-slate-500 mt-1">
                  Review AI suggestions and select actions for each item.
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className="px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  {extracted.filter((_, i) => selectedActions[i] !== "skip").length} to apply
                </Badge>
              </div>
            </div>

            {/* Suggested Categories Banner */}
            {suggestedCategories.length > 0 && (
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/60 shadow-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-indigo-900">Suggested New Categories</h3>
                    <Badge className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border-0">
                      {suggestedCategories.length} suggested
                    </Badge>
                  </div>
                  <p className="text-sm text-indigo-600 mb-4">
                    The following categories were mentioned in the extracted requirements but don't exist yet. 
                    Check the ones you want to create before applying.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {suggestedCategories.map((cat) => (
                      <div
                        key={cat.code}
                        onClick={() => {
                          setApprovedCategories(prev => {
                            const next = new Set(prev);
                            if (next.has(cat.code)) {
                              next.delete(cat.code);
                            } else {
                              next.add(cat.code);
                            }
                            return next;
                          });
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          approvedCategories.has(cat.code)
                            ? "border-indigo-400 bg-white shadow-md"
                            : "border-slate-200 bg-white/60 hover:border-indigo-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            approvedCategories.has(cat.code)
                              ? "bg-indigo-500 border-indigo-500"
                              : "border-slate-300"
                          }`}>
                            {approvedCategories.has(cat.code) && (
                              <CheckCircle className="h-3.5 w-3.5 text-white" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-800">{cat.code}</span>
                          <span className="text-sm text-slate-500">- {cat.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{cat.reason}</p>
                        {cat.example_requirements && cat.example_requirements.length > 0 && (
                          <div className="text-xs text-slate-400">
                            Examples: {cat.example_requirements.slice(0, 2).join(", ")}
                            {cat.example_requirements.length > 2 && "..."}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="text-slate-500">
                      {approvedCategories.size} of {suggestedCategories.length} selected
                    </span>
                    {approvedCategories.size === 0 && (
                      <span className="text-amber-600">
                        (Categories won't be created — requirements may show &quot;No Category&quot;)
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {extracted.map((req, idx) => {
                const suggestion = suggestions.find(s => s.extracted_index === idx);
                const isProductReq = req.is_product_requirement;

                return (
                  <Card 
                    key={idx} 
                    className={`bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden ${!isProductReq ? "opacity-60" : ""}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {/* Checkbox for selection */}
                        <div className="pt-1 shrink-0">
                          <Select
                            value={selectedActions[idx] || "skip"}
                            onValueChange={(v) => setSelectedActions({
                              ...selectedActions,
                              [idx]: v || 'skip'
                            })}
                          >
                            <SelectTrigger className={`w-32 text-white border-0 ${getActionColor(selectedActions[idx])}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="create">➕ Create New</SelectItem>
                              <SelectItem value="update">📝 Update Existing</SelectItem>
                              <SelectItem value="skip">⏭️ Skip</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-semibold text-slate-800">{req.title}</span>
                            {/* Category selector */}
                        {categories.length > 0 && (
                          <Select
                            value={req.category_id || "__none__"}
                            onValueChange={(v) => {
                              const newCatId = v === "__none__" ? undefined : v;
                              setExtracted(prev => prev.map((r, i) => 
                                i === idx ? { ...r, category_id: newCatId, category: categories.find(c => c.id === newCatId)?.code || r.category } : r
                              ));
                            }}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs border-slate-200">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="__none__">No Category</SelectItem>
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.code ? `${cat.code} - ${cat.name}` : cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {req.category_id && (
                          <Badge className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadge(req.category)}`}>
                            {categories.find(c => c.id === req.category_id)?.code || req.category || "Cat"}
                          </Badge>
                        )}
                        {!req.category_id && req.category && (
                          <Badge className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠️ {req.category}
                          </Badge>
                        )}
                            <Badge className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(req.priority)}`}>
                              {req.priority}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {Math.round(req.confidence * 100)}% confidence
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-slate-600 mb-2">
                            {req.description}
                          </p>

                          {/* AI Reason */}
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            <span>{req.reason}</span>
                          </div>

                          {/* Suggestion reason */}
                          {suggestion && suggestion.action !== "skip" && (
                            <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm border border-indigo-100">
                              <div className="flex items-center gap-2">
                                <GitCompare className="h-4 w-4 text-indigo-500" />
                                <span className="text-slate-700">{suggestion.reason}</span>
                                {suggestion.similarity && (
                                  <Badge className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border-0">
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

      <PageFooter />
    </div>
  );
}
