import { Link } from "@tanstack/react-router";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

/** Shared header + toast host for the Student Explorer pages. */
export function PageShell({ children, width = "max-w-5xl" }: { children: ReactNode; width?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3 text-sm font-medium">
          <Link to="/" className="font-bold text-teal-700">Student Explorer</Link>
          <Link to="/places" className="text-slate-600 hover:text-slate-900">Places</Link>
          <Link to="/places/new" className="text-slate-600 hover:text-slate-900">Add a place</Link>
          <Link to="/budget" className="text-slate-600 hover:text-slate-900">Budget</Link>
          <Link to="/outings/new" className="text-slate-600 hover:text-slate-900">Log outing</Link>
          <Link to="/admin" className="ml-auto text-slate-600 hover:text-slate-900">Admin</Link>
          <Link to="/login" className="text-slate-600 hover:text-slate-900">Sign in</Link>
        </nav>
      </header>
      <main className={`mx-auto p-6 ${width}`}>{children}</main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
