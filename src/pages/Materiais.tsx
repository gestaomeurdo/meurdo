import DashboardLayout from "@/components/layout/DashboardLayout";

const Materiais = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Controle de Materiais</h1>
        <p className="text-muted-foreground">
          Gerencie fornecedores, estoque e checklists de entrega.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Materiais;