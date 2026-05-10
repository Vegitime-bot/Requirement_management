"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, Plus, CheckCircle, AlertCircle, Layers, ArrowRight, TrendingUp, Users, Box } from "lucide-react";
import Link from "next/link";

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

const API_BASE_URL = "http://127.0.0.1:8020";

// 개선된 카드 스타일 클래스
const cardStyles = "group bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden";

const iconWrapperStyles = "w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300";

const badgeStyles = "px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60";

export default function HomeImproved() {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [health, setHealth] = useState<{status: string; version: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
      
      const groupsRes = await fetch(`${API_BASE_URL}/product-groups/`);
      if (!groupsRes.ok) throw new Error("Failed to fetch groups");
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/product-groups/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
      });
      
      if (!res.ok) throw new Error("Failed to create group");
      
      setNewGroupName("");
      setNewGroupDesc("");
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Create error:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          </div>
          <div className="text-lg font-medium text-slate-700">Loading RMS...</div>
          <div className="text-sm text-slate-500 mt-1">Connecting to API...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Header */}
      <header className="bg-white border-b border-slate-200/60">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">LSI Requirement Management System</h1>
                <p className="text-sm text-slate-500">Streamline your product requirements workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {health && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-700">{health.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="container mx-auto px-6 -mt-3">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 flex items-center justify-around">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Box className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{groups.length}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Product Groups</div>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">1</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active Projects</div>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">4</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Requirements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Product Groups</h2>
              <p className="text-slate-500 mt-1">Manage and organize your product groups</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Create Product Group</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    Create a new product group to organize your products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Name *</Label>
                    <Input
                      id="name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
                    <Input
                      id="description"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Enter description"
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="px-6">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateGroup} 
                    disabled={!newGroupName.trim()}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6"
                  >
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Groups Grid - 개선된 디자인 */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Folder className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No product groups yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first product group to start organizing requirements</p>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Link key={group.id} href={`/product-groups/${group.id}`}>
                <div className={cardStyles}>
                  {/* Card Top Accent */}
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                  
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={iconWrapperStyles}>
                        <Folder className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                      <span className={badgeStyles}>Owner</span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{new Date(group.created_at).toLocaleDateString()}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 mt-auto">
        <div className="container mx-auto px-6 py-5 text-center text-sm text-slate-500">
          LSI Requirement Management System
        </div>
      </footer>
    </div>
  );
}
