import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";

// Logo Meu RDO em Base64 para garantir renderização sem CORS
const LOGO_MEU_RDO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACVv6umAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYySURBVHgB7Z27bhNREIaf9S6WIEghIUFBIREpEiV8AD4EBR8AH4APQUVFCiokKiooUFAhQYIUCV0iRSBIEBAsvD67OfZ4xmdv7869tndm978ay57Z2fE5Z/ZcZuIkiYKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCQv6E03A6DufhvAsX4HIYzsD1MJyD62FIsE2YfTfMv0uXfAun4BqcgePDfA6uhWET7F9C6Mh4Hk7DbeD5NpwfhtNwHdgG/7mHj8H7LlwD8C5cg6fA9zicH4bzI/0yAofmXTiE88NwCO9n4SzwzN934G8+Gq4X8uAwnAKeBf6X34eE6v0onAd75OOf5XfH8729v/zXG+H0u7AHz0C79mO6n/fPInA9LidBvX4E798G9uI/6uO9eIeFfM7fM3D82H/s8B9/p9fD0Fm78h/v4eM5YPuB93+f78E7/P3HevFv629C/YFm7A/+P569/B92+U8In7H9/jve+2e635j2G47P8P6f8f5v4PwL3B52eRfaP88m2L8O3oU2P8PeZfAtpNuBdnY9z97p8R/CunS70C7O/7BveNizn7Bv6vY3wfpwH4Yl3Ae26Vp6/O/v9DzsH7fBfmB7+FfX/fX6m+D5z/C4H9j8vTfC1vV9eO496Xag3UvX9XU39X3G7L9o98vXp/vR76L16X6P8Xqff6frv/D9X+vXv+l+9Psv76D/oPvU76P10X3u72Xf/w/r1//U9xmz/x7v93r3z/X5u/T89U+6D+89Nqf7fT+uX3/G/f1v/N/7f7z7O+L19vefb/vHdfCfr6/v86e96/z7vL9L9+Fz8K6n9X3S++79v3f/8H6vX9+eN77vT79f9X1H77uX7396Xv3e6fU39PnTXnr9vXf9vUfvk/57/Xf9r+8vve72Pv930vvzX6/87nX/0ue8P88G3ofnO39DfX5X1+1v6L96f86HfcE7POxZ2Iez8A7tD98O0n+F/+JpOD8O79L1f4m9/Of8PUP3S++F97uXnre/u9M/+r3Wv/qf9pM9DmfhcRhOwdVfGJWv4Rhcl8MzYm9fC1Mfxv7L8A+fC1Mfmv6W9uOf0Oa6PzD9T99v6XOf7/890+8Yuj/eY3v9Y/v98f7qfUfXv+nr0vv73y8v//X6vP4X/6Zun/vT6/K7fH36v79/vI/Xp/vR76L96D9pP+S6Mvsv6Bf9r/S6/B/fX/73/pP2999/L93H95f+P68/+H3pX74e+X8Xf0H3i37H73+9Lv/H9xf9r98v+t/uP/ofvy99X/8XFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP67AQC777f/YwG0VwAAAABJRU5ErkJggg==";

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 9, color: '#1e293b' },
  headerContainer: { flexDirection: 'row', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 },
  headerCol1: { width: '20%', borderRightWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', padding: 10, justifyContent: 'center', alignItems: 'center' },
  headerCol2: { width: '55%', borderRightWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', padding: 10 },
  headerCol3: { width: '25%', padding: 10, backgroundColor: '#f8fafc' },
  logo: { width: 80, objectFit: 'contain' },
  docTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#066abc', marginBottom: 6, textTransform: 'uppercase' },
  headerLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 1 },
  headerValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  controlBig: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#066abc', textAlign: 'center' },
  controlSmall: { fontSize: 7, textAlign: 'center', color: '#64748b', textTransform: 'uppercase' },
  
  climateGrid: { flexDirection: 'row', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, marginBottom: 15, overflow: 'hidden' },
  climateCell: { flex: 1, borderRightWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', padding: 8, alignItems: 'center' },
  climateCellLast: { flex: 1, padding: 8, alignItems: 'center' },
  periodTitle: { fontSize: 6, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  climateText: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  badgeOp: { backgroundColor: '#dcfce7', color: '#166534', padding: '2 6', borderRadius: 10, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  badgePar: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '2 6', borderRadius: 10, fontSize: 7, fontFamily: 'Helvetica-Bold' },

  section: { marginBottom: 12 },
  sectionHeader: { 
    backgroundColor: '#f3f4f6', 
    borderLeftWidth: 3, 
    borderStyle: 'solid',
    borderColor: '#066abc', 
    padding: '4 8', 
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#066abc', textTransform: 'uppercase' },
  
  // Estilos Segurança
  safetyBox: { borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, padding: 10, flexDirection: 'row', gap: 15 },
  safetyBadge: { backgroundColor: '#22c55e', color: '#ffffff', padding: '6 12', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  safetyBadgeText: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  safetyList: { flex: 1, gap: 4 },
  safetyItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  safetyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#066abc' },

  table: { width: '100%', borderTopWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', padding: 5 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderStyle: 'solid', borderColor: '#f1f5f9', padding: 5, minHeight: 18 },
  colDesc: { flex: 4, fontSize: 8 },
  colVal: { flex: 1, fontSize: 8, textAlign: 'center' },
  
  occurrenceBox: { backgroundColor: '#fff7ed', borderStyle: 'solid', borderWidth: 1, borderColor: '#ffedd5', padding: 10, borderRadius: 4 },
  occurrenceLabel: { fontSize: 7, color: '#9a3412', fontFamily: 'Helvetica-Bold', marginBottom: 4, textTransform: 'uppercase' },
  occurrenceText: { fontSize: 8, color: '#431407', lineHeight: 1.4 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoItem: { width: '31%', marginBottom: 10 },
  photoImg: { width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  photoCap: { fontSize: 6, color: '#64748b', marginTop: 3, textAlign: 'center' },

  sigSection: { flexDirection: 'row', marginTop: 25, gap: 40, borderTopWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0', paddingTop: 15 },
  sigBlock: { flex: 1, alignItems: 'center' },
  sigImg: { height: 40, marginBottom: 4, objectFit: 'contain' },
  sigLine: { width: '80%', borderTopWidth: 1, borderStyle: 'solid', borderColor: '#94a3b8', marginBottom: 3 },
  sigText: { fontSize: 7, fontFamily: 'Helvetica-Bold' }
});

const ClimateCell = ({ period, data, isLast }: any) => {
    if (!data || data.includes("N/T")) {
        return (
            <View style={isLast ? styles.climateCellLast : styles.climateCell}>
                <Text style={styles.periodTitle}>{period}</Text>
                <Text style={{ fontSize: 7, color: '#cbd5e1' }}>SEM TURNO</Text>
            </View>
        );
    }
    const match = data.match(/: (.*?) \((.*?)\)/);
    const clima = match ? match[1] : "-";
    const isOp = match ? match[2] === "Op" : true;

    return (
        <View style={isLast ? styles.climateCellLast : styles.climateCell}>
            <Text style={styles.periodTitle}>{period}</Text>
            <Text style={styles.climateText}>{clima.toUpperCase()}</Text>
            <View style={isOp ? styles.badgeOp : styles.badgePar}>
                <Text>{isOp ? "OPERACIONAL" : "PARALISADO"}</Text>
            </View>
        </View>
    );
};

export const RdoPdfTemplate = ({ 
    rdo, obraNome, profile, obra, sequenceNumber, dayOfWeek,
    logoBase64, photosBase64, responsibleSigBase64, clientSigBase64 
}: any) => {
    
    const climaParts = rdo.clima_condicoes ? rdo.clima_condicoes.split(', ') : [];
    const totalEfetivo = rdo.rdo_mao_de_obra?.reduce((sum: number, m: any) => sum + (Number(m.quantidade) || 0), 0) || 0;
    
    // Lógica Zero Acidentes
    const hasAccident = rdo.safety_comments && rdo.safety_comments.toLowerCase().includes('acidente');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerCol1}>
                        <Image src={logoBase64 || LOGO_MEU_RDO_B64} style={styles.logo} />
                    </View>
                    <View style={styles.headerCol2}>
                        <Text style={styles.docTitle}>Relatório Diário de Obra</Text>
                        <Text style={styles.headerLabel}>Obra:</Text>
                        <Text style={styles.headerValue}>{obraNome.toUpperCase()}</Text>
                        <Text style={styles.headerLabel}>Endereço:</Text>
                        <Text style={[styles.headerValue, { fontSize: 7 }]}>{obra?.endereco || "Local não informado"}</Text>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <View>
                                <Text style={styles.headerLabel}>Contratante:</Text>
                                <Text style={styles.headerValue}>{obra?.dono_cliente || "N/A"}</Text>
                            </View>
                            <View>
                                <Text style={styles.headerLabel}>Construtora:</Text>
                                <Text style={styles.headerValue}>{profile?.company_name || "N/A"}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerCol3}>
                        <Text style={styles.controlSmall}>RDO Nº</Text>
                        <Text style={styles.controlBig}>{sequenceNumber}</Text>
                        <View style={{ marginTop: 8 }}>
                            <Text style={styles.controlSmall}>Data do Registro</Text>
                            <Text style={[styles.headerValue, { textAlign: 'center', marginBottom: 2 }]}>
                                {format(parseISO(rdo.data_rdo), "dd/MM/yyyy")}
                            </Text>
                            <Text style={[styles.controlSmall, { fontSize: 6, color: '#066abc', fontFamily: 'Helvetica-Bold' }]}>
                                {dayOfWeek.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Clima */}
                <View style={styles.climateGrid}>
                    <ClimateCell period="Manhã" data={climaParts[0]} />
                    <ClimateCell period="Tarde" data={climaParts[1]} />
                    <ClimateCell period="Noite" data={climaParts[2]} isLast={true} />
                </View>

                {/* Resumo e Segurança */}
                <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 4, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={styles.headerLabel}>Efetivo Total</Text>
                        <Text style={[styles.headerValue, { color: '#066abc', fontSize: 10 }]}>{totalEfetivo} Colaboradores</Text>
                    </View>
                    <View style={{ flex: 1.5, backgroundColor: '#f8fafc', padding: 8, borderRadius: 4, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={styles.headerLabel}>Resp. Técnico</Text>
                        <Text style={[styles.headerValue, { fontSize: 9 }]}>{rdo.signer_name || "Não informado"}</Text>
                    </View>
                </View>

                {/* SEÇÃO SEGURANÇA (Obrigatória) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Segurança do Trabalho</Text>
                    </View>
                    <View style={styles.safetyBox}>
                        <View style={[styles.safetyBadge, { backgroundColor: hasAccident ? '#ef4444' : '#22c55e' }]}>
                            <Text style={styles.safetyBadgeText}>{hasAccident ? "INCIDENTE REGISTRADO" : "ZERO ACIDENTES"}</Text>
                        </View>
                        <View style={styles.safetyList}>
                            <View style={styles.safetyItem}>
                                <View style={styles.safetyDot} />
                                <Text style={{ fontSize: 7.5 }}>Uso de EPIs: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{rdo.safety_epi ? "CONFORME" : "NÃO APLICÁVEL"}</Text></Text>
                            </View>
                            <View style={styles.safetyItem}>
                                <View style={styles.safetyDot} />
                                <Text style={{ fontSize: 7.5 }}>Checklist NR-35: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{rdo.safety_nr35 ? "CONFORME" : "NÃO APLICÁVEL"}</Text></Text>
                            </View>
                            <View style={styles.safetyItem}>
                                <View style={styles.safetyDot} />
                                <Text style={{ fontSize: 7.5 }}>DDS Realizado: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{rdo.safety_dds ? "SIM" : "NÃO"}</Text></Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Atividades */}
                {rdo.rdo_atividades_detalhe && rdo.rdo_atividades_detalhe.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Serviços Realizados</Text>
                        </View>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.colDesc}>Descrição</Text>
                                <Text style={styles.colVal}>Avanço</Text>
                            </View>
                            {rdo.rdo_atividades_detalhe.map((atv: any, i: number) => (
                                <View key={i} style={styles.tableRow}>
                                    <Text style={styles.colDesc}>{atv.descricao_servico}</Text>
                                    <Text style={[styles.colVal, { fontFamily: 'Helvetica-Bold', color: '#066abc' }]}>{atv.avanco_percentual}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Ocorrências */}
                {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Ocorrências e Notas</Text>
                        </View>
                        <View style={styles.occurrenceBox}>
                            {rdo.impedimentos_comentarios && (
                                <View style={{ marginBottom: 6 }}>
                                    <Text style={styles.occurrenceLabel}>Impedimentos:</Text>
                                    <Text style={styles.occurrenceText}>{rdo.impedimentos_comentarios}</Text>
                                </View>
                            )}
                            {rdo.observacoes_gerais && (
                                <View>
                                    <Text style={[styles.occurrenceLabel, { color: '#066abc' }]}>Notas:</Text>
                                    <Text style={styles.occurrenceText}>{rdo.observacoes_gerais}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Registro Fotográfico (Galeria Agregada) */}
                {photosBase64 && photosBase64.length > 0 && (
                    <View style={styles.section} break>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Registro Fotográfico de Campo</Text>
                        </View>
                        <View style={styles.photoGrid}>
                            {photosBase64.map((p: any, idx: number) => (
                                <View key={idx} style={styles.photoItem} wrap={false}>
                                    <Image src={p.base64} style={styles.photoImg} />
                                    <Text style={styles.photoCap}>{p.desc}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Assinaturas */}
                <View style={styles.sigSection} wrap={false}>
                    <View style={styles.sigBlock}>
                        {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.sigImg} />}
                        <View style={styles.sigLine} />
                        <Text style={styles.sigText}>RESPONSÁVEL TÉCNICO</Text>
                        <Text style={{ fontSize: 6, color: '#64748b' }}>{rdo.signer_name || "N/A"}</Text>
                    </View>
                    <View style={styles.sigBlock}>
                        {clientSigBase64 && <Image src={clientSigBase64} style={styles.sigImg} />}
                        <View style={styles.sigLine} />
                        <Text style={styles.sigText}>FISCALIZAÇÃO / CLIENTE</Text>
                        <Text style={{ fontSize: 6, color: '#64748b' }}>Assinatura Digital</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text 
                    style={{ position: 'absolute', bottom: 20, left: 40, right: 40, textAlign: 'center', fontSize: 6, color: '#cbd5e1' }}
                    render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages} | MEURDO.COM.BR`}
                />
            </Page>
        </Document>
    );
};