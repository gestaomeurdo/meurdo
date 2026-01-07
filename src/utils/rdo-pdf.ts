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
  doc.text(`Status: ${rdo.status_dia}`, 140, y);
  
  y += 10;
  doc.setDrawColor(200);
  doc.line(margin, y, 195, y);
  y += 10;

  // --- Manpower Table ---
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Efetivo (Mão de Obra)", margin, y);
  y += 5;

  const manpowerData = rdo.rdo_mao_de_obra?.map(m => [
    m.funcao,
    m.quantidade,
    formatCurrency(m.custo_unitario || 0),
    formatCurrency((m.quantidade || 0) * (m.custo_unitario || 0))
  ]) || [];

  doc.autoTable({
    startY: y,
    head: [['Função', 'Qtd', 'Custo Unit.', 'Total Est.']],
    body: manpowerData,
    margin: { left: margin },
    theme: 'striped',
    headStyles: { fillStyle: [255, 122, 0] }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // --- Activities Table ---
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
    headStyles: { fillStyle: [50, 50, 50] }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // --- Observations ---
  if (rdo.observacoes_gerais || rdo.impedimentos_comentarios) {
    doc.text("Ocorrências e Observações", margin, y);
    y += 7;
    doc.setFontSize(10);
    const obs = [rdo.impedimentos_comentarios, rdo.observacoes_gerais].filter(Boolean).join('\n\n');
    const splitObs = doc.splitTextToSize(obs, 180);
    doc.text(splitObs, margin, y);
    y += (splitObs.length * 5) + 15;
  }

  // --- Photo Gallery ---
  const photos = rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url) || [];
  if (photos.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.text("Galeria de Fotos", margin, y);
    y += 10;

    const imgWidth = 85;
    const imgHeight = 60;
    let currentX = margin;

    for (let i = 0; i < photos.length; i++) {
      if (y > 220) { doc.addPage(); y = 20; currentX = margin; }
      
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

  doc.save(`RDO_${formatDate(rdo.data_rdo).replace(/\//g, '-')}_${obraNome.replace(/\s/g, '_')}.pdf`);
};