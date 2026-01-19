import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 0, fontFamily: 'Helvetica' },
  watermark: { position: 'absolute', top: '45%', left: '10%', fontSize: 60, color: 'rgba(200, 200, 200, 0.2)', transform: 'rotate(-45deg)', fontWeight: 'bold', textTransform: 'uppercase' },
  heroContainer: { height: 220, position: 'relative', backgroundColor: '#0f172a', justifyContent: 'flex-end', padding: 30 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4, objectFit: 'cover' },
  heroContent: { position: 'relative', zIndex: 10 },
  heroTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase' },
  heroSubtitle: { color: '#e2e8f0', fontSize: 9, marginTop: 5 },
  dashRow: { flexDirection: 'row', padding: '20 30', gap: 15 },
  safetyCard: { width: '30%', backgroundColor: '#ffffff', borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  safetyHeader: { backgroundColor: '#059669', padding: 6, alignItems: 'center' },
  safetyTitle: { color: '#ffffff', fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },
  safetyBody: { padding: 15, alignItems: 'center' },
  sectionLabel: { fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', paddingLeft: 30, marginBottom: 10 },
  activityCard: { flexDirection: 'row', backgroundColor: '#ffffff', marginHorizontal: 30, marginBottom: 10, borderRadius: 12, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  activityInfo: { flex: 1, padding: 12 },
  activityName: { fontSize: 9, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  footerContainer: { marginTop: 'auto', padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerLogo: { height: 15, objectFit: 'contain', marginBottom: 5 },
  footerTextFree: { fontSize: 8, color: '#066abc', textAlign: 'center', fontWeight: 'bold' },
  footerTextPro: { fontSize: 6, color: '#94a3b8', textAlign: 'center', opacity: 0.8 },
  sigRow: { flexDirection: 'row', gap: 40, marginTop: 10 },
  sigBox: { flex: 1, alignItems: 'center' },
  sigLine: { width: '100%', borderTopWidth: 1, borderTopColor: '#e2e8f0', marginBottom: 5 },
  sigName: { fontSize: 8, fontWeight: 'bold' }
});

export const RdoPdfTemplate = ({ rdo, obraNome, profile, obra, isPro }: any) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {!isPro && <Text style={styles.watermark}>Versão Gratuita</Text>}
        
        <View style={styles.heroContainer}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{obraNome}</Text>
            <Text style={styles.heroSubtitle}>{format(parseISO(rdo.data_rdo), "dd 'de' MMMM, yyyy", { locale: ptBR })}</Text>
          </View>
        </View>

        <View style={styles.dashRow}>
          <View style={styles.safetyCard}>
            <View style={styles.safetyHeader}><Text style={styles.safetyTitle}>Segurança</Text></View>
            <View style={styles.safetyBody}><Text style={{fontSize: 8, fontWeight: 'bold'}}>Zero Acidentes</Text></View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Atividades do Dia</Text>
        {rdo.rdo_atividades_detalhe?.map((atv: any, i: number) => (
          <View key={i} style={styles.activityCard}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{atv.descricao_servico}</Text>
              <Text style={{fontSize: 7, color: '#64748b'}}>Progresso: {atv.avanco_percentual}%</Text>
            </View>
          </View>
        ))}

        <View style={styles.footerContainer}>
          <View style={styles.sigRow}>
            <View style={styles.sigBox}><View style={styles.sigLine} /><Text style={styles.sigName}>Responsável Técnico</Text></View>
            <View style={styles.sigBox}><View style={styles.sigLine} /><Text style={styles.sigName}>{rdo.signer_name || "Assinatura do Cliente"}</Text></View>
          </View>
          
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            {isPro ? (
              <Text style={styles.footerTextPro}>Documento oficial validado via plataforma Meu RDO. Autenticidade verificável pelo Token ID: {rdo.id}</Text>
            ) : (
              <>
                <Text style={styles.footerTextFree}>Gere diários profissionais grátis em meurdo.com.br</Text>
              </>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};