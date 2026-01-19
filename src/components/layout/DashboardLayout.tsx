import React, { useState, useEffect } from "react";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/use-page-title";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Ativa títulos dinâmicos
  usePageTitle();

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login");
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:block w-64 border-r p-4 space-y-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-2 pt-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b flex items-center px-4 justify-between">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="p-6 space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          !isMobile ? "ml-64" : "ml-0"
        )}
      >
        <Header setSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;