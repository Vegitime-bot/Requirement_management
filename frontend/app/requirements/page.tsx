"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Filter, Search } from "lucide-react";
import Link from "next/link";

interface Requirement {
  id: string;
  title: string;
  content: string;
  status: string;
  priority?: string;
  product_id?: string;
  variant_id?: string;
  category_id?: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
}

const API_BASE_URL = "http://100.73.184.77:8010";

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get all products first (we'll need to fetch requirements per product)
      const productsRes = await fetch(`${API_BASE_URL}/products/`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
        
        // Fetch requirements for each product
        const allRequirements: Requirement[] = [];
        for (const product of productsData) {
          // This endpoint might not exist yet, so we catch errors
          try {
            const reqRes = await fetch(`${API_BASE_URL}/products/${product.id}/requirements/`);
            if (reqRes.ok) {
              const reqs = await reqRes.json();
              allRequirements.push(...reqs.map((r: any) => ({ ...r, product_name: product.name })));
            }
          } catch (e) {
            // Ignore - endpoint not implemented yet
          }
        }
        setRequirements(allRequirements);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "secondary",
      pending: "warning",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] as any || "secondary"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const variants: Record<string, string> = {
      low: "secondary",
      medium: "default",
      high: "destructive",
    };
    return <Badge variant={variants[priority] as any || "secondary"}>{priority}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Requirements</h1>
                <p className="text-muted-foreground text-sm">Manage and track requirements</p>
              </div>
            </div>
            <Link href="/requirements/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Requirement
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Separator className="mb-6" />

        {/* Requirements List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : requirements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No requirements yet</p>
              <Link href="/requirements/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first requirement
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredRequirements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No requirements match your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequirements.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{req.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {req.content}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(req.status)}
                      {getPriorityBadge(req.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Created {new Date(req.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{(req as any).product_name || "Unknown Product"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
