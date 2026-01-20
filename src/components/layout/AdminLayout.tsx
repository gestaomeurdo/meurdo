import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LifeBuoy, Users, ArrowLeft, Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { title: "Dashboard Admin", href: "/admin", icon: LayoutDashboard },
    { title: "Inbox de Suporte", href: "/admin/tickets", icon: LifeBuoy },
    { title: "Base de Usuários", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* SIDEBAR - MESMO ESTILO DO APP PRINCIPAL */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 flex items-center gap-3 px-2 pt-2">
            <div className="bg-[#066abc] p-2 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase">Meu RDO Admin</span>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center p-3 rounded-xl transition-all font-bold text-sm",
                  location.pathname === item.href
                    ? "bg-[#066abc] text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-800">
              <Link to="/dashboard" className="flex items-center p-3 rounded-xl text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao App
              </Link>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        <div className="h-1 bg-[#066abc]/30"></div>
        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </main>

      {/* MOBILE TRIGGER */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed bottom-6 right-6 lg:hidden z-50 bg-[#066abc] text-white rounded-full h-14 w-14 shadow-xl"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </Button>
    </div>
  );
};

export default AdminLayout;