import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DiarioObra } from "@/hooks/use-rdo";
import { formatCurrency, formatDate } from "./formatters";
import { Profile } from "@/hooks/use-profile";

const DEFAULT_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";
const ICON_URL = "https://meurdo.com.br/wp-content/uploads/2026/01/Icone.png";

export const generateRdoPdf = async (rdo: DiarioObra, obraNome: string, profile: Profile | null) => {
  const doc = new jsPDF();
  const margin = 15;
  let y = 25;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const userLogo = profile?.avatar_url;

  // 1. Carregar Logos
  const loadImg = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 3000);
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
  doc.setTextColor(6, 106, 188); // Azul Corporativo #066abc
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DIÁRIO DE OBRA", pageWidth - margin, y - 5, {
    align: 'right'
  });
  y += 10;
  doc.setDrawColor(6, 106, 188);
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

  // --- SEGURANÇA (EXCLUSIVO PRO) ---
  if (isPro) {
    y += 15;
    doc.setFontSize(11);
    doc.setTextColor(6, 106, 188);
    doc.setFont("helvetica", "bold");
    doc.text("CONFORMIDADE DE SEGURANÇA", margin, y);
    y += 5;

    const safetyData = [
      ['ITEM DE FISCALIZAÇÃO', 'STATUS'],
      ['NR-35 (Trabalho em Altura)', rdo.safety_nr35 ? 'CONFORME' : 'NÃO APLICÁVEL/PENDENTE'],
      ['Uso de EPIs (Equip. Prot. Individual)', rdo.safety_epi ? 'CONFORME' : 'NÃO APLICÁVEL/PENDENTE'],
      ['Organização e Limpeza do Canteiro', rdo.safety_cleaning ? 'CONFORME' : 'NÃO APLICÁVEL/PENDENTE'],
      ['Treinamento DDS (Diálogo Segurança)', rdo.safety_dds ? 'REALIZADO' : 'NÃO REALIZADO']
    ];

    autoTable(doc, {
      startY: y,
      head: [safetyData[0]],
      body: safetyData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 50
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      columnStyles: {
        1: {
          fontStyle: 'bold',
          halign: 'center'
        }
      },
      didParseCell: (data: any) => {
        if (data.column.index === 1 && data.cell.section === 'body') {
          if (data.cell.text[0].includes('CONFORME') || data.cell.text[0].includes('REALIZADO')) {
            data.cell.styles.textColor = [0, 150, 0];
          } else {
            data.cell.styles.textColor = [150, 0, 0];
          }
        }
      }
    });

    y = (doc as any).lastAutoTable.finalY;
  }

  // --- TABELAS ---
  y += 10;
  // Mão de Obra
  autoTable(doc, {
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
    headStyles: {
      fillColor: [6, 106, 188],
      textColor: 255
    },
    styles: {
      fontSize: 8
    }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Atividades
  autoTable(doc, {
    startY: y,
    head: [['DESCRIÇÃO DOS SERVIÇOS REALIZADOS', 'AVANÇO (%)']],
    body: rdo.rdo_atividades_detalhe?.map(a => [a.descricao_servico, `${a.avanco_percentual}%`]) || [],
    theme: 'grid',
    headStyles: {
      fillColor: [60, 60, 60]
    },
    styles: {
      fontSize: 8
    }
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // --- ASSINATURAS (FIM DO DOCUMENTO) ---
  const footerY = pageHeight - 50;
  if (isPro && rdo.responsible_signature_url) {
    const sigImg = await loadImg(rdo.responsible_signature_url);
    if (sigImg) {
      doc.addImage(sigImg, 'PNG', margin, footerY - 20, 50, 20);
    }
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, margin + 80, footerY);
    doc.setFontSize(8);
    doc.setTextColor(50);
    doc.setFont("helvetica", "bold");
    doc.text((rdo as any).signer_name || "RESPONSÁVEL TÉCNICO", margin, footerY + 5);
    doc.setFont("helvetica", "normal");
    
    // Removed registration line here
    
    doc.setTextColor(6, 106, 188);
    doc.setFont("helvetica", "italic");
    doc.text(`Assinado digitalmente via Meu RDO em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, footerY + 15);
  } else {
    // Fallback assinado manual para Free
    doc.setDrawColor(200);
    doc.line(margin, footerY, margin + 70, footerY);
    doc.setFontSize(8);
    doc.text("Assinatura do Responsável", margin + 35, footerY + 5, {
      align: 'center'
    });
  }

  // --- MARCA D'ÁGUA PARA FREE ---
  if (!isPro) {
    doc.setGState(new (doc as any).GState({
      opacity: 0.1
    }));
    if (brandIcon) {
      doc.addImage(brandIcon, 'PNG', (pageWidth / 2) - 25, (pageHeight / 2) - 25, 50, 50);
    }
    doc.setGState(new (doc as any).GState({
      opacity: 1
    }));
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text("Documento gerado pela plataforma MEU RDO (Versão Gratuita)", pageWidth / 2, pageHeight - 10, {
      align: 'center'
    });
  }

  doc.save(`RDO_${formatDate(rdo.data_rdo).replace(/\//g, '-')}_${obraNome.replace(/\s/g, '_')}.pdf`);
};