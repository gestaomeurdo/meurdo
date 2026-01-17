import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DiarioObra } from "@/hooks/use-rdo";
import { formatCurrency, formatDate } from "./formatters";
import { Profile } from "@/hooks/use-profile";

// Extend jsPDF with autoTable type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

const DEFAULT_LOGO_URL = "https://i.ibb.co/7dmMx016/Gemini-Generated-Image-qkvwxnqkvwxnqkvw-upscayl-2x-upscayl-standard-4x.png";

export const generateRdoPdf = async (rdo: DiarioObra, obraNome: string, profile: Profile | null) => {
  const doc = new jsPDF();
  const margin = 15;
  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 30;

  const isPro = profile?.plan_type === 'pro' || profile?.subscription_status === 'active';

  // Helper to check for new page
  const checkPage = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 40) {
      doc.addPage();
      y = 20;
    }
  };

  // --- Header ---
  try {
    const logoImg = new Image();
    // Use profile avatar/logo if PRO and available, otherwise use default
    logoImg.src = (isPro && profile?.avatar_url) ? profile.avatar_url : DEFAULT_LOGO_URL;
    
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve;
      setTimeout(resolve, 1000);
    });
    
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      doc.addImage(logoImg, 'PNG', margin, y - 10, 20, 20);
    }
  } catch (e) { console.error("Logo failed to load"); }

  doc.setFontSize(20);
  doc.setTextColor(255, 122, 0); // Primary Orange
  doc.text("Relatório Diário de Obra", 45, y);

  y += 15;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Obra: ${obraNome}`, margin, y);
  doc.text(`Data: ${formatDate(rdo.data_rdo)}`, 140, y);

  y += 6;
  doc.text(`Clima: ${rdo.clima_condicoes || 'N/A'}`, margin, y);
  doc.text(`Status do Dia: ${rdo.status_dia}`, 140, y);
  
  y += 6;
  doc.text(`Paralisação Climática: ${rdo.work_stopped ? 'Sim' : 'Não'}`, margin, y);
  if (rdo.work_stopped) {
    doc.text(`Horas Perdidas: ${rdo.hours_lost.toFixed(1)}h`, 140, y);
  }

  y += 10;
  doc.setDrawColor(200);
  doc.line(margin, y, 195, y);
  y += 10;

  // --- Tables (Manpower, Materials, Activities) ---
  // (Assuming logic from previous version remains same for data rendering)
  
  // Manpower
  checkPage(50);
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Efetivo (Mão de Obra)", margin, y);
  y += 5;

  const manpowerData = rdo.rdo_mao_de_obra?.map(m => [
    m.funcao,
    m.tipo || 'N/A',
    m.quantidade,
    formatCurrency(m.custo_unitario || 0),
    formatCurrency((m.quantidade || 0) * (m.custo_unitario || 0))
  ]) || [];

  doc.autoTable({
    startY: y,
    head: [['Função', 'Tipo', 'Qtd', 'Custo Unit.', 'Total Est.']],
    body: manpowerData,
    margin: { left: margin },
    theme: 'striped',
    headStyles: { fillColor: [255, 122, 0] }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // Materials
  if (rdo.rdo_materiais && rdo.rdo_materiais.length > 0) {
    checkPage(50);
    doc.text("Controle de Materiais", margin, y);
    y += 5;
    const materialsData = rdo.rdo_materiais.map(m => [m.nome_material, m.unidade, m.quantidade_entrada, m.quantidade_consumida, m.observacao || '']);
    doc.autoTable({
      startY: y,
      head: [['Material', 'Unidade', 'Entrada', 'Consumo', 'Obs']],
      body: materialsData,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] }
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // Activities
  checkPage(50);
  doc.text("Atividades Realizadas", margin, y);
  y += 5;
  const activitiesData = rdo.rdo_atividades_detalhe?.map(a => [a.descricao_servico, `${a.avanco_percentual}%`]) || [];
  doc.autoTable({
    startY: y,
    head: [['Descrição do Serviço', 'Avanço (%)']],
    body: activitiesData,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50] }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // --- Observations ---
  if (rdo.observacoes_gerais || rdo.impedimentos_comentarios) {
    checkPage(40);
    doc.setFontSize(14);
    doc.text("Ocorrências e Observações", margin, y);
    y += 7;
    doc.setFontSize(10);
    const obsText = `Impedimentos: ${rdo.impedimentos_comentarios || 'Nenhum'}\n\nObservações: ${rdo.observacoes_gerais || 'Nenhuma'}`;
    const splitObs = doc.splitTextToSize(obsText, 180);
    doc.text(splitObs, margin, y);
    y += (splitObs.length * 5) + 15;
  }

  // --- Watermark for FREE users ---
  if (!isPro) {
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); // Faded Red
    const watermarkText = "Relatório gerado em versão de testes. Para remover esta mensagem, assine o plano PRO.";
    const textWidth = doc.getTextWidth(watermarkText);
    doc.text(watermarkText, (pageWidth - textWidth) / 2, pageHeight - 10);
  }

  // --- Signatures ---
  if (y > footerY - 40) doc.addPage();
  
  doc.setTextColor(100);
  doc.setFontSize(10);
  doc.text("___________________________________", margin, footerY);
  doc.text("Assinatura do Responsável", margin, footerY + 5);
  
  if (rdo.responsible_signature_url) {
    try {
        doc.addImage(rdo.responsible_signature_url, 'PNG', margin + 5, footerY - 25, 50, 20);
    } catch(e) {}
  }

  doc.text("___________________________________", pageWidth / 2 + 10, footerY);
  doc.text("Assinatura do Cliente/Fiscal", pageWidth / 2 + 10, footerY + 5);

  if (rdo.client_signature_url) {
    try {
        doc.addImage(rdo.client_signature_url, 'PNG', pageWidth / 2 + 15, footerY - 25, 50, 20);
    } catch(e) {}
  }

  doc.save(`RDO_${formatDate(rdo.data_rdo).replace(/\//g, '-')}_${obraNome.replace(/\s/g, '_')}.pdf`);
};