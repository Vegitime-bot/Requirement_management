"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Plus, Users, Settings, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import Link from "next/link";

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

interface Product {
  id: string;
  group_id: string;
  name: string;
  description?: string;
  created_at: string;
}

const API_BASE_URL = "http://100.73.184.77:8020";

export default function ProductGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<ProductGroup | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/product-groups/${groupId}`),
        fetch(`${API_BASE_URL}/products/`),
      ]);

      if (!groupRes.ok) throw new Error("Failed to fetch group");
      
      const groupData = await groupRes.json();
      setGroup(groupData);

      // Filter products for this group
      if (productsRes.ok) {
        const allProducts = await productsRes.json();
        setProducts(allProducts.filter((p: Product) => p.group_id === groupId));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: groupId,
          name: newProductName,
          description: newProductDesc,
        }),
      });

      if (!res.ok) throw new Error("Failed to create product");

      setNewProductName("");
      setNewProductDesc("");
      setDialogOpen(false);
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

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-red-500 mb-4 text-lg">{error || "Group not found"}</div>
          <Button onClick={() => router.push("/")} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <PageHeader title={group.name} subtitle={group.description || "Product Group Details"} />

      {/* Sub Header with Back Button */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </Link>
        </div>
        
        {/* Tabs */}
        <div className="container mx-auto px-6 pb-4">
          <Tabs defaultValue="products" className="w-full flex justify-center">
            <TabsList className="bg-slate-100/80 border border-slate-200/60 p-1 flex w-full md:w-auto justify-center">
              <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm flex-1 md:flex-none">
                <Package className="h-4 w-4 mr-2 shrink-0" />
                Products
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm flex-1 md:flex-none">
                <Users className="h-4 w-4 mr-2 shrink-0" />
                Members
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm flex-1 md:flex-none">
                <Settings className="h-4 w-4 mr-2 shrink-0" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        <Tabs defaultValue="products" className="w-full">

          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Products</h2>
                <p className="text-slate-500 mt-1">Manage products in this group</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                    <Plus className="h-4 w-4 mr-2" />
                    New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Create Product</DialogTitle>
                    <DialogDescription className="text-slate-500">Create a new product in this group.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700">Name *</Label>
                      <Input
                        id="name"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="Enter product name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                      <Input
                        id="description"
                        value={newProductDesc}
                        onChange={(e) => setNewProductDesc(e.target.value)}
                        placeholder="Enter description"
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} className="px-6">Cancel</Button>
                    <Button onClick={handleCreateProduct} disabled={!newProductName.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6">
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Package className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No products yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first product to start organizing requirements</p>
                <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                      <CardHeader className="pt-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                              {product.name}
                            </CardTitle>
                            {product.description && (
                              <CardDescription className="mt-1 text-slate-500 line-clamp-2">
                                {product.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <Badge className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Active
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{new Date(product.created_at).toLocaleDateString()}</span>
                            <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Members</h3>
              <p className="text-slate-500">Group members and permissions management coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Settings</h3>
              <p className="text-slate-500">Group settings and configuration coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <PageFooter />
    </div>
  );
}
