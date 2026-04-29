"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, History, Edit, Trash2, CheckCircle, Clock, User, Save, X, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import Link from "next/link";

const API_BASE_URL = "http://100.73.184.77:8020";

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

interface Action {
  id: string;
  requirement_id: string;
  action_type: string;
  old_value?: string;
  new_value?: string;
  performed_by?: string;
  performed_at: string;
}

interface Product {
  id: string;
  name: string;
  group_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  name: string;
}

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

const actionTypeLabels: Record<string, string> = {
  CREATE: "Created",
  UPDATE_TITLE: "Title Updated",
  UPDATE_DESCRIPTION: "Description Updated",
  STATUS_CHANGE: "Status Changed",
  PRIORITY_CHANGE: "Priority Changed",
  CATEGORY_CHANGE: "Category Changed",
};

export default function RequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reqId = params.id as string;

  const [req, setReq] = useState<Requirement | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (reqId) fetchData();
  }, [reqId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get requirement
      const reqRes = await fetch(`${API_BASE_URL}/requirements/${reqId}`);
      if (!reqRes.ok) throw new Error("Requirement not found");
      const reqData = await reqRes.json();
      setReq(reqData);

      // Get product
      const prodRes = await fetch(`${API_BASE_URL}/products/${reqData.product_id}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProduct({ id: prodData.id, name: prodData.name, group_id: prodData.group_id });
        setCategories(prodData.categories || []);
        setVariants(prodData.variants || []);
      }

      // Get actions
      const actionsRes = await fetch(`${API_BASE_URL}/requirements/${reqId}/actions`);
      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        setActions(actionsData);
      }

      // Initialize edit form
      setEditTitle(reqData.title);
      setEditDescription(reqData.description || "");
      setEditStatus(reqData.status);
      setEditPriority(reqData.priority);
      setEditCategoryId(reqData.category_id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!req) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE_URL}/products/${req.product_id}/requirements/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          status: editStatus,
          priority: editPriority,
          category_id: editCategoryId,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setIsEditing(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!req) return;

    try {
      const res = await fetch(`${API_BASE_URL}/products/${req.product_id}/requirements/${reqId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error("Failed to delete");

      router.push(`/products/${req.product_id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = () => {
    if (!req) return;
    setEditTitle(req.title);
    setEditDescription(req.description || "");
    setEditStatus(req.status);
    setEditPriority(req.priority);
    setEditCategoryId(req.category_id);
    setIsEditing(false);
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

  if (!req) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-red-500 mb-4 text-lg">Requirement not found</div>
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
      <PageHeader title={req.title} subtitle={product ? `Product: ${product.name}` : "Requirement Details"} />

      {/* Sub Header */}
      <div className="bg-white border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={product ? `/products/${product.id}` : "/"}>
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-indigo-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {product?.name || "Product"}
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" />}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-semibold">Delete Requirement</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">
                        Are you sure? This will permanently delete &quot;{req.title}&quot;.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="px-6">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        className="bg-red-500 hover:bg-red-600 text-white px-6"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} className="px-4">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-xl font-semibold h-11 border-slate-200"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-slate-800">{req.title}</h1>
                    )}
                    {!isEditing && product && (
                      <p className="text-slate-500 mt-2">Product: {product.name}</p>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[req.status]}`}>
                        {req.status}
                      </Badge>
                      <Badge className={`px-2.5 py-1 rounded-full text-xs font-medium border ${priorityStyles[req.priority]}`}>
                        {req.priority}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Status & Priority - Edit Mode */}
                  {isEditing && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Status</Label>
                        <Select value={editStatus} onValueChange={(v) => setEditStatus(v || 'draft')}>
                          <SelectTrigger className="h-11 border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="implemented">Implemented</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Priority</Label>
                        <Select value={editPriority} onValueChange={(v) => setEditPriority(v || 'medium')}>
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
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={6}
                        className="border-slate-200"
                      />
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-4 text-slate-600">
                        {req.description || <span className="text-slate-400 italic">No description provided.</span>}
                      </div>
                    )}
                  </div>

                  {/* Category - Edit Mode */}
                  {isEditing && categories.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Category</Label>
                      <Select value={editCategoryId} onValueChange={(v) => setEditCategoryId(v || '')}>
                        <SelectTrigger className="h-11 border-slate-200">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value={undefined}>None</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <History className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-slate-800">Change History</h2>
                </div>

                {actions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <p className="text-slate-400">No history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actions.map((action) => (
                      <div key={action.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">
                              {actionTypeLabels[action.action_type] || action.action_type}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(action.performed_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {(action.old_value || action.new_value) && (
                            <div className="mt-2 text-sm bg-slate-50 p-3 rounded-lg">
                              {action.old_value && (
                                <span className="line-through text-slate-400 mr-3">{action.old_value}</span>
                              )}
                              {action.new_value && (
                                <span className="text-emerald-600 font-medium">→ {action.new_value}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
              <div className="p-5">
                <h3 className="font-semibold text-slate-800 mb-4">Details</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-500">Created</p>
                      <p className="font-medium text-slate-800">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-500">Last Updated</p>
                      <p className="font-medium text-slate-800">{new Date(req.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {req.category_id && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-slate-500">Category</p>
                        <p className="font-medium text-slate-800">{categories.find(c => c.id === req.category_id)?.name || "Unknown"}</p>
                      </div>
                    </div>
                  )}

                  {req.variant_id && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-slate-500">Variant</p>
                        <p className="font-medium text-slate-800">{variants.find(v => v.id === req.variant_id)?.name || "Unknown"}</p>
                      </div>
                    </div>
                  )}
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
