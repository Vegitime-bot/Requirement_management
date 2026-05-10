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
import { ArrowLeft, Layers, FileText, Plus, Trash2, Tag } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import Link from "next/link";

interface Variant {
  id: string;
  product_id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

interface Requirement {
  id: string;
  product_id: string;
  category_id?: string;
  variant_id?: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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

export default function VariantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const variantId = params.id as string;

  const [variant, setVariant] = useState<Variant | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (variantId) {
      fetchData();
    }
  }, [variantId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch variant
      const variantRes = await fetch(`${API_BASE_URL}/variants/${variantId}`);
      if (!variantRes.ok) throw new Error("Failed to fetch variant");
      const variantData = await variantRes.json();
      setVariant(variantData);
      setEditName(variantData.name);
      setEditCode(variantData.code || "");
      setEditDesc(variantData.description || "");

      // Fetch product
      const productRes = await fetch(`${API_BASE_URL}/products/${variantData.product_id}`);
      if (productRes.ok) {
        const productData = await productRes.json();
        setProduct(productData);
      }

      // Fetch categories
      const catRes = await fetch(`${API_BASE_URL}/products/${variantData.product_id}/categories/`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // Fetch requirements for this variant
      const reqRes = await fetch(`${API_BASE_URL}/products/${variantData.product_id}/requirements/?variant_id=${variantId}`);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        // Filter by variant_id if API doesn't
        const filtered = reqData.filter((r: Requirement) => r.variant_id === variantId);
        setRequirements(filtered);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVariant = async () => {
    if (!editName.trim() || !variant) return;

    try {
      const res = await fetch(`${API_BASE_URL}/products/${variant.product_id}/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, code: editCode, description: editDesc }),
      });

      if (!res.ok) throw new Error("Failed to update variant");

      setEditDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteVariant = async () => {
    if (!variant) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${variant.product_id}/variants/${variantId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete variant");
      }

      router.push(`/products/${variant.product_id}`);
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
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

  if (error || !variant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-red-500 mb-4 text-lg">{error || "Variant not found"}</div>
          <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <PageHeader title={variant.name} subtitle={`Variant of ${product?.name || "Product"}`} />

      {/* Sub Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/products/${variant.product_id}`}>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Product
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Edit Variant</DialogTitle>
                  <DialogDescription className="text-slate-500">Update variant information.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ename" className="text-sm font-medium text-slate-700">Name *</Label>
                    <Input
                      id="ename"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g., Enterprise Edition"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ecode" className="text-sm font-medium text-slate-700">Code</Label>
                    <Input
                      id="ecode"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      placeholder="e.g., ENT"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edesc" className="text-sm font-medium text-slate-700">Description</Label>
                    <Input
                      id="edesc"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Enter description"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="px-6">Cancel</Button>
                  <Button onClick={handleUpdateVariant} disabled={!editName.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6">
                    Update
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-semibold">Delete Variant</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500">
                    Are you sure you want to delete &quot;{variant.name}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="px-6">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteVariant}
                    className="bg-red-500 hover:bg-red-600 text-white px-6"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        {/* Variant Info Card */}
        <Card className="mb-8 bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-800">{variant.name}</CardTitle>
                {variant.code && (
                  <Badge className="mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    Code: {variant.code}
                  </Badge>
                )}
                {variant.description && (
                  <CardDescription className="mt-2 text-slate-500">{variant.description}</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Requirements */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Requirements</h2>
              <p className="text-slate-500 mt-1">Requirements for this variant</p>
            </div>
            <Link href={`/requirements/new?product_id=${variant.product_id}&variant_id=${variantId}`}>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                <Plus className="h-4 w-4 mr-2" />
                New Requirement
              </Button>
            </Link>
          </div>

          {requirements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No requirements yet</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create requirements for this variant</p>
              <Link href={`/requirements/new?product_id=${variant.product_id}&variant_id=${variantId}`}>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6">
                  Create requirement
                </Button>
              </Link>
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
                        {req.content && (
                          <CardDescription className="mt-1 text-slate-500 line-clamp-2">
                            {req.content}
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
      </main>

      <PageFooter />
    </div>
  );
}
