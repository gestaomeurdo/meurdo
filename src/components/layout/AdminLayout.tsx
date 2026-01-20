import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LifeBuoy, Users, ArrowLeft, Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { title: "Métricas SaaS", href: "/admin", icon: LayoutDashboard },
    { title: "Inbox Suporte", href: "/admin/tickets", icon: LifeBuoy },
    { title: "Base de Usuários", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* SIDEBAR ADMIN FIXA */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-white/5 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-purple-600 p-2.5 rounded-2xl shadow-lg shadow-purple-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
                <h2 className="text-white font-black uppercase tracking-tighter text-xl leading-none">MEU RDO</h2>
                <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mt-1">Backoffice v1.0</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center p-4 rounded-2xl transition-all font-bold text-sm",
                  location.pathname === item.href
                    ? "bg-purple-600 text-white shadow-xl shadow-purple-900/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="pt-6 border-t border-white/5">
              <Link to="/dashboard" className="flex items-center p-4 rounded-2xl text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Site
              </Link>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"></div>
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </main>

      {/* MOBILE TRIGGER */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed bottom-6 right-6 lg:hidden z-50 bg-purple-600 text-white rounded-full h-14 w-14 shadow-2xl hover:bg-purple-700"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </Button>
    </div>
  );
};

export default AdminLayout;