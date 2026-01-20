import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUserList'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const handleStartConversation = (userId: string) => {
    // Navega para o chat passando o ID do usuário no estado
    navigate('/admin/tickets', { state: { userId } });
  };

  const filtered = users?.filter(u => 
    u.first_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-8 space-y-10 bg-slate-950 min-h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">Base de Usuários</h1>
                <p className="text-sm text-slate-500 font-medium">Controle total dos engenheiros cadastrados.</p>
            </div>
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input placeholder="Filtrar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 rounded-2xl h-12 bg-slate-900 border-slate-800 text-white" />
            </div>
        </div>

        <div className="bg-slate-900/50 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
            {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-white" /></div> : (
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="border-slate-800">
                            <TableHead className="font-black uppercase text-[10px] tracking-widest pl-10 text-slate-400">Usuário</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Plano</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Empresa</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-10 text-slate-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered?.map(u => (
                            <TableRow key={u.id} className="hover:bg-white/5 transition-colors border-slate-800/50">
                                <TableCell className="pl-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold uppercase border border-slate-700 shadow-lg">{u.first_name?.[0] || 'U'}</div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{u.first_name} {u.last_name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{u.email || 'Engenheiro'}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("text-[9px] font-black uppercase px-3 py-1 border-none", u.plan_type === 'pro' ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400")}>
                                        {u.plan_type || 'FREE'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-slate-400 uppercase">{u.company_name || '-'}</TableCell>
                                <TableCell className="text-right pr-10">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white hover:bg-blue-600/20"
                                        onClick={() => handleStartConversation(u.id)}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 mr-2" /> Abrir Chat
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;