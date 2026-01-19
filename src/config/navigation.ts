import { LayoutDashboard, Construction, DollarSign, Package, Users, FileText, Settings, ClipboardList, BarChart3, Star, Truck, LifeBuoy } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[]; // Roles that can access this link
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
    title: "Atividades",
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
    title: "Mão de Obra",
    href: "/mao-de-obra",
    icon: Users,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Máquinas",
    href: "/maquinas",
    icon: Truck,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Documentação",
    href: "/documentacao",
    icon: FileText,
    roles: ["administrator", "obra_user", "view_only"],
  },
  {
    title: "Planos & Suporte",
    href: "/settings",
    icon: Star,
    roles: ["administrator", "obra_user", "view_only"],
  },
];