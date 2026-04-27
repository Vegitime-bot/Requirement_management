"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, History, Edit, Trash2, CheckCircle, Clock, User, Save, X } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = "/api";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Requirement not found</div>
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
              <Link href={product ? `/products/${product.id}` : "/"}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {product?.name || "Product"}
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure? This will permanently delete &quot;{req.title}&quot;.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {isEditing ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-xl font-semibold"
                        />
                      ) : (
                        req.title
                      )}
                    </CardTitle>
                    {!isEditing && product && (
                      <CardDescription className="mt-2">
                        Product: {product.name}
                      </CardDescription>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[req.status]}>{req.status}</Badge>
                      <Badge className={priorityColors[req.priority]}>{req.priority}</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status & Priority - Edit Mode */}
                {isEditing && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v || 'draft')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="implemented">Implemented</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={editPriority} onValueChange={(v) => setEditPriority(v || 'medium')}>
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
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={6}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {req.description || "No description provided."}
                    </p>
                  )}
                </div>

                {/* Category - Edit Mode */}
                {isEditing && categories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={editCategoryId} onValueChange={(v) => setEditCategoryId(v || '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={undefined}>None</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History Tab */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Change History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {actions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No history yet</p>
                ) : (
                  <div className="space-y-4">
                    {actions.map((action) => (
                      <div key={action.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                        <div className="mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {actionTypeLabels[action.action_type] || action.action_type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(action.performed_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {(action.old_value || action.new_value) && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              {action.old_value && (
                                <span className="line-through mr-2">{action.old_value}</span>
                              )}
                              {action.new_value && (
                                <span className="text-green-600">→ {action.new_value}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p>{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p>{new Date(req.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {req.category_id && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p>{categories.find(c => c.id === req.category_id)?.name || "Unknown"}</p>
                    </div>
                  </div>
                )}

                {req.variant_id && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Variant</p>
                      <p>{variants.find(v => v.id === req.variant_id)?.name || "Unknown"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
