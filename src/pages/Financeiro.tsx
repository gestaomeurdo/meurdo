import DashboardLayout from "@/components/layout/DashboardLayout";

const Financeiro = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Controle Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie lançamentos de despesas e visualize relatórios financeiros.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Financeiro;