import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DiarioObra } from "@/hooks/use-rdo";
import { formatCurrency, formatDate } from "./formatters";

// Extend jsPDF with autoTable type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

const LOGO_URL = "https://i.ibb.co/7dmMx016/Gemini-Generated-Image-qkvwxnqkvwxnqkvw-upscayl-2x-upscayl-standard-4x.png";

export const generateRdoPdf = async (rdo: DiarioObra, obraNome: string) => {
  const doc = new jsPDF();
  const margin = 15;
  let y = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 30;

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
    logoImg.src = LOGO_URL;
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

  // --- Manpower Table ---
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
    headStyles: { fillStyle: [255, 122, 0] }
  });

  y = (doc as any).lastAutoTable.finalY + 15;
  
  // --- Materials Table ---
  if (rdo.rdo_materiais && rdo.rdo_materiais.length > 0) {
    checkPage(50);
    doc.text("Controle de Materiais", margin, y);
    y += 5;

    const materialsData = rdo.rdo_materiais?.map(m => [
      m.nome_material,
      m.unidade,
      m.quantidade_entrada || 0,
      m.quantidade_consumida || 0,
      m.observacao || ''
    ]) || [];

    doc.autoTable({
      startY: y,
      head: [['Material', 'Unidade', 'Qtd. Entrada', 'Qtd. Consumida', 'Observação']],
      body: materialsData,
      margin: { left: margin },
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50] }
    });

    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- Activities Table ---
  checkPage(50);
  doc.text("Atividades Realizadas", margin, y);
  y += 5;

  const activitiesData = rdo.rdo_atividades_detalhe?.map(a => [
    a.descricao_servico,
    `${a.avanco_percentual}%`
  ]) || [];

  doc.autoTable({
    startY: y,
    head: [['Descrição do Serviço', 'Avanço (%)']],
    body: activitiesData,
    margin: { left: margin },
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50] }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // --- Observations ---
  if (rdo.observacoes_gerais || rdo.impedimentos_comentarios) {
    checkPage(40);
    doc.text("Ocorrências e Observações", margin, y);
    y += 7;
    doc.setFontSize(10);
    const obs = [
      `Impedimentos: ${rdo.impedimentos_comentarios || 'Nenhum'}`,
      `Observações Gerais: ${rdo.observacoes_gerais || 'Nenhuma'}`
    ].join('\n\n');
    const splitObs = doc.splitTextToSize(obs, 180);
    doc.text(splitObs, margin, y);
    y += (splitObs.length * 5) + 15;
  }

  // --- Signatures (Fixed Footer Position) ---
  const drawSignatures = async () => {
    doc.setDrawColor(0);
    doc.setFontSize(10);
    
    // Responsible Signature
    doc.text("___________________________________", margin, footerY);
    doc.text("Assinatura do Responsável", margin, footerY + 5);
    
    if (rdo.responsible_signature_url) {
      try {
        const img = await fetch(rdo.responsible_signature_url).then(res => res.blob());
        const reader = new FileReader();
        reader.readAsDataURL(img);
        await new Promise(resolve => reader.onloadend = resolve);
        const base64Img = reader.result as string;
        doc.addImage(base64Img, 'PNG', margin + 5, footerY - 25, 50, 20);
      } catch (e) {
        doc.text("[Erro ao carregar assinatura]", margin + 5, footerY - 10);
      }
    }

    // Client Signature
    const clientX = pageWidth / 2 + 10;
    doc.text("___________________________________", clientX, footerY);
    doc.text("Assinatura do Cliente/Fiscal", clientX, footerY + 5);
    
    if (rdo.client_signature_url) {
      try {
        const img = await fetch(rdo.client_signature_url).then(res => res.blob());
        const reader = new FileReader();
        reader.readAsDataURL(img);
        await new Promise(resolve => reader.onloadend = resolve);
        const base64Img = reader.result as string;
        doc.addImage(base64Img, 'PNG', clientX + 5, footerY - 25, 50, 20);
      } catch (e) {
        doc.text("[Erro ao carregar assinatura]", clientX + 5, footerY - 10);
      }
    }
  };
  
  // --- Photo Gallery ---
  const photos = rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url) || [];
  if (photos.length > 0) {
    checkPage(40);
    doc.setFontSize(14);
    doc.text("Galeria de Fotos", margin, y);
    y += 10;

    const imgWidth = 85;
    const imgHeight = 60;
    let currentX = margin;

    for (let i = 0; i < photos.length; i++) {
      if (y > pageHeight - 80) { doc.addPage(); y = 20; currentX = margin; }

      try {
        const photoUrl = photos[i].foto_anexo_url!;
        // Simple way to add images in PDF
        doc.addImage(photoUrl, 'JPEG', currentX, y, imgWidth, imgHeight);

        if (i % 2 === 0) {
          currentX = margin + imgWidth + 5;
        } else {
          currentX = margin;
          y += imgHeight + 10;
        }
      } catch (e) {
        doc.text("[Erro ao carregar imagem]", currentX, y + 10);
        if (i % 2 === 0) currentX = margin + imgWidth + 5;
        else { currentX = margin; y += imgHeight + 10; }
      }
    }
  }
  
  // Ensure signatures are on the last page or a new page if needed
  if (y > footerY - 40) {
      doc.addPage();
  }
  await drawSignatures();

  doc.save(`RDO_${formatDate(rdo.data_rdo).replace(/\//g, '-')}_${obraNome.replace(/\s/g, '_')}.pdf`);
};