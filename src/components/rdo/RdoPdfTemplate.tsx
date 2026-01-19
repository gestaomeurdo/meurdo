import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";

// Logo Meu RDO em Base64 para fallback garantido
const LOGO_MEU_RDO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACVv6umAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYySURBVHgB7Z27bhNREIaf9S6WIEghIUFBIREpEiV8AD4EBR8AH4APQUVFCiokKiooUFAhQYIUCV0iRSBIEBAsvD67OfZ4xmdv7869tndm978ay57Z2fE5Z/ZcZuIkiYKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCQv6E03A6DufhvAsX4HIYzsD1MJyD62FIsE2YfTfMv0uXfAun4BqcgePDfA6uhWET7F9C6Mh4Hk7DbeD5NpwfhtNwHdgG/7mHj8H7LlwD8C5cg6fA9zicH4bzI/0yAofmXTiE88NwCO9n4SzwzN934G8+Gq4X8uAwnAKeBf6X34eE6v0onAd75OOf5XfH8729v/zXG+H0u7AHz0C79mO6n/fPInA9LidBvX4E798G9uI/6uO9eIeFfM7fM3D82H/s8B9/p9fD0Fm78h/v4eM5YPuB93+f78E7/P3HevFv629C/YFm7A/+P569/B92+U8In7H9/jve+2e635j2G47P8P6f8f5v4PwL3B52eRfaP88m2L8O3oU2P8PeZfAtpNuBdnY9z97p8R/CunS70C7O/7BveNizn7Bv6vY3wfpwH4Yl3Ae26Vp6/O/v9DzsH7fBfmB7+FfX/fX6m+D5z/C4H9j8vTfC1vV9eO496Xag3UvX9XU39X3G7L9o98vXp/vR76L16X6P8Xqff6frv/D9X+vXv+l+9Psv76D/oPvU76P10X3u72Xf/w/r1//U9xmz/x7v93r3z/X5u/T89U+6D+89Nqf7fT+uX3/G/f1v/N/7f7z7O+L19vefb/vHdfCfr6/v86e96/z7vL9L9+Fz8K6n9X3S++79v3f/8H6vX9+eN77vT79f9X1H77uX7396Xv3e6fU39PnTXnr9vXf9vUfvk/57/Xf9r+8vve72Pv930vvzX6/87nX/0ue8P88G3ofnO39DfX5X1+1v6L96f86HfcE7POxZ2Iez8A7tD98O0n+F/+JpOD8O79L1f4m9/Of8PUP3S++F97uXnre/u9M/+r3Wv/qf9pM9DmfhcRhOwdVfGJWv4Rhcl8MzYm9fC1Mfxv7L8A+fC1Mfmv6W9uOf0Oa6PzD9T99v6XOf7/890+8Yuj/eY3v9Y/v98f7qfUfXv+nr0vv73y8v//X6vP4X/6Zun/vT6/K7fH36v79/vI/Xp/vR76L96D9pP+S6Mvsv6Bf9r/S6/B/fX/73/pP2999/L93H95f+P68/+H3pX74e+X8Xf0H3i37H73+9Lv/H9xf9r98v+t/uP/ofvy99X/8XFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP67AQC777f/YwG0VwAAAABJRU5ErkJggg==";

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 9, color: '#1e293b' },
  headerContainer: { flexDirection: 'row', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  headerCol1: { width: '20%', borderRightStyle: 'solid', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 10, justifyContent: 'center', alignItems: 'center' },
  headerCol2: { width: '55%', borderRightStyle: 'solid', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 10 },
  headerCol3: { width: '25%', padding: 10, backgroundColor: '#f8fafc' },
  logo: { width: 80, objectFit: 'contain' },
  docTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#066abc', marginBottom: 6, textTransform: 'uppercase' },
  headerLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 1 },
  headerValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  controlBig: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#066abc', textAlign: 'center' },
  controlSmall: { fontSize: 7, textAlign: 'center', color: '#64748b', textTransform: 'uppercase' },
  climateSection: { marginBottom: 20 },
  climateGrid: { flexDirection: 'row', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  climateCell: { flex: 1, borderRightStyle: 'solid', borderRightWidth: 1, borderRightColor: '#e2e8f0', padding: 8, alignItems: 'center' },
  climateCellLast: { flex: 1, padding: 8, alignItems: 'center' },
  periodTitle: { fontSize: 6, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  climateText: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  badgeOp: { backgroundColor: '#dcfce7', color: '#166534', padding: '2 6', borderRadius: 10, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  badgePar: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '2 6', borderRadius: 10, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 15 },
  sectionHeader: { 
    backgroundColor: '#f3f4f6', 
    borderLeftStyle: 'solid',
    borderLeftWidth: 3, 
    borderLeftColor: '#066abc', 
    padding: '4 8', 
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#066abc', textTransform: 'uppercase' },
  table: { width: '100%', borderWidth: 0, borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: '#e2e8f0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#e2e8f0', padding: 5 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: '#f1f5f9', padding: 5, minHeight: 20 },
  colDesc: { flex: 4, fontSize: 8 },
  colVal: { flex: 1, fontSize: 8, textAlign: 'center' },
  occurrenceBox: { backgroundColor: '#fff7ed', borderStyle: 'solid', borderWidth: 1, borderColor: '#ffedd5', padding: 10, borderRadius: 4 },
  occurrenceLabel: { fontSize: 7, color: '#9a3412', fontFamily: 'Helvetica-Bold', marginBottom: 4, textTransform: 'uppercase' },
  occurrenceText: { fontSize: 8, color: '#431407', lineHeight: 1.4 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoItem: { width: '31%', marginBottom: 10 },
  photoImg: { width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  photoCap: { fontSize: 6, color: '#64748b', marginTop: 3, textAlign: 'center' },
  sigSection: { flexDirection: 'row', marginTop: 30, gap: 40, borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 },
  sigBlock: { flex: 1, alignItems: 'center' },
  sigImg: { height: 45, marginBottom: 5, objectFit: 'contain' },
  sigLine: { width: '80%', borderTopStyle: 'solid', borderTopWidth: 1, borderTopColor: '#94a3b8', marginBottom: 3 },
  sigText: { fontSize: 7, fontFamily: 'Helvetica-Bold' }
});

const ClimateCell = ({ period, data, isLast }: any) => {
    if (!data || data.includes("N/T")) {
        return (
            <View style={isLast ? styles.climateCellLast : styles.climateCell}>
                <Text style={styles.periodTitle}>{period}</Text>
                <Text style={{ fontSize: 8, color: '#cbd5e1' }}>SEM TURNO</Text>
            </View>
        );
    }
    
    const match = data.match(/: (.*?) \((.*?)\)/);
    const clima = match ? match[1] : "-";
    const status = match ? match[2] : "";
    const isOp = status === "Op";

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
    const morning = climaParts[0];
    const afternoon = climaParts[1];
    const night = climaParts[2];

    const totalEfetivo = rdo.rdo_mao_de_obra?.reduce((sum: number, m: any) => sum + (Number(m.quantidade) || 0), 0) || 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
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
                        <Text style={styles.controlSmall}>RDO Número</Text>
                        <Text style={styles.controlBig}>{sequenceNumber}</Text>
                        <View style={{ marginTop: 10 }}>
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

                {/* Climate Matrix */}
                <View style={styles.climateSection}>
                    <View style={styles.climateGrid}>
                        <ClimateCell period="Período da Manhã" data={morning} />
                        <ClimateCell period="Período da Tarde" data={afternoon} />
                        <ClimateCell period="Período da Noite" data={night} isLast={true} />
                    </View>
                </View>

                {/* KPI Summary */}
                <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 4, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={styles.headerLabel}>Efetivo Total</Text>
                        <Text style={[styles.headerValue, { color: '#066abc', fontSize: 10 }]}>{totalEfetivo} Colaboradores</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 4, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <Text style={styles.headerLabel}>Responsável Técnico</Text>
                        <Text style={[styles.headerValue, { fontSize: 9 }]}>{rdo.signer_name || "N/A"}</Text>
                    </View>
                </View>

                {/* Activities Table */}
                {rdo.rdo_atividades_detalhe && rdo.rdo_atividades_detalhe.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Atividades e Serviços Realizados</Text>
                        </View>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={styles.colDesc}>Descrição do Serviço</Text>
                                <Text style={styles.colVal}>Avanço Físico</Text>
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

                {/* Manpower Table */}
                {rdo.rdo_mao_de_obra && rdo.rdo_mao_de_obra.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Mão de Obra / Efetivo</Text>
                        </View>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={{ flex: 3 }}>Função / Cargo</Text>
                                <Text style={{ flex: 1, textAlign: 'center' }}>Quantidade</Text>
                                <Text style={{ flex: 1, textAlign: 'right' }}>Vínculo</Text>
                            </View>
                            {rdo.rdo_mao_de_obra.map((m: any, i: number) => (
                                <View key={i} style={styles.tableRow}>
                                    <Text style={{ flex: 3 }}>{m.funcao}</Text>
                                    <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>{m.quantidade}</Text>
                                    <Text style={{ flex: 1, textAlign: 'right', fontSize: 7 }}>{m.tipo}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Occurrences Box */}
                {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Ocorrências e Impedimentos</Text>
                        </View>
                        <View style={styles.occurrenceBox}>
                            {rdo.impedimentos_comentarios && (
                                <View style={{ marginBottom: 8 }}>
                                    <Text style={styles.occurrenceLabel}>Impedimentos / Causas de Paralisação:</Text>
                                    <Text style={styles.occurrenceText}>{rdo.impedimentos_comentarios}</Text>
                                </View>
                            )}
                            {rdo.observacoes_gerais && (
                                <View>
                                    <Text style={[styles.occurrenceLabel, { color: '#066abc' }]}>Observações Gerais:</Text>
                                    <Text style={styles.occurrenceText}>{rdo.observacoes_gerais}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Photographic Register */}
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

                {/* Signature Section */}
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

                {/* Global Footer */}
                <Text 
                    style={{ position: 'absolute', bottom: 20, left: 40, right: 40, textAlign: 'center', fontSize: 6, color: '#cbd5e1' }}
                    render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages} | Documento Gerado por MEURDO.COM.BR`}
                />
            </Page>
        </Document>
    );
};