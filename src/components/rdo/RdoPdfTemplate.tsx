import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const colors = {
  primary: '#066abc',
  secondary: '#ff9f1c',
  background: '#f4f7f9',
  card: '#ffffff',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  success: '#10b981',
  successBg: '#d1fae5',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  warningBg: '#fffbf0',
  tableHeader: '#066abc',
  zebra: '#f9fafb',
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: colors.background,
    fontFamily: 'Helvetica',
    color: colors.text,
    fontSize: 9,
  },
  headerContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  logo: {
    height: 35,
    maxWidth: 100,
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  headerSubTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
    marginTop: 2,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 5,
  },
  complianceText: {
    fontSize: 8,
    color: colors.textLight,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  dashboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: colors.textLight,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    paddingLeft: 6,
  },
  table: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeader,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 8,
    color: colors.text,
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: 6,
  },
  occurrenceBox: {
    backgroundColor: colors.warningBg,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 10,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  photoCard: {
    width: '31%',
    backgroundColor: colors.card,
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 90,
    objectFit: 'cover',
    borderRadius: 3,
  },
  photoCaption: {
    marginTop: 4,
    fontSize: 7,
    color: colors.textLight,
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 15,
  },
  signatureBox: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9ca3af',
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
    position: 'relative',
  },
  signatureImg: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    top: 5,
    objectFit: 'contain',
  },
  signatureLine: {
    width: '80%',
    height: 1,
    backgroundColor: '#9ca3af',
    marginBottom: 2,
  }
});

interface RdoPdfTemplateProps {
  rdo: DiarioObra;
  obraNome: string;
  profile: Profile | null;
  obra?: Obra;
}

const DEFAULT_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

