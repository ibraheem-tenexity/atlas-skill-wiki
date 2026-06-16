import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Atlas — Skill Registry & Wiki",
  description: "The Tenexity Skill Registry and Wiki for managing Claude Agent Skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex bg-background text-foreground antialiased">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          {/* Page header */}
          <header className="flex items-center h-14 px-6 border-b border-border bg-raised shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-muted-foreground">Tenexity</span>
              <span className="text-muted-foreground" aria-hidden="true">/</span>
              <span className="text-body-sm font-medium text-foreground">Atlas</span>
            </div>
          </header>

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
