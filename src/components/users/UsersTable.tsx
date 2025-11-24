import { useUsers } from "@/hooks/use-users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserEditDialog from "./UserEditDialog";
import InviteUserDialog from "./InviteUserDialog";

const roleMap: Record<string, string> = {
  administrator: "Administrador",
  obra_user: "Usuário da Obra",
  view_only: "Visualizador",
};

const UsersTable = () => {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando usuários...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Erro ao carregar usuários: {error.message}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <InviteUserDialog />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Obras com Acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'N/A'}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleMap[user.role] || user.role}</TableCell>
                </TableCell>
                <TableCell>{user.obra_access?.length || 0}</TableCell>
                <TableCell className="text-right">
                  <UserEditDialog user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersTable;