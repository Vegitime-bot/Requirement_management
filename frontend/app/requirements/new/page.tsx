"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = "http://100.73.184.77:8010";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || "Product not found"}</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/products/${productId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Product
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">New Requirement</h1>
              <p className="text-muted-foreground text-sm">
                For product: {product.name}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Requirement Details</CardTitle>
                <CardDescription>
                  Create a new requirement for your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter requirement title"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAnalyze}
                      disabled={analyzing || !title.trim()}
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
                  />
                </div>

                {analysis && (
                  <Card className="bg-muted">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">AI Analysis</h4>
                          <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {analysis}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Category & Variant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
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
                    <Label>Variant</Label>
                    <Select value={variantId} onValueChange={setVariantId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Link href={`/products/${productId}`}>
                    <Button variant="outline">Cancel</Button>
                  </Link>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!title.trim() || saving}
                  >
                    {saving ? "Creating..." : "Create Requirement"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Keep the title clear and concise</p>
                <p>• Describe what, not how</p>
                <p>• Include acceptance criteria</p>
                <p>• Use AI analysis for suggestions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NewRequirementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...⏎\n      </div>}>
      <NewRequirementForm />
    </Suspense>
  );
}
