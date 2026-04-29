"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Sparkles, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import Link from "next/link";

const API_BASE_URL = "http://100.73.184.77:8020";

interface Product {
  id: string;
  name: string;
  group_id: string;
}

interface Variant {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

function NewRequirementForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("product_id");

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState("medium");

  // AI Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      fetchProductData();
    } else {
      setError("Product ID is required");
      setLoading(false);
    }
  }, [productId]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      
      const data = await res.json();
      setProduct({ id: data.id, name: data.name, group_id: data.group_id });
      setVariants(data.variants || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!title.trim()) return;
    
    setAnalyzing(true);
    // Simulate AI analysis - replace with actual AI API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAnalysis(`Analysis for "${title}":\n\nThis requirement appears to be well-structured. Consider:\n1. Making the acceptance criteria more specific\n2. Adding edge cases\n3. Clarifying dependencies`);
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !productId) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/requirements/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          category_id: categoryId || null,
          variant_id: variantId || null,
          priority,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create requirement");
      }

      const req = await res.json();
      router.push(`/requirements/${req.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
        </div>
        <div className="text-lg font-medium text-slate-700 ml-4">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-slate-500 mb-4">{error || "Product not found"}</p>
          <Button 
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <PageHeader title="New Requirement" subtitle={`For product: ${product.name}`} />

      {/* Sub Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4">
          <Link href={`/products/${productId}`}>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Product
            </Button>
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">Requirement Details</h2>
                  <p className="text-slate-500 mt-1">Create a new requirement for your product</p>
                </div>

                <div className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium text-slate-700">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter requirement title"
                      className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAnalyze}
                        disabled={analyzing || !title.trim()}
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {analyzing ? "Analyzing..." : "AI Analyze"}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed description..."
                      rows={6}
                      className="border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  {analysis && (
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 mb-2">AI Analysis</h4>
                          <pre className="text-sm text-slate-600 whitespace-pre-wrap">
                            {analysis}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-slate-200" />

                  {/* Category & Variant */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Category</Label>
                      <Select value={categoryId} onValueChange={(v) => setCategoryId(v || "")}>
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value={undefined}>None</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Variant</Label>
                      <Select value={variantId} onValueChange={(v) => setVariantId(v || "")}>
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue placeholder="Select variant" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value={undefined}>All Variants</SelectItem>
                          {variants.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v || "medium")}>
                      <SelectTrigger className="h-11 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Link href={`/products/${productId}`}>
                      <Button variant="outline" className="px-6">Cancel</Button>
                    </Link>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={!title.trim() || saving}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 shadow-lg shadow-indigo-500/25"
                    >
                      {saving ? "Creating..." : "Create Requirement"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-800">Tips</h3>
                </div>
                <div className="text-sm text-slate-500 space-y-3">
                  <p className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Keep the title clear and concise</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Describe what, not how</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Include acceptance criteria</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>Use AI analysis for suggestions</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
}

export default function NewRequirementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    }>
      <NewRequirementForm />
    </Suspense>
  );
}
