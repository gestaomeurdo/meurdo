import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";

const LOGO_MEU_RDO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACVv6umAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYySURBVHgB7Z27bhNREIaf9S6WIEghIUFBIREpEiV8AD4EBR8AH4APQUVFCiokKiooUFAhQYIUCV0iRSBIEBAsvD67OfZ4xmdv7869tndm978ay57Z2fE5Z/ZcZuIkiYKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCQv6E03A6DufhvAsX4HIYzsD1MJyD62FIsE2YfTfMv0uXfAun4BqcgePDfA6uhWET7F9C6Mh4Hk7DbeD5NpwfhtNwHdgG/7mHj8H7LlwD8C5cg6fA9zicH4bzI/0yAofmXTiE88NwCO9n4SzwzN934G8+Gq4X8uAwnAKeBf6X34eE6v0onAd75OOf5XfH8729v/zXG+H0u7AHz0C79mO6n/fPInA9LidBvX4E798G9uI/6uO9eIeFfM7fM3D82H/s8B9/p9fD0Fm78h/v4eM5YPuB93+f78E7/P3HevFv629C/YFm7A/+P569/B92+U8In7H9/jve+2e635j2G47P8P6f8f5v4PwL3B52eRfaP88m2L8O3oU2P8PeZfAtpNuBdnY9z97p8R/CunS70C7O/7BveNizn7Bv6vY3wfpwH4Yl3Ae26Vp6/O/v9DzsH7fBfmB7+FfX/fX6m+D5z/C4H9j8vTfC1vV9eO496Xag3UvX9XU39X3G7L9o98vXp/vR76L16X6P8Xqff6frv/D9X+vXv+l+9Psv76D/oPvU76P10X3u72Xf/w/r1//U9xmz/x7v93r3z/X5u/T89U+6D+89Nqf7fT+uX3/G/f1v/N/7f7z7O+L19vefb/vHdfCfr6/v86e96/z7vL9L9+Fz8K6n9X3S++79v3f/8H6vX9+eN77vT79f9X1H77uX7396Xv3e6fU39PnTXnr9vXf9vUfvk/57/Xf9r+8vve72Pv930vvzX6/87nX/0ue8P88G3ofnO39DfX5X1+1v6L96f86HfcE7POxZ2Iez8A7tD98O0n+F/+JpOD8O79L1f4m9/Of8PUP3S++F97uXnre/u9M/+r3Wv/qf9pM9DmfhcRhOwdVfGJWv4Rhcl8MzYm9fC1Mfxv7L8A+fC1Mfmv6W9uOf0Oa6PzD9T99v6XOf7/890+8Yuj/eY3v9Y/v98f7qfUfXv+nr0vv73y8v//X6vP4X/6Zun/vT6/K7fH36v79/vI/Xp/vR76L96D9pP+S6Mvsv6Bf9r/S6/B/fX/73/pP2999/L93H95f+P68/+H3pX74e+X8Xf0H3i37H73+9Lv/H9xf9r98v+t/uP/ofvy99X/8XFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP67AQC777f/YwG0VwAAAABJRU5ErkJggg==";

const styles = StyleSheet.create({
  page: { backgroundColor: '#f8fafc', paddingBottom: 40 },
  
  // Immersive Header (Hero)
  hero: { height: 200, position: 'relative', overflow: 'hidden' },
  heroImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: 200, objectFit: 'cover' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: 200, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  heroContent: { position: 'absolute', bottom: 20, left: 30, right: 30, color: 'white' },
  badge: { backgroundColor: '#10b981', color: 'white', padding: '2 8', borderRadius: 10, fontSize: 6, marginBottom: 8, textTransform: 'uppercase', width: 80, textAlign: 'center' },
  projectName: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  projectInfo: { fontSize: 8, opacity: 0.8, textTransform: 'uppercase', marginBottom: 2 },

  // Content Containers
  container: { padding: '20 30' },
  sectionTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', marginBottom: 10, letterSpacing: 1 },
  
  // Stats Row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 8, borderStyle: 'solid', borderWidth: 1, borderColor: '#f1f5f9' },
  statLabel: { fontSize: 6, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  statVal: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },

  // Cards
  card: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, borderStyle: 'solid', borderWidth: 1, borderColor: '#f1f5f9' },
  activityRow: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  activityText: { flex: 1, fontSize: 10, color: '#334155' },
  progressBarBg: { width: 100, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginLeft: 15 },
  progressBarFill: { height: 6, backgroundColor: '#066abc', borderRadius: 3 },
  progressPct: { fontSize: 8, fontWeight: 'bold', color: '#066abc', width: 30, textAlign: 'right' },

  // Observations
  obsBox: { backgroundColor: '#f0f7ff', borderLeftWidth: 4, borderLeftColor: '#066abc', padding: 15, borderRadius: 4, marginTop: 10 },
  obsLabel: { fontSize: 7, fontWeight: 'bold', color: '#066abc', textTransform: 'uppercase', marginBottom: 5 },
  obsText: { fontSize: 9, color: '#334155', lineHeight: 1.4 },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  photoItem: { width: '48.5%', backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', borderStyle: 'solid', borderWidth: 1, borderColor: '#f1f5f9' },
  photoImg: { width: '100%', height: 160, objectFit: 'cover' },
  photoCap: { fontSize: 6, padding: '5 10', color: '#64748b', textTransform: 'uppercase' },

  // Final Approval Footer
  approvalSection: { marginTop: 30, flexDirection: 'row', gap: 20 },
  sigCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  sigLogo: { height: 30, objectFit: 'contain', marginBottom: 10 },
  sigImg: { height: 50, objectFit: 'contain', marginVertical: 10 },
  sigName: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  sigRole: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginTop: 2 },
  sigMeta: { fontSize: 5, color: '#94a3b8', marginTop: 10, textAlign: 'center' },

  footer: { position: 'absolute', bottom: 15, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, textAlign: 'center' },
  footerBrand: { fontSize: 8, color: '#066abc', fontWeight: 'bold' }
});