export const RdoPdfTemplate = ({ rdo, obraNome, profile, obra }: RdoPdfTemplateProps) => {
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const logoUrl = (isPro && profile?.avatar_url) ? profile.avatar_url : DEFAULT_LOGO;
  
  // --- Robusta formatação de data ---
  let dateFormatted = 'Data inválida';
  let dayOfWeek = '';
  try {
    const rawDate = rdo.data_rdo;
    let dateObj: Date;

    if (typeof rawDate === 'string') {
      // Tenta parsear como ISO ou YYYY-MM-DD
      dateObj = rawDate.includes('T') ? parseISO(rawDate) : new Date(rawDate + 'T12:00:00');
    } else {
      dateObj = rawDate;
    }

    if (isValid(dateObj)) {
      dateFormatted = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
      dayOfWeek = format(dateObj, "EEEE", { locale: ptBR });
    }
  } catch (e) {
    console.error("Erro ao formatar data no PDF:", e);
  }

  const totalManpower = rdo.rdo_mao_de_obra?.reduce((acc, curr) => acc + curr.quantidade, 0) || 0;
  
  // Fotos de Atividades + Fotos de Segurança
  const activityPhotos = rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => ({
    url: a.foto_anexo_url!,
    caption: a.descricao_servico
  })) || [];

  const safetyPhotos = [
    { url: rdo.safety_nr35_photo, caption: "Segurança: Treinamentos/Altura" },
    { url: rdo.safety_epi_photo, caption: "Segurança: Uso de EPIs" },
    { url: rdo.safety_cleaning_photo, caption: "Segurança: Limpeza" },
    { url: rdo.safety_dds_photo, caption: "Segurança: DDS" },
    { url: rdo.safety_photo_url, caption: "Registro Geral de Segurança" }
  ].filter(p => p.url) as { url: string, caption: string }[];

  const allPhotos = [...activityPhotos, ...safetyPhotos];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={{ width: '30%' }}>
            <Image src={logoUrl} style={styles.logo} />
          </View>
          <View style={{ width: '40%', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>RDO #{rdo.id.slice(0, 5).toUpperCase()}</Text>
            <Text style={styles.headerSubTitle}>DIÁRIO DE OBRA</Text>
          </View>
          <View style={{ width: '30%', alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{dateFormatted}</Text>
            <Text style={{ fontSize: 8, color: colors.textLight, textTransform: 'capitalize' }}>{dayOfWeek}</Text>
          </View>
        </View>

        {/* Compliance */}
        <View style={styles.complianceRow}>
          <Text style={styles.complianceText}>OBRA: <Text style={styles.bold}>{obraNome.toUpperCase()}</Text></Text>
          <Text style={styles.complianceText}>RESPONSÁVEL: <Text style={styles.bold}>{(rdo as any).signer_name || 'N/A'}</Text></Text>
        </View>

        {/* Summary */}
        <View style={styles.dashboardRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Clima e Status</Text>
            <Text style={{ fontSize: 8 }}>{rdo.clima_condicoes || 'Sol'}</Text>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: rdo.status_dia === 'Operacional' ? colors.success : colors.danger, marginTop: 4 }}>
              {rdo.status_dia?.toUpperCase() || 'OPERACIONAL'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Efetivo Total</Text>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{totalManpower}</Text>
            <Text style={{ fontSize: 7, color: colors.textLight }}>COLABORADORES</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Segurança</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: rdo.hours_lost > 0 ? colors.danger : colors.success }}>
              {rdo.hours_lost > 0 ? `ACIDENTE: ${rdo.hours_lost}H PERDIDAS` : 'ZERO ACIDENTES'}
            </Text>
          </View>
        </View>

        {/* Atividades */}
        <View>
          <Text style={styles.sectionTitle}>Serviços Realizados</Text>
          {rdo.rdo_atividades_detalhe?.length ? rdo.rdo_atividades_detalhe.map((item, i) => (
            <View key={i} style={styles.activityRow} wrap={false}>
              <View style={styles.bullet} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 9 }}>{item.descricao_servico}</Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{item.avanco_percentual}%</Text>
                </View>
                {item.observacao && <Text style={{ fontSize: 7, color: colors.textLight, marginTop: 2 }}>{item.observacao}</Text>}
              </View>
            </View>
          )) : <Text style={{ fontSize: 8, color: colors.textLight, fontStyle: 'italic' }}>Nenhuma atividade registrada.</Text>}
        </View>

        {/* Materiais Recebidos */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>Materiais e Insumos</Text>
          {rdo.rdo_materiais?.length ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Material</Text>
                <Text style={styles.tableHeaderCell}>Entrada</Text>
                <Text style={styles.tableHeaderCell}>Consumo</Text>
              </View>
              {rdo.rdo_materiais.map((m, i) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? colors.card : colors.zebra }]}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{m.nome_material}</Text>
                  <Text style={styles.tableCell}>{m.quantidade_entrada || 0} {m.unidade}</Text>
                  <Text style={styles.tableCell}>{m.quantidade_consumida || 0} {m.unidade}</Text>
                </View>
              ))}
            </View>
          ) : <Text style={{ fontSize: 8, color: colors.textLight, fontStyle: 'italic' }}>Nenhum material registrado.</Text>}
        </View>

        {/* Ocorrências */}
        {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Ocorrências e Notas</Text>
            <View style={styles.occurrenceBox}>
              {rdo.impedimentos_comentarios && <Text style={{ fontSize: 8, color: colors.danger, fontFamily: 'Helvetica-Bold' }}>IMPEDIMENTOS: {rdo.impedimentos_comentarios}</Text>}
              {rdo.observacoes_gerais && <Text style={{ fontSize: 8, marginTop: 4 }}>NOTAS: {rdo.observacoes_gerais}</Text>}
            </View>
          </View>
        )}

        {/* Galeria de Fotos */}
        {allPhotos.length > 0 && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.sectionTitle}>Galeria Fotográfica</Text>
            <View style={styles.photoGrid}>
              {allPhotos.map((photo, index) => (
                <View key={index} style={styles.photoCard} wrap={false}>
                  <Image src={photo.url} style={styles.photoImage} />
                  <Text style={styles.photoCaption}>{photo.caption || `Foto ${index + 1}`}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer / Assinaturas */}
        <View style={styles.footerContainer} wrap={false}>
          <View style={styles.signatureBox}>
            {rdo.responsible_signature_url && <Image src={rdo.responsible_signature_url} style={styles.signatureImg} />}
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>RESPONSÁVEL TÉCNICO</Text>
            <Text style={{ fontSize: 6, color: colors.textLight }}>{(rdo as any).signer_name}</Text>
          </View>
          <View style={styles.signatureBox}>
            {rdo.client_signature_url && <Image src={rdo.client_signature_url} style={styles.signatureImg} />}
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>FISCALIZAÇÃO / CLIENTE</Text>
          </View>
        </View>

        <Text style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: 6, color: colors.textLight }}>
          Gerado automaticamente pela plataforma Meu RDO
        </Text>
      </Page>
    </Document>
  );
};