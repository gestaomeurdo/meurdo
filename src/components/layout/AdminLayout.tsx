import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LifeBuoy, Users, ArrowLeft, Menu, X, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { title: "Métricas SaaS", href: "/admin", icon: LayoutDashboard },
    { title: "Chamados Suporte", href: "/admin/tickets", icon: LifeBuoy },
    { title: "Gestão Usuários", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* SIDEBAR ADMIN */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out border-r border-white/10",
        !isSidebarOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 h-full flex flex-col">
          <div className="mb-10 flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
                <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
                <h2 className="font-black uppercase tracking-tighter text-xl">Meu RDO</h2>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Backoffice Admin</p>
            </div>
          </div>

          <nav className="flex-grow space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center p-4 rounded-2xl transition-all font-bold text-sm",
                  location.pathname === item.href
                    ? "bg-purple-600 text-white shadow-xl shadow-purple-900/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
              <Link to="/dashboard" className="flex items-center p-4 rounded-2xl text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao App
              </Link>
          </div>
        </div>
      </aside>

      {/* MOBILE TRIGGER */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed bottom-6 right-6 lg:hidden z-50 bg-purple-600 text-white rounded-full h-14 w-14 shadow-2xl"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </Button>

      <main className="flex-1 lg:ml-72 flex flex-col">
        {/* TOP BAR STATUS */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"></div>
        <div className="p-4 sm:p-10 flex-1">
            {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;