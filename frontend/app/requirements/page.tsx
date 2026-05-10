"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Filter, Search, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
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

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <PageHeader title="Requirements" subtitle="Manage and track all requirements" />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 flex-1">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-slate-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
              <SelectTrigger className="w-[180px] h-11 border-slate-200">
                <Filter className="h-4 w-4 mr-2 text-slate-500" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/requirements/new">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 h-11">
                <Plus className="h-4 w-4 mr-2" />
                New Requirement
              </Button>
            </Link>
          </div>
        </div>

        {/* Requirements List */}
        {requirements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No requirements yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first requirement to start tracking</p>
            <Link href="/requirements/new">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                <Plus className="h-4 w-4 mr-2" />
                Create your first requirement
              </Button>
            </Link>
          </div>
        ) : filteredRequirements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
            <p className="text-slate-500">No requirements match your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequirements.map((req) => (
              <Card key={req.id} className="group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/requirements/${req.id}`}>
                        <CardTitle className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors cursor-pointer">
                          {req.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="mt-1 text-slate-500 line-clamp-2">
                        {req.content}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Badge className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[req.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                        {req.status}
                      </Badge>
                      {req.priority && (
                        <Badge className={`px-2.5 py-1 rounded-full text-xs font-medium border ${priorityStyles[req.priority] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {req.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>Created {new Date(req.created_at).toLocaleDateString()}</span>
                    <span className="text-slate-300">•</span>
                    <span>{(req as any).product_name || "Unknown Product"}</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <PageFooter />
    </div>
  );
}
