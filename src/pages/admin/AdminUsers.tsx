import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Zap, Loader2, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUserList'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const filtered = users?.filter(u => 
    u.first_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div className="space-y-1">
                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">Base de Usuários</h1>
                <p className="text-sm text-muted-foreground font-medium">Gerencie permissões e visualize planos.</p>
            </div>
            <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-clean border overflow-hidden">
            {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-purple-600" /></div> : (
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8">Nome</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Plano</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Empresa</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered?.map(u => (
                            <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="pl-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold uppercase">{u.first_name?.[0]}{u.last_name?.[0]}</div>
                                        <div>
                                            <p className="font-bold text-sm leading-none">{u.first_name} {u.last_name}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase">{u.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("text-[9px] font-black uppercase tracking-tighter px-3 border-none", u.plan_type === 'pro' ? "bg-emerald-500" : "bg-slate-200 text-slate-500")}>
                                        {u.plan_type || 'FREE'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-slate-600">{u.company_name || 'Individual'}</TableCell>
                                <TableCell className="text-right pr-8">
                                    <Button variant="ghost" size="sm" className="rounded-xl h-9 text-[10px] font-black uppercase text-purple-600" asChild>
                                        <Link to="/dashboard"><ExternalLink className="w-3 h-3 mr-1.5" /> Investigar</Link>
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