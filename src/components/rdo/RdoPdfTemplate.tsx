import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { format, parseISO, isValid } from "date-fns";

const DEFAULT_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 9, color: '#1e293b' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#066abc', paddingBottom: 10 },
  headerLeft: { width: '30%' },
  headerCenter: { width: '40%', textAlign: 'center' },
  headerRight: { width: '30%', textAlign: 'right' },
  logo: { width: 90, height: 40, objectFit: 'contain' },
  projectName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#066abc', marginBottom: 2, textTransform: 'uppercase' },
  address: { fontSize: 7, color: '#64748b' },
  rdoNumber: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  rdoDate: { fontSize: 9, color: '#64748b' },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b', textTransform: 'uppercase', backgroundColor: '#f3f4f6', padding: 4, marginBottom: 8, borderRadius: 2 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  kpiCard: { flex: 1, backgroundColor: '#f9fafb', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  kpiLabel: { fontSize: 6, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  kpiValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#066abc' },
  table: { width: '100%', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 5 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', padding: 5, minHeight: 18 },
  colDesc: { flex: 4, fontSize: 8 },
  colQty: { flex: 1, fontSize: 8, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  itemNote: { fontSize: 7, color: '#64748b', fontStyle: 'italic', marginTop: 2, marginLeft: 10 },
  alertBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fef3c7', borderRadius: 6, padding: 8 },
  alertText: { fontSize: 8, color: '#92400e', lineHeight: 1.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoCard: { width: '32%', marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  image: { width: '100%', height: 100, objectFit: 'cover' },
  caption: { fontSize: 7, padding: 3, color: '#64748b', textAlign: 'center', height: 22 },
  signatureRow: { flexDirection: 'row', marginTop: 20, gap: 40 },
  sigBox: { flex: 1, alignItems: 'center' },
  sigImg: { height: 40, width: 100, objectFit: 'contain', marginBottom: 4 },
  sigLine: { width: '100%', borderTopWidth: 1, borderTopColor: '#cbd5e1', marginBottom: 2 },
  sigLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' }
});

interface Props {
  rdo: DiarioObra;
  obraNome: string;
  profile: Profile | null;
  obra?: Obra;
  sequenceNumber: string;
  logoBase64: string | null;
  photosBase64: { desc: string; base64: string | null }[];
  responsibleSigBase64: string | null;
  clientSigBase64: string | null;
}

export const RdoPdfTemplate = ({ rdo, obraNome, profile, obra, sequenceNumber, logoBase64, photosBase64, responsibleSigBase64, clientSigBase64 }: Props) => {
  let dateStr = "N/A";
  if (rdo.data_rdo) {
      const parsed = typeof rdo.data_rdo === 'string' ? parseISO(rdo.data_rdo) : rdo.data_rdo;
      if (isValid(parsed)) dateStr = format(parsed, "dd/MM/yyyy");
  }

  const totalEquipe = rdo.rdo_mao_de_obra?.reduce((sum, m) => sum + (Number(m.quantidade) || 0), 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoBase64 ? <Image src={logoBase64} style={styles.logo} /> : <Text style={{ fontSize: 10, color: '#ccc' }}>LOGO</Text>}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.projectName}>{obraNome}</Text>
            <Text style={styles.address}>{obra?.endereco || "Local não informado"}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.rdoNumber}>RDO nº {sequenceNumber}</Text>
            <Text style={styles.rdoDate}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Período</Text><Text style={styles.kpiValue}>{rdo.periodo}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Clima</Text><Text style={styles.kpiValue}>{rdo.clima_condicoes || 'Sol'}</Text></View>
          <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Efetivo</Text><Text style={styles.kpiValue}>{totalEquipe} Func.</Text></View>
        </View>

        {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Ocorrências e Notas</Text>
            <View style={styles.alertBox}>
              {rdo.impedimentos_comentarios && <Text style={[styles.alertText, { fontFamily: 'Helvetica-Bold' }]}>IMPEDIMENTOS: {rdo.impedimentos_comentarios}</Text>}
              {rdo.observacoes_gerais && <Text style={styles.alertText}>OBSERVAÇÕES: {rdo.observacoes_gerais}</Text>}
            </View>
          </View>
        )}

        {rdo.rdo_atividades_detalhe && rdo.rdo_atividades_detalhe.length > 0 && (
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>Serviços Executados</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colDesc}>Descrição do Serviço</Text>
                    <Text style={styles.colQty}>Avanço</Text>
                </View>
                {rdo.rdo_atividades_detalhe.map((atv, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colDesc}>{atv.descricao_servico}</Text>
                        <Text style={styles.colQty}>{atv.avanco_percentual}%</Text>
                    </View>
                ))}
            </View>
            </View>
        )}

        {rdo.rdo_mao_de_obra && rdo.rdo_mao_de_obra.length > 0 && (
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mão de Obra</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={{ flex: 3 }}>Função</Text>
                    <Text style={{ flex: 1, textAlign: 'center' }}>Qtd.</Text>
                    <Text style={{ flex: 1, textAlign: 'right' }}>Vínculo</Text>
                </View>
                {rdo.rdo_mao_de_obra.map((m, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={{ flex: 3 }}>{m.funcao}</Text>
                        <Text style={{ flex: 1, textAlign: 'center' }}>{m.quantidade}</Text>
                        <Text style={{ flex: 1, textAlign: 'right' }}>{m.tipo}</Text>
                    </View>
                ))}
            </View>
            </View>
        )}

        {photosBase64.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidências Fotográficas</Text>
            <View style={styles.grid}>
              {photosBase64.map((photo, idx) => (
                <View key={idx} style={styles.photoCard} wrap={false}>
                  <Image src={photo.base64!} style={styles.image} />
                  <Text style={styles.caption}>{photo.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.sigBox}>
            {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.sigImg} />}
            <View style={styles.sigLine} /><Text style={styles.sigLabel}>Responsável Técnico</Text>
          </View>
          <View style={styles.sigBox}>
            {clientSigBase64 && <Image src={clientSigBase64} style={styles.sigImg} />}
            <View style={styles.sigLine} /><Text style={styles.sigLabel}>Fiscalização / Cliente</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};