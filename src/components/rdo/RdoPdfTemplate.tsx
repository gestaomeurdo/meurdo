import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";

// Logo padrão blindada (Meu RDO)
const BRAND_LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACVv6umAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYySURBVHgB7Z27bhNREIaf9S6WIEghIUFBIREpEiV8AD4EBR8AH4APQUVFCiokKiooUFAhQYIUCV0iRSBIEBAsvD67OfZ4xmdv7869tndm978ay57Z2fE5Z/ZcZuIkiYKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCQv6E03A6DufhvAsX4HIYzsD1MJyD62FIsE2YfTfMv0uXfAun4BqcgePDfA6uhWET7F9C6Mh4Hk7DbeD5NpwfhtNwHdgG/7mHj8H7LlwD8C5cg6fA9zicH4bzI/0yAofmXTiE88NwCO9n4SzwzN934G8+Gq4X8uAwnAKeBf6X34eE6v0onAd75OOf5XfH8729v/zXG+H0u7AHz0C79mO6n/fPInA9LidBvX4E798G9uI/6uO9eIeFfM7fM3D82H/s8B9/p9fD0Fm78h/v4eM5YPuB93+f78E7/P3HevFv629C/YFm7A/+P569/B92+U8In7H9/jve+2e635j2G47P8P6f8f5v4PwL3B52eRfaP88m2L8O3oU2P8PeZfAtpNuBdnY9z97p8R/CunS70C7O/7BveNizn7Bv6vY3wfpwH4Yl3Ae26Vp6/O/v9DzsH7fBfmB7+FfX/fX6m+D5z/C4H9j8vTfC1vV9eO496Xag3UvX9XU39X3G7L9o98vXp/vR76L16X6P8Xqff6frv/D9X+vXv+l+9Psv76D/oPvU76P10X3u72Xf/w/r1//U9xmz/x7v93r3z/X5u/T89U+6D+89Nqf7fT+uX3/G/f1v/N/7f7z7O+L19vefb/vHdfCfr6/v86e96/z7vL9L9+Fz8K6n9X3S++79v3f/8H6vX9+eN77vT79f9X1H77uX7396Xv3e6fU39PnTXnr9vXf9vUfvk/57/Xf9r+8vve72Pv930vvzX6/87nX/0ue8P88G3ofnO39DfX5X1+1v6L96f86HfcE7POxZ2Iez8A7tD98O0n+F/+JpOD8O79L1f4m9/Of8PUP3S++F97uXnre/u9M/+r3Wv/qf9pM9DmfhcRhOwdVfGJWv4Rhcl8MzYm9fC1Mfxv7L8A+fC1Mfmv6W9uOf0Oa6PzD9T99v6XOf7/890+8Yuj/eY3v9Y/v98f7qfUfXv+nr0vv73y8v//X6vP4X/6Zun/vT6/K7fH36v79/vI/Xp/vR76L96D9pP+S6Mvsv6Bf9r/S6/B/fX/73/pP2999/L93H95f+P68/+H3pX74e+X8Xf0H3i37H73+9Lv/H9xf9r98v+t/uP/ofvy99X/8XFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP67AQC777f/YwG0VwAAAABJRU5ErkJggg==";

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 30, fontFamily: 'Helvetica' },
  
  // Header Tabular (Grid 3 colunas)
  headerGrid: { flexDirection: 'row', borderStyle: 'solid', borderWidth: 1, borderColor: '#000000', marginBottom: 20 },
  headerCol1: { width: '30%', padding: 10, borderRightWidth: 1, borderRightColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  headerCol2: { width: '45%', padding: 10, borderRightWidth: 1, borderRightColor: '#000000' },
  headerCol3: { width: '25%', padding: 10, justifyContent: 'center' },
  
  logo: { height: 35, objectFit: 'contain' },
  headerTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  headerText: { fontSize: 8, color: '#334155', marginBottom: 2 },
  
  // Section Titles
  sectionHeader: { backgroundColor: '#f1f5f9', padding: '4 8', borderStyle: 'solid', borderWidth: 1, borderColor: '#cbd5e1', borderTopWidth: 0, marginBottom: 10 },
  sectionTitle: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' },

  // Matriz Climática
  climaTable: { flexDirection: 'row', marginBottom: 15, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  climaCell: { flex: 1, padding: 8, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  climaLabel: { fontSize: 6, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  climaVal: { fontSize: 9, fontWeight: 'bold', color: '#0f172a' },

  // Service Table
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', minHeight: 25, alignItems: 'center' },
  tableCellHead: { backgroundColor: '#f8fafc', padding: 5, fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },
  tableCell: { padding: 5, fontSize: 8, color: '#334155' },

  // Photos Grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  photoBox: { width: '48%', backgroundColor: '#f8fafc', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', padding: 5, borderRadius: 4 },
  photoImg: { width: '100%', height: 140, objectFit: 'cover', marginBottom: 4 },
  photoText: { fontSize: 6, color: '#64748b', textAlign: 'center', textTransform: 'uppercase' },

  // Signatures
  footerSignatures: { flexDirection: 'row', marginTop: 30, gap: 40 },
  sigBox: { flex: 1, borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 8, alignItems: 'center' },
  sigImg: { height: 50, objectFit: 'contain', marginBottom: 5 },
  sigName: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  sigRole: { fontSize: 7, color: '#64748b', marginTop: 2 },

  pageFooter: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 6, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }
});

export const RdoPdfTemplate = ({ 
    rdo, obraNome, profile, obra, sequenceNumber, logoBase64, photosBase64, responsibleSigBase64, clientSigBase64 
}: any) => {
    
    const climaData = rdo.clima_condicoes?.split(', ') || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 1. HEADER TABULAR */}
                <View style={styles.headerGrid}>
                    <View style={styles.headerCol1}>
                        <Image src={logoBase64 || BRAND_LOGO_B64} style={styles.logo} />
                    </View>
                    <View style={styles.headerCol2}>
                        <Text style={styles.headerTitle}>{obraNome}</Text>
                        <Text style={styles.headerText}>ENDEREÇO: {obra?.endereco || "N/A"}</Text>
                        <Text style={styles.headerText}>CONTRATANTE: {obra?.dono_cliente || "N/A"}</Text>
                        <Text style={styles.headerText}>EMPRESA: {profile?.company_name || "MEU RDO APP"}</Text>
                    </View>
                    <View style={styles.headerCol3}>
                        <Text style={styles.headerTitle}>RDO Nº {sequenceNumber}</Text>
                        <Text style={styles.headerText}>DATA: {format(parseISO(rdo.data_rdo), "dd/MM/yyyy")}</Text>
                        <Text style={styles.headerText}>STATUS: {rdo.status === 'approved' ? 'APROVADO' : 'EM REVISÃO'}</Text>
                    </View>
                </View>

                {/* 2. MATRIZ CLIMÁTICA */}
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Condições Climáticas e Operacionais</Text></View>
                <View style={styles.climaTable}>
                    {['MANHÃ', 'TARDE', 'NOITE'].map((period, idx) => (
                        <View key={idx} style={[styles.climaCell, idx === 2 && { borderRightWidth: 0 }]}>
                            <Text style={styles.climaLabel}>{period}</Text>
                            <Text style={styles.climaVal}>{climaData[idx]?.includes('N/T') ? 'N/T' : climaData[idx]?.split(': ')[1] || 'SOL'}</Text>
                        </View>
                    ))}
                </View>

                {/* 3. ATIVIDADES DO DIA */}
                <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Serviços e Cronograma</Text></View>
                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCellHead, { width: '70%' }]}>Descrição do Serviço Executado</Text>
                        <Text style={[styles.tableCellHead, { width: '30%', textAlign: 'center' }]}>Avanço Real (%)</Text>
                    </View>
                    {rdo.rdo_atividades_detalhe?.map((atv: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: '70%' }]}>{atv.descricao_servico}</Text>
                            <Text style={[styles.tableCell, { width: '30%', textAlign: 'center', fontWeight: 'bold' }]}>{atv.avanco_percentual}%</Text>
                        </View>
                    ))}
                </View>

                {/* 4. MÃO DE OBRA E MÁQUINAS (LADO A LADO) */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Efetivo</Text></View>
                        <View style={styles.table}>
                            {rdo.rdo_mao_de_obra?.map((m: any, i: number) => (
                                <View key={i} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{m.funcao}</Text>
                                    <Text style={[styles.tableCell, { width: 30, textAlign: 'center' }]}>{m.quantidade}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Máquinas</Text></View>
                        <View style={styles.table}>
                            {rdo.rdo_equipamentos?.length > 0 ? rdo.rdo_equipamentos.map((e: any, i: number) => (
                                <View key={i} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { flex: 1 }]}>{e.equipamento}</Text>
                                    <Text style={[styles.tableCell, { width: 30, textAlign: 'center' }]}>{e.horas_trabalhadas}h</Text>
                                </View>
                            )) : <View style={styles.tableRow}><Text style={styles.tableCell}>Nenhum equipamento reportado</Text></View>}
                        </View>
                    </View>
                </View>

                {/* 5. OBSERVAÇÕES */}
                {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
                    <View style={{ marginTop: 10 }}>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Relatório de Campo / Ocorrências</Text></View>
                        <View style={{ padding: 8, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fdfdfd' }}>
                            <Text style={{ fontSize: 8, lineHeight: 1.4 }}>{rdo.impedimentos_comentarios || ""} {rdo.observacoes_gerais || ""}</Text>
                        </View>
                    </View>
                )}

                {/* 6. FOTOS EM NOVA PÁGINA SE NECESSÁRIO */}
                {photosBase64 && photosBase64.length > 0 && (
                    <View break>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Relatório Fotográfico de Evidências</Text></View>
                        <View style={styles.photoGrid}>
                            {photosBase64.map((p: any, idx: number) => (
                                <View key={idx} style={styles.photoBox} wrap={false}>
                                    <Image src={p.base64} style={styles.photoImg} />
                                    <Text style={styles.photoText}>{p.desc.toUpperCase()}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 7. ASSINATURAS */}
                <View style={[styles.footerSignatures, { marginTop: 'auto' }]}>
                    <View style={styles.sigBox}>
                        {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.sigImg} />}
                        <Text style={styles.sigName}>{profile?.first_name} {profile?.last_name}</Text>
                        <Text style={styles.sigRole}>RESPONSÁVEL TÉCNICO</Text>
                    </View>
                    <View style={styles.sigBox}>
                        {clientSigBase64 ? <Image src={clientSigBase64} style={styles.sigImg} /> : <View style={{ height: 50 }} />}
                        <Text style={styles.sigName}>{rdo.signer_name || "AGUARDANDO APROVAÇÃO"}</Text>
                        <Text style={styles.sigRole}>{rdo.signer_registration || "CONTRATANTE / FISCALIZAÇÃO"}</Text>
                    </View>
                </View>

                <Text style={styles.pageFooter}>Documento oficial gerado via Meu RDO. A autenticidade pode ser validada pelo ID: {rdo.id}</Text>
            </Page>
        </Document>
    );
};