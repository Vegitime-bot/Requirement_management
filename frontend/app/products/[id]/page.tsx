"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Layers, Tag, FileText, Plus, Trash2, Sparkles, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import Link from "next/link";

interface Product {
  id: string;
  group_id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Variant {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Category {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Requirement {
  id: string;
  product_id: string;
  category_id?: string;
  variant_id?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = "http://100.73.184.77:8020";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  review: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  implemented: "bg-blue-50 text-blue-700 border-blue-200",
};

const priorityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Variant dialog
  const [activeTab, setActiveTab] = useState("variants");
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantDesc, setNewVariantDesc] = useState("");

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product");

      const data = await res.json();
      setProduct(data);
      setVariants(data.variants || []);
      setCategories(data.categories || []);
      
      // Fetch requirements
      const reqRes = await fetch(`${API_BASE_URL}/products/${productId}/requirements/`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequirements(reqData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete product");
      }

      // Navigate back to group
      router.push(`/product-groups/${product.group_id}`);
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleCreateVariant = async () => {
    if (!newVariantName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/variants/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVariantName, description: newVariantDesc }),
      });

      if (!res.ok) throw new Error("Failed to create variant");

      setNewVariantName("");
      setNewVariantDesc("");
      setVariantDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}/categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
      });

      if (!res.ok) throw new Error("Failed to create category");

      setNewCategoryName("");
      setNewCategoryDesc("");
      setCategoryDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
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
          <div className="text-red-500 mb-4 text-lg">{error || "Product not found"}</div>
          <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <PageHeader title={product.name} subtitle={product.description || "Product Details"} />

      {/* Sub Header with Tabs */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/product-groups/${product.group_id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Group
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold">Delete Product</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500">
                  Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone.
                  All variants, categories, and requirements will also be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="px-6">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteProduct}
                  className="bg-red-500 hover:bg-red-600 text-white px-6"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {/* Tabs */}
        <div className="container mx-auto px-6 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex justify-center">
            <TabsList className="bg-slate-100/80 border border-slate-200/60 p-1 flex w-full md:w-auto justify-center">
              <TabsTrigger value="variants" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm flex-1 md:flex-none">
                <Layers className="h-4 w-4 mr-2 shrink-0" />
                <span className="hidden sm:inline">Variants ({variants.length})</span>
                <span className="sm:hidden">Variants</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm flex-1 md:flex-none">
                <Tag className="h-4 w-4 mr-2 shrink-0" />
                <span className="hidden sm:inline">Categories ({categories.length})</span>
                <span className="sm:hidden">Categories</span>
              </TabsTrigger>
              <TabsTrigger value="requirements" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm flex-1 md:flex-none">
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                Requirements
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        <Tabs value={activeTab} className="w-full">

          <TabsContent value="variants" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Product Variants</h2>
                <p className="text-slate-500 mt-1">Manage product variants (e.g., Standard, Pro, Enterprise)</p>
              </div>
              <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    type="button"
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Variant
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Create Variant</DialogTitle>
                    <DialogDescription className="text-slate-500">Create a new product variant.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="vname" className="text-sm font-medium text-slate-700">Name *</Label>
                      <Input
                        id="vname"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                        placeholder="e.g., Enterprise Edition"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vdesc" className="text-sm font-medium text-slate-700">Description</Label>
                      <Input
                        id="vdesc"
                        value={newVariantDesc}
                        onChange={(e) => setNewVariantDesc(e.target.value)}
                        placeholder="Enter description"
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setVariantDialogOpen(false)} className="px-6">Cancel</Button>
                    <Button onClick={handleCreateVariant} disabled={!newVariantName.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6">
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {variants.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Layers className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No variants yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first product variant</p>
                <Button onClick={() => setVariantDialogOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                  Create your first variant
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {variants.map((variant) => (
                  <Card 
                    key={variant.id} 
                    className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/variants/${variant.id}`)}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                    <CardHeader className="pt-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                          <Layers className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {variant.name}
                          </CardTitle>
                          {variant.description && (
                            <CardDescription className="mt-1 text-slate-500 line-clamp-2">
                              {variant.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <Badge className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          Variant
                        </Badge>
                        <span className="text-xs text-slate-400">{variant.created_at ? new Date(variant.created_at).toLocaleDateString() : '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Categories</h2>
                <p className="text-slate-500 mt-1">Organize requirements by category</p>
              </div>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                    <Plus className="h-4 w-4 mr-2" />
                    New Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Create Category</DialogTitle>
                    <DialogDescription className="text-slate-500">Create a new category for requirements.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cname" className="text-sm font-medium text-slate-700">Name *</Label>
                      <Input
                        id="cname"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., Security"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cdesc" className="text-sm font-medium text-slate-700">Description</Label>
                      <Input
                        id="cdesc"
                        value={newCategoryDesc}
                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                        placeholder="Enter description"
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} className="px-6">Cancel</Button>
                    <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6">
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {categories.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Tag className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No categories yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first category</p>
                <Button onClick={() => setCategoryDialogOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                  Create your first category
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <Card key={category.id} className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                    <CardHeader className="pt-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                          <Tag className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {category.name}
                          </CardTitle>
                          {category.description && (
                            <CardDescription className="mt-1 text-slate-500 line-clamp-2">
                              {category.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <Badge className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
                          Category
                        </Badge>
                        <span className="text-xs text-slate-400">{category.created_at ? new Date(category.created_at).toLocaleDateString() : '-'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requirements">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Requirements</h2>
                  <p className="text-slate-500 mt-1">Manage product requirements</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/ingest?product_id=${productId}`}>
                    <Button variant="outline" className="border-slate-200">
                      <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                      Ingest Context
                    </Button>
                  </Link>
                  <Link href={`/requirements/new?product_id=${productId}`}>
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                  </Link>
                </div>
              </div>

              {requirements.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No requirements yet</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create requirements manually or ingest from context</p>
                  <div className="flex justify-center gap-3">
                    <Link href={`/ingest?product_id=${productId}`}>
                      <Button variant="outline" className="px-6">
                        <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                        Ingest from Context
                      </Button>
                    </Link>
                    <Link href={`/requirements/new?product_id=${productId}`}>
                      <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6">
                        Create manually
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirements.map((req) => (
                    <Card key={req.id} className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Link href={`/requirements/${req.id}`}>
                              <CardTitle className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors cursor-pointer">
                                {req.title}
                              </CardTitle>
                            </Link>
                            {req.description && (
                              <CardDescription className="mt-1 text-slate-500 line-clamp-2">
                                {req.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`px-2.5 py-1 rounded-full text-xs font-medium border ${priorityStyles[req.priority] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                              {req.priority}
                            </Badge>
                            <Badge className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[req.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                              {req.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {req.category_id && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3.5 w-3.5" />
                              {categories.find(c => c.id === req.category_id)?.name || "Unknown"}
                            </span>
                          )}
                          {req.variant_id && (
                            <span className="flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5" />
                              {variants.find(v => v.id === req.variant_id)?.name || "Unknown"}
                            </span>
                          )}
                          <span className="ml-auto text-slate-400">
                            Updated: {req.updated_at ? new Date(req.updated_at).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <PageFooter />
    </div>
  );
}
