import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: { backgroundColor: '#f8fafc', padding: 0, fontFamily: 'Helvetica' },
  
  // 1. HERO HEADER
  heroContainer: { height: 220, position: 'relative', backgroundColor: '#0f172a', justifyContent: 'flex-end', padding: 30 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.4, objectFit: 'cover' },
  heroContent: { position: 'relative', zIndex: 10 },
  badge: { backgroundColor: '#10b981', padding: '4 8', borderRadius: 12, width: 120, marginBottom: 10 },
  badgeText: { color: '#ffffff', fontSize: 7, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
  heroTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: -1 },
  heroSubtitle: { color: '#e2e8f0', fontSize: 9, marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },

  // 2. DASHBOARD ROW (Safety & Weather)
  dashRow: { flexDirection: 'row', padding: '20 30', gap: 15 },
  safetyCard: { width: '30%', backgroundColor: '#ffffff', borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  safetyHeader: { backgroundColor: '#059669', padding: 6, alignItems: 'center' },
  safetyTitle: { color: '#ffffff', fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },
  safetyBody: { padding: 15, alignItems: 'center', justifyContent: 'center' },
  safetyText: { fontSize: 8, fontWeight: 'bold', color: '#064e3b', marginTop: 5, textTransform: 'uppercase' },
  
  weatherCard: { width: '70%', backgroundColor: '#ffffff', borderRadius: 16, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', padding: 15 },
  weatherGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weatherItem: { alignItems: 'center', flex: 1 },
  weatherLabel: { fontSize: 6, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  weatherVal: { fontSize: 9, fontWeight: 'bold', color: '#1e293b' },

  // 3. ACTIVITIES (CARDS)
  sectionLabel: { fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 30, marginBottom: 10 },
  activityCard: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    marginHorizontal: 30, 
    marginBottom: 12, 
    borderRadius: 16, 
    borderStyle: 'solid', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    minHeight: 80,
    overflow: 'hidden'
  },
  activityInfo: { flex: 1, padding: 15, justifyContent: 'center' },
  activityName: { fontSize: 10, fontWeight: 'bold', color: '#1e293b', marginBottom: 8, textTransform: 'uppercase' },
  progressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressPct: { fontSize: 8, fontWeight: 'bold', color: '#0ea5e9' },
  progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0ea5e9', borderRadius: 3 },
  activityPhoto: { width: 120, height: '100%', objectFit: 'cover' },

  // 4. RESOURCES GRID
  resourcesRow: { flexDirection: 'row', paddingHorizontal: 30, gap: 15, marginBottom: 30 },
  resBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 16, padding: 15, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  resTitle: { fontSize: 7, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 },
  resItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resName: { fontSize: 8, color: '#334155', textTransform: 'uppercase' },
  resQty: { fontSize: 8, fontWeight: 'bold', color: '#0f172a' },

  // 5. FOOTER & SIGNATURES
  footerContainer: { marginTop: 'auto', padding: 30, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sigRow: { flexDirection: 'row', gap: 40, marginTop: 20 },
  sigBox: { flex: 1, alignItems: 'center' },
  sigLine: { width: '100%', borderTopWidth: 1, borderTopColor: '#e2e8f0', marginBottom: 8 },
  sigImg: { height: 40, objectFit: 'contain', marginBottom: 5 },
  sigName: { fontSize: 9, fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' },
  sigRole: { fontSize: 7, color: '#64748b' }
});

export const RdoPdfTemplate = ({ 
    rdo, obraNome, profile, obra, sequenceNumber, logoBase64, obraPhotoBase64, activityPhotosMap,
    sigResponsibleBase64, sigClientBase64 
}: any) => {
    
    const climaData = rdo.clima_condicoes?.split(', ') || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HERO HEADER */}
                <View style={styles.heroContainer}>
                    {obraPhotoBase64 && <Image src={obraPhotoBase64} style={styles.heroBg} />}
                    <View style={styles.heroContent}>
                        <View style={styles.badge}><Text style={styles.badgeText}>Relatório de Obra</Text></View>
                        <Text style={styles.heroTitle}>{obraNome}</Text>
                        <Text style={styles.heroSubtitle}>
                            {format(parseISO(rdo.data_rdo), "dd 'de' MMMM, yyyy", { locale: ptBR })} | {obra?.endereco || "Local não informado"}
                        </Text>
                    </View>
                </View>

                {/* DASHBOARD ROW */}
                <View style={styles.dashRow}>
                    <View style={styles.safetyCard}>
                        <View style={styles.safetyHeader}><Text style={styles.safetyTitle}>Segurança</Text></View>
                        <View style={styles.safetyBody}>
                            <Text style={styles.safetyText}>Zero Acidentes</Text>
                        </View>
                    </View>
                    
                    <View style={styles.weatherCard}>
                        <Text style={styles.resTitle}>Matriz Climática do Dia</Text>
                        <View style={styles.weatherGrid}>
                            {['MANHÃ', 'TARDE', 'NOITE'].map((period, idx) => (
                                <View key={idx} style={styles.weatherItem}>
                                    <Text style={styles.weatherLabel}>{period}</Text>
                                    <Text style={styles.weatherVal}>{climaData[idx]?.includes('N/T') ? 'N/T' : climaData[idx]?.split(': ')[1]?.split(' (')[0] || 'SOL'}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ACTIVITIES LIST */}
                <Text style={styles.sectionLabel}>Serviços Executados</Text>
                {rdo.rdo_atividades_detalhe?.map((atv: any, i: number) => (
                    <View key={i} style={styles.activityCard} wrap={false}>
                        <View style={styles.activityInfo}>
                            <Text style={styles.activityName}>{atv.descricao_servico}</Text>
                            <View style={styles.progressLabel}>
                                <Text style={{ fontSize: 7, color: '#94a3b8' }}>Avanço Realizado</Text>
                                <Text style={styles.progressPct}>{atv.avanco_percentual}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${atv.avanco_percentual}%` }]} />
                            </View>
                        </View>
                        {activityPhotosMap[atv.id] && (
                            <Image src={activityPhotosMap[atv.id]} style={styles.activityPhoto} />
                        )}
                    </View>
                ))}

                {/* RESOURCES */}
                <View style={styles.resourcesRow}>
                    <View style={styles.resBox}>
                        <Text style={styles.resTitle}>Efetivo em Campo</Text>
                        {rdo.rdo_mao_de_obra?.map((m: any, i: number) => (
                            <View key={i} style={styles.resItem}>
                                <Text style={styles.resName}>{m.funcao}</Text>
                                <Text style={styles.resQty}>{m.quantidade}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={styles.resBox}>
                        <Text style={styles.resTitle}>Maquinário</Text>
                        {rdo.rdo_equipamentos?.length > 0 ? rdo.rdo_equipamentos.map((e: any, i: number) => (
                            <View key={i} style={styles.resItem}>
                                <Text style={styles.resName}>{e.equipamento}</Text>
                                <Text style={styles.resQty}>{e.horas_trabalhadas}h</Text>
                            </View>
                        )) : <Text style={{ fontSize: 7, color: '#94a3b8' }}>Nenhum registro</Text>}
                    </View>
                </View>

                {/* SIGNATURES */}
                <View style={styles.footerContainer}>
                    <View style={styles.sigRow}>
                        <View style={styles.sigBox}>
                            {sigResponsibleBase64 && <Image src={sigResponsibleBase64} style={styles.sigImg} />}
                            <View style={styles.sigLine} />
                            <Text style={styles.sigName}>{profile?.first_name} {profile?.last_name}</Text>
                            <Text style={styles.sigRole}>Responsável Técnico</Text>
                        </View>
                        <View style={styles.sigBox}>
                            {sigClientBase64 && <Image src={sigClientBase64} style={styles.sigImg} />}
                            <View style={styles.sigLine} />
                            <Text style={styles.sigName}>{rdo.signer_name || "Aguardando Aprovação"}</Text>
                            <Text style={styles.sigRole}>Contratante / Fiscalização</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};