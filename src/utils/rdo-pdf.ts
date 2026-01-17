import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DiarioObra } from "@/hooks/use-rdo";
import { formatCurrency, formatDate } from "./formatters";
import { Profile } from "@/hooks/use-profile";

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

const DEFAULT_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";
const ICON_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Icone.png";

export const generateRdoPdf = async (rdo: DiarioObra, obraNome: string, profile: Profile | null) => {
  const doc = new jsPDF();
  const margin = 15;
  let y = 25;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const isPro = profile?.subscription_status === 'active';
  const userLogo = profile?.avatar_url;

  // 1. Carregar Logos
  const loadImg = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 2000);
    });
  };

  const mainLogo = await loadImg(userLogo && isPro ? userLogo : DEFAULT_LOGO);
  const brandIcon = await loadImg(ICON_URL);

  // --- CABEÇALHO ---
  if (mainLogo) {
    const ratio = mainLogo.width / mainLogo.height;
    const logoHeight = 15;
    const logoWidth = logoHeight * ratio;
    doc.addImage(mainLogo, 'PNG', margin, y - 10, Math.min(logoWidth, 60), logoHeight);
  }

  doc.setFontSize(18);
  doc.setTextColor(130, 193, 57); // Verde Cítrico #82C139
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DIÁRIO DE OBRA", pageWidth - margin, y - 5, { align: 'right' });

  y += 10;
  doc.setDrawColor(130, 193, 57);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  
  // --- INFO GERAL ---
  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.setFont("helvetica", "bold");
  doc.text(`OBRA:`, margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(obraNome.toUpperCase(), margin + 15, y);

  doc.setFont("helvetica", "bold");
  doc.text(`DATA:`, 140, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(rdo.data_rdo), 155, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`CLIMA:`, margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(rdo.clima_condicoes || 'N/A', margin + 15, y);

  doc.setFont("helvetica", "bold");
  doc.text(`STATUS:`, 140, y);
  doc.setFont("helvetica", "normal");
  doc.text(rdo.status_dia, 158, y);

  // --- TABELAS ---
  y += 15;
  
  // Mão de Obra
  doc.autoTable({
    startY: y,
    head: [['EFETIVO / FUNÇÃO', 'TIPO', 'QTD', 'CUSTO UNIT. (EST)', 'TOTAL']],
    body: rdo.rdo_mao_de_obra?.map(m => [
      m.funcao,
      m.tipo,
      m.quantidade,
      formatCurrency(m.custo_unitario),
      formatCurrency(m.quantidade * (m.custo_unitario || 0))
    ]) || [],
    theme: 'grid',
    headStyles: { fillColor: [130, 193, 57], textColor: 255 },
    styles: { fontSize: 8 }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Materiais
  if (rdo.rdo_materiais && rdo.rdo_materiais.length > 0) {
    doc.autoTable({
      startY: y,
      head: [['CONTROLE DE MATERIAIS', 'UN', 'ENTRADA', 'CONSUMO', 'OBSERVAÇÃO']],
      body: rdo.rdo_materiais.map(m => [m.nome_material, m.unidade, m.quantidade_entrada, m.quantidade_consumida, m.observacao || '']),
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60] },
      styles: { fontSize: 8 }
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Atividades
  doc.autoTable({
    startY: y,
    head: [['DESCRIÇÃO DOS SERVIÇOS REALIZADOS', 'AVANÇO (%)']],
    body: rdo.rdo_atividades_detalhe?.map(a => [a.descricao_servico, `${a.avanco_percentual}%`]) || [],
    theme: 'grid',
    headStyles: { fillColor: [60, 60, 60] },
    styles: { fontSize: 8 }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // --- OBSERVAÇÕES ---
  if (rdo.observacoes_gerais || rdo.impedimentos_comentarios) {
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text("OCORRÊNCIAS / OBSERVAÇÕES:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const obs = `Impedimentos: ${rdo.impedimentos_comentarios || 'Nenhum'}\nObservações: ${rdo.observacoes_gerais || 'Nenhuma'}`;
    doc.text(doc.splitTextToSize(obs, pageWidth - (margin * 2)), margin, y);
  }

  // --- ASSINATURAS ---
  const footerY = pageHeight - 40;
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  
  doc.line(margin, footerY, margin + 70, footerY);
  doc.text("Assinatura do Responsável", margin + 35, footerY + 5, { align: 'center' });
  if (rdo.responsible_signature_url) {
    try { doc.addImage(rdo.responsible_signature_url, 'PNG', margin + 10, footerY - 22, 50, 20); } catch(e){}
  }

  doc.line(pageWidth - margin - 70, footerY, pageWidth - margin, footerY);
  doc.text("Assinatura do Cliente / Fiscal", pageWidth - margin - 35, footerY + 5, { align: 'center' });
  if (rdo.client_signature_url) {
    try { doc.addImage(rdo.client_signature_url, 'PNG', pageWidth - margin - 60, footerY - 22, 50, 20); } catch(e){}
  }

  // --- MARCA D'ÁGUA PARA FREE ---
  if (!isPro) {
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    if (brandIcon) {
        doc.addImage(brandIcon, 'PNG', (pageWidth / 2) - 25, (pageHeight / 2) - 25, 50, 50);
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text("Documento gerado pela plataforma MEU RDO (Versão Gratuita)", pageWidth / 2, pageHeight - 10, { align: 'center' });
  } else {
    // Branding sutil para PRO
    doc.setFontSize(7);
    doc.setTextColor(200);
    doc.text("Processado por meurdo.com.br", pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  doc.save(`RDO_${formatDate(rdo.data_rdo).replace(/\//g, '-')}_${obraNome.replace(/\s/g, '_')}.pdf`);
};