import DashboardLayout from "@/components/layout/DashboardLayout";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Configurações e Usuários</h1>
        <p className="text-muted-foreground">
          Gerenciamento de perfis e permissões de acesso.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Settings;