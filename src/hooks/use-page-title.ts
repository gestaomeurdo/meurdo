import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_TITLE = "Meu RDO | Gestão Inteligente de Obras";

const routeTitles: Record<string, string> = {
  "/": "Início",
  "/login": "Login",
  "/dashboard": "Dashboard",
  "/obras": "Minhas Obras",
  "/financeiro": "Financeiro",
  "/relatorios": "Relatórios",
  "/atividades": "Cronograma",
  "/gestao-rdo": "Diário de Obras",
  "/materiais": "Materiais",
  "/mao-de-obra": "Efetivo",
  "/maquinas": "Equipamentos",
  "/documentacao": "Documentos",
  "/settings": "Configurações",
  "/profile": "Meu Perfil",
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    // Tenta encontrar um título exato ou usa a base
    let pageTitle = routeTitles[path];

    // Lógica para rotas dinâmicas (ex: /obras/123)
    if (!pageTitle) {
      if (path.startsWith("/obras/")) pageTitle = "Detalhes da Obra";
    }

    document.title = pageTitle ? `${pageTitle} | Meu RDO` : BASE_TITLE;
  }, [location]);
};