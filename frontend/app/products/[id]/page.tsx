"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Layers, Tag, FileText, Plus, Trash2, Sparkles } from "lucide-react";
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

const API_BASE_URL = "/api";

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  review: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  implemented: "bg-blue-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-yellow-400",
  high: "bg-orange-500",
  critical: "bg-red-600",
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error || "Product not found"}</div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/product-groups/${product.group_id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Group
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {product.description && (
                  <p className="text-muted-foreground text-sm">{product.description}</p>
                )}
              </div>
            </div>
            
            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone.
                    All variants, categories, and requirements will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteProduct}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="variants" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="variants">
              <Layers className="h-4 w-4 mr-2" />
              Variants ({variants.length})
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tag className="h-4 w-4 mr-2" />
              Categories ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="requirements">
              <FileText className="h-4 w-4 mr-2" />
              Requirements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="variants" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Product Variants</h2>
                <p className="text-muted-foreground">Manage product variants (e.g., Standard, Pro, Enterprise)</p>
              </div>
              <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
                <DialogTrigger render={<Button />}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Variant
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Variant</DialogTitle>
                    <DialogDescription>Create a new product variant.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="vname">Name *</Label>
                      <Input
                        id="vname"
                        value={newVariantName}
                        onChange={(e) => setNewVariantName(e.target.value)}
                        placeholder="e.g., Enterprise Edition"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vdesc">Description</Label>
                      <Input
                        id="vdesc"
                        value={newVariantDesc}
                        onChange={(e) => setNewVariantDesc(e.target.value)}
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateVariant} disabled={!newVariantName.trim()}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            {variants.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No variants yet</p>
                  <Button onClick={() => setVariantDialogOpen(true)}>Create your first variant</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map((variant) => (
                  <Card key={variant.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{variant.name}</CardTitle>
                          {variant.description && (
                            <CardDescription className="mt-1">{variant.description}</CardDescription>
                          )}
                        </div>
                        <Layers className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary">Variant</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Categories</h2>
                <p className="text-muted-foreground">Organize requirements by category</p>
              </div>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger render={<Button />}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Category</DialogTitle>
                    <DialogDescription>Create a new category for requirements.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cname">Name *</Label>
                      <Input
                        id="cname"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., Security"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cdesc">Description</Label>
                      <Input
                        id="cdesc"
                        value={newCategoryDesc}
                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            {categories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No categories yet</p>
                  <Button onClick={() => setCategoryDialogOpen(true)}>Create your first category</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          {category.description && (
                            <CardDescription className="mt-1">{category.description}</CardDescription>
                          )}
                        </div>
                        <Tag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline">Category</Badge>
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
                  <h2 className="text-xl font-semibold">Requirements</h2>
                  <p className="text-muted-foreground">Manage product requirements</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/ingest?product_id=${productId}`}>
                    <Button variant="outline">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ingest Context
                    </Button>
                  </Link>
                  <Link href={`/requirements/new?product_id=${productId}`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New
                    </Button>
                  </Link>
                </div>
              </div>

              <Separator />

              {requirements.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No requirements yet</p>
                    <div className="flex justify-center gap-2">
                      <Link href={`/ingest?product_id=${productId}`}>
                        <Button variant="outline" className="mr-2">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Ingest from Context
                        </Button>
                      </Link>
                      <Link href={`/requirements/new?product_id=${productId}`}>
                        <Button>Create manually</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {requirements.map((req) => (
                    <Card key={req.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/requirements/${req.id}`}>
                              <CardTitle className="text-lg hover:text-primary cursor-pointer">
                                {req.title}
                              </CardTitle>
                            </Link>
                            {req.description && (
                              <CardDescription className="mt-1 line-clamp-2">
                                {req.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={priorityColors[req.priority] || "bg-gray-400"}>
                              {req.priority}
                            </Badge>
                            <Badge className={statusColors[req.status] || "bg-gray-500"}>
                              {req.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {req.category_id && (
                            <span>
                              Category: {categories.find(c => c.id === req.category_id)?.name || "Unknown"}
                            </span>
                          )}
                          {req.variant_id && (
                            <span>
                              Variant: {variants.find(v => v.id === req.variant_id)?.name || "Unknown"}
                            </span>
                          )}
                          <span className="ml-auto">
                            Updated: {new Date(req.updated_at).toLocaleDateString()}
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
    </div>
  );
}
