import { useUsers, UserWithAccess } from "@/hooks/use-users";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UserEditDialog from "./UserEditDialog";
import InviteUserDialog from "./InviteUserDialog";
import { Profile } from "@/hooks/use-profile";

const roleMap: Record<Profile['role'], string> = {
  administrator: "Administrador",
  obra_user: "Usuário da Obra",
  view_only: "Visualizador",
};

// Helper function to get user's full name
const getUserFullName = (user: UserWithAccess) => {
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return 'N/A';
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
                  {getUserFullName(user)}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleMap[user.role] || user.role}</Badge>
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