import DashboardLayout from "@/components/layout/DashboardLayout";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useObra, useDeleteObra } from "@/hooks/use-obras";
import { Loader2, ArrowLeft, MapPin, Calendar, DollarSign, Edit, Trash2, FileText, BarChart3, Package, ClipboardList, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/utils/formatters";
import ObraDialog from "@/components/obras/ObraDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";

const statusColorMap = {
  ativa: "bg-green-500",
  concluida: "bg-blue-500",
  pausada: "bg-yellow-500",
};

const statusLabelMap = {
  ativa: "Ativa",
  concluida: "Concluída",
  pausada: "Pausada",
};

const ObraDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: obra, isLoading, error } = useObra(id);
  const deleteMutation = useDeleteObra();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!obra) return;
    try {
      await deleteMutation.mutateAsync(obra.id);
      showSuccess(`Obra "${obra.nome}" excluída.`);
      navigate('/obras');
    } catch (err) {
      showError(`Erro ao excluir obra.`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !obra) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center h-[60vh] space-y-4">
          <h2 className="text-xl font-bold text-muted-foreground">Obra não encontrada</h2>
          <Button asChild variant="outline">
            <Link to="/obras"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Obras</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const modules = [
    {
      title: "Gestão de RDO",
      description: "Diários de obra, efetivo e clima.",
      icon: FileText,
      href: "/gestao-rdo",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Financeiro",
      description: "Custos, pagamentos e categorias.",
      icon: DollarSign,
      href: "/financeiro",
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Cronograma",
      description: "Atividades, etapas e prazos.",
      icon: ClipboardList,
      href: "/atividades",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Relatórios",
      description: "Indicadores e exportação PDF.",
      icon: BarChart3,
      href: "/relatorios",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      title: "Materiais",
      description: "Controle de insumos e entregas.",
      icon: Package,
      href: "/materiais",
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Documentação",
      description: "Projetos, contratos e arquivos.",
      icon: HardDrive,
      href: "/documentacao",
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent hover:text-primary" asChild>
            <Link to="/obras"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista</Link>
          </Button>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-3xl border shadow-sm">
            <div className="flex items-center gap-4">
                {obra.foto_url ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-muted shrink-0">
                        <img src={obra.foto_url} alt={obra.nome} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">{obra.nome}</h1>
                        <Badge className={`${statusColorMap[obra.status]} hover:${statusColorMap[obra.status]} text-white border-none`}>
                            {statusLabelMap[obra.status]}
                        </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1 text-primary" />
                        {obra.endereco || "Endereço não informado"}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
                <ObraDialog 
                    initialData={obra} 
                    trigger={
                        <Button variant="outline" className="flex-1 lg:flex-none">
                            <Edit className="w-4 h-4 mr-2" /> Editar
                        </Button>
                    }
                />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-1 lg:flex-none">
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Obra?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Todos os dados (RDOs, financeiro, documentos) serão perdidos.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Confirmar Exclusão</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-none bg-accent/20">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Prazos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="space-y-1">
                        <p className="text-sm"><span className="font-bold">Início:</span> {formatDate(obra.data_inicio)}</p>
                        <p className="text-sm"><span className="font-bold">Previsão de Término:</span> {obra.previsao_entrega ? formatDate(obra.previsao_entrega) : 'N/A'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-accent/20">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Orçamento
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-black text-primary">{formatCurrency(obra.orcamento_inicial)}</p>
                    <p className="text-xs text-muted-foreground">Valor inicial previsto</p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none bg-accent/20 md:col-span-2">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">Responsáveis</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Cliente / Proprietário</p>
                        <p className="text-sm font-medium">{obra.dono_cliente || "Não informado"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold">Responsável Técnico</p>
                        <p className="text-sm font-medium">{obra.responsavel_tecnico || "Não informado"}</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Modules Grid */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Módulos de Gestão</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <Link to={module.href} key={module.href} className="group">
                        <Card className="h-full border hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group-hover:-translate-y-1">
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="p-3 rounded-2xl ${module.bg} ${module.color}">
                                    <module.icon className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{module.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-snug">{module.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ObraDetails;