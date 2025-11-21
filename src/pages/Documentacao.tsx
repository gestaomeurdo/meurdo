import DashboardLayout from "@/components/layout/DashboardLayout";

const Documentacao = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Documentação da Obra</h1>
        <p className="text-muted-foreground">
          Organização e upload de contratos, projetos e comprovantes.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Documentacao;