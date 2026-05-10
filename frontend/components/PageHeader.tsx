"use client";

import { Layers } from "lucide-react";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showStatus?: boolean;
  status?: { status: string; version: string } | null;
}

export function PageHeader({ 
  title = "LSI Requirement Management System", 
  subtitle = "Streamline your product requirements workflow",
  showStatus = false,
  status 
}: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/60">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {showStatus && status && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">{status.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
