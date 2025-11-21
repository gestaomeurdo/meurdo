import DashboardLayout from "@/components/layout/DashboardLayout";

const MaoDeObra = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Gestão de Mão de Obra</h1>
        <p className="text-muted-foreground">
          Controle de equipes, diárias e agenda de tarefas.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default MaoDeObra;