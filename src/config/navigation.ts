import { LayoutDashboard, Construction, DollarSign, Package, Users, FileText, ClipboardList, BarChart3, Star, Truck, ShieldCheck, MessageCircle } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Obras",
    href: "/obras",
    icon: Construction,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Gestão de Obra",
    href: "/gestao-rdo",
    icon: FileText,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Cadastro de Atividades",
    href: "/atividades",
    icon: ClipboardList,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Materiais",
    href: "/materiais",
    icon: Package,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Efetivo & Custos",
    href: "/mao-de-obra",
    icon: Users,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Documentação",
    href: "/documentacao",
    icon: FileText,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Suporte",
    href: "/suporte",
    icon: MessageCircle,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Backoffice Admin",
    href: "/admin",
    icon: ShieldCheck,
    roles: ["administrator"],
  },
  {
    title: "Assinatura",
    href: "/settings",
    icon: Star,
    roles: ["administrator", "obra_user", "view_only"],
  },
];