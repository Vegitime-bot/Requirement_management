"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Folder, Plus, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
}

const API_BASE_URL = "http://100.73.184.77:8010";

export default function Home() {
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
      
      // Fetch health
      const healthRes = await fetch(`${API_BASE_URL}/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
      
      // Fetch groups
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg mb-2">Loading RMS...</div>
          <div className="text-sm text-muted-foreground">Connecting to API...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">RMS</h1>
          </div>
          <div className="flex items-center gap-4">
            {health ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>API v{health.version}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>API Offline</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Product Groups</h2>
              <p className="text-muted-foreground">Manage your product groups</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Product Group</DialogTitle>
                  <DialogDescription>
                    Create a new product group to organize your products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newGroupDesc}
                      onChange={(e) => setNewGroupDesc(e.target.value)}
                      placeholder="Enter description"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No product groups yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first group
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link key={group.id} href={`/product-groups/${group.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {group.description && (
                          <CardDescription className="mt-1">
                            {group.description}
                          </CardDescription>
                        )}
                      </div>
                      <Folder className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Owner</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(group.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Requirements Management System 2024
        </div>
      </footer>
    </div>
  );
}