export const RdoPdfTemplate = ({ 
    rdo, obraNome, profile, obra, sequenceNumber, dayOfWeek,
    logoBase64, photosBase64, responsibleSigBase64, clientSigBase64,
    contractStats
}: any) => {
    
    const approvedAt = rdo.approved_at ? format(parseISO(rdo.approved_at), "dd/MM/yyyy 'às' HH:mm") : "";
    const obraFotoUrl = obra?.foto_url;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 1. HERO HEADER */}
                <View style={styles.hero}>
                    {obraFotoUrl ? <Image src={obraFotoUrl} style={styles.heroImage} /> : <View style={[styles.heroImage, { backgroundColor: '#066abc' }]} />}
                    <View style={styles.heroOverlay} />
                    <View style={styles.heroContent}>
                        <Text style={styles.badge}>Relatório Aprovado ✓</Text>
                        <Text style={styles.projectName}>{obraNome}</Text>
                        <Text style={styles.projectInfo}>{obra?.endereco || "Local não informado"}</Text>
                        <Text style={styles.projectInfo}>Contratante: {obra?.dono_cliente || "N/A"}</Text>
                    </View>
                </View>

                <View style={styles.container}>
                    {/* 2. DADOS DO DIA */}
                    <Text style={styles.sectionTitle}>Indicadores do Diário Nº {sequenceNumber}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Data</Text>
                            <Text style={styles.statVal}>{format(parseISO(rdo.data_rdo), "dd/MM/yy")}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Efetivo</Text>
                            <Text style={styles.statVal}>{rdo.rdo_mao_de_obra?.reduce((s: any, m: any) => s + m.quantidade, 0) || 0} Pessoas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Segurança</Text>
                            <Text style={[styles.statVal, { color: '#10b981' }]}>CONFORME</Text>
                        </View>
                    </View>

                    {/* 3. ATIVIDADES */}
                    <Text style={styles.sectionTitle}>Serviços Executados</Text>
                    <View style={styles.card}>
                        {rdo.rdo_atividades_detalhe?.map((atv: any, i: number) => (
                            <View key={i} style={styles.activityRow}>
                                <Text style={styles.activityText}>{atv.descricao_servico}</Text>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${atv.avanco_percentual}%` }]} />
                                </View>
                                <Text style={styles.progressPct}>{atv.avanco_percentual}%</Text>
                            </View>
                        ))}
                    </View>

                    {/* 4. OBSERVAÇÕES */}
                    {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
                        <View style={styles.obsBox}>
                            <Text style={styles.obsLabel}>Relatório Técnico / Ocorrências</Text>
                            <Text style={styles.obsText}>
                                {rdo.impedimentos_comentarios || ""} {rdo.observacoes_gerais || ""}
                            </Text>
                        </View>
                    )}
                </View>

                {/* 5. GALERIA FOTOGRÁFICA (SEGUNDA PÁGINA SE NECESSÁRIO) */}
                {photosBase64 && photosBase64.length > 0 && (
                    <View style={styles.container} break>
                        <Text style={styles.sectionTitle}>Evidências Fotográficas</Text>
                        <View style={styles.photoGrid}>
                            {photosBase64.map((p: any, idx: number) => (
                                <View key={idx} style={styles.photoItem} wrap={false}>
                                    <Image src={p.base64} style={styles.photoImg} />
                                    <Text style={styles.photoCap}>{p.desc.toUpperCase()}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 6. ASSINATURAS DIGITAIS */}
                <View style={[styles.container, { marginTop: 'auto' }]}>
                    <Text style={styles.sectionTitle}>Validação e Assinaturas Digitais</Text>
                    <View style={styles.approvalSection}>
                        {/* Engenheiro */}
                        <View style={styles.sigCard}>
                            <Image src={logoBase64 || LOGO_MEU_RDO_B64} style={styles.sigLogo} />
                            <Text style={{ fontSize: 6, color: '#10b981', fontWeight: 'bold' }}>✓ VALIDADO NA EMISSÃO</Text>
                            {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.sigImg} />}
                            <Text style={styles.sigName}>{profile?.first_name} {profile?.last_name}</Text>
                            <Text style={styles.sigRole}>Responsável Técnico</Text>
                        </View>

                        {/* Cliente */}
                        <View style={styles.sigCard}>
                            <Text style={{ fontSize: 14, color: '#10b981' }}>✓</Text>
                            <Text style={{ fontSize: 6, color: '#10b981', fontWeight: 'bold' }}>APROVADO PELO CLIENTE</Text>
                            {clientSigBase64 && <Image src={clientSigBase64} style={styles.sigImg} />}
                            <Text style={styles.sigName}>{rdo.signer_name}</Text>
                            <Text style={styles.sigRole}>{rdo.signer_registration}</Text>
                            <Text style={styles.sigMeta}>Validado digitalmente em {approvedAt}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={{ fontSize: 7, color: '#64748b' }}>Documento oficial gerado e armazenado pela plataforma <Text style={styles.footerBrand}>Meu RDO</Text></Text>
                </View>
            </Page>
        </Document>
    );
};