import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";

const LOGO_MEU_RDO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACVv6umAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYySURBVHgB7Z27bhNREIaf9S6WIEghIUFBIREpEiV8AD4EBR8AH4APQUVFCiokKiooUFAhQYIUCV0iRSBIEBAsvD67OfZ4xmdv7869tndm978ay57Z2fE5Z/ZcZuIkiYKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCQv6E03A6DufhvAsX4HIYzsD1MJyD62FIsE2YfTfMv0uXfAun4BqcgePDfA6uhWET7F9C6Mh4Hk7DbeD5NpwfhtNwHdgG/7mHj8H7LlwD8C5cg6fA9zicH4bzI/0yAofmXTiE88NwCO9n4SzwzN934G8+Gq4X8uAwnAKeBf6X34eE6v0onAd75OOf5XfH8729v/zXG+H0u7AHz0C79mO6n/fPInA9LidBvX4E798G9uI/6uO9eIeFfM7fM3D82H/s8B9/p9fD0Fm78h/v4eM5YPuB93+f78E7/P3HevFv629C/YFm7A/+P569/B92+U8In7H9/jve+2e635j2G47P8P6f8f5v4PwL3B52eRfaP88m2L8O3oU2P8PeZfAtpNuBdnY9z97p8R/CunS70C7O/7BveNizn7Bv6vY3wfpwH4Yl3Ae26Vp6/O/v9DzsH7fBfmB7+FfX/fX6m+D5z/C4H9j8vTfC1vV9eO496Xag3UvX9XU39X3G7L9o98vXp/vR76L16X6P8Xqff6frv/D9X+vXv+l+9Psv76D/oPvU76P10X3u72Xf/w/r1//U9xmz/x7v93r3z/X5u/T89U+6D+89Nqf7fT+uX3/G/f1v/N/7f7z7O+L19vefb/vHdfCfr6/v86e96/z7vL9L9+Fz8K6n9X3S++79v3f/8H6vX9+eN77vT79f9X1H77uX7396Xv3e6fU39PnTXnr9vXf9vUfvk/57/Xf9r+8vve72Pv930vvzX6/87nX/0ue8P88G3ofnO39DfX5X1+1v6L96f86HfcE7POxZ2Iez8A7tD98O0n+F/+JpOD8O79L1f4m9/Of8PUP3S++F97uXnre/u9M/+r3Wv/qf9pM9DmfhcRhOwdVfGJWv4Rhcl8MzYm9fC1Mfxv7L8A+fC1Mfmv6W9uOf0Oa6PzD9T99v6XOf7/890+8Yuj/eY3v9Y/v98f7qfUfXv+nr0vv73y8v//X6vP4X/6Zun/vT6/K7fH36v79/vI/Xp/vR76L96D9pP+S6Mvsv6Bf9r/S6/B/fX/73/pP2999/L93H95f+P68/+H3pX74e+X8Xf0H3i37H73+9Lv/H9xf9r98v+t/uP/ofvy99X/8XFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP67AQC777f/YwG0VwAAAABJRU5ErkJggg==";

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 8, color: '#0f172a' },
  
  // Header Grid
  headerWrapper: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  headerMain: { flex: 1.8, borderStyle: 'solid', borderWidth: 0.5, borderColor: '#cbd5e1', padding: 10, borderRadius: 2 },
  headerStats: { flex: 1, borderStyle: 'solid', borderWidth: 0.5, borderColor: '#cbd5e1', borderRadius: 2, overflow: 'hidden' },
  
  logo: { height: 35, marginBottom: 10, objectFit: 'contain', alignSelf: 'flex-start' },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { width: 60, fontSize: 6, color: '#64748b', textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  infoValue: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // Stats Table in Header
  statsRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderStyle: 'solid', borderColor: '#e2e8f0' },
  statsCell: { flex: 1, padding: 4, borderRightWidth: 0.5, borderStyle: 'solid', borderColor: '#e2e8f0', alignItems: 'center' },
  statsCellLast: { flex: 1, padding: 4, alignItems: 'center' },
  statsLabel: { fontSize: 5, color: '#64748b', textTransform: 'uppercase', marginBottom: 1 },
  statsValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  statsHeader: { backgroundColor: '#334155', padding: 5, alignItems: 'center' },
  statsHeaderText: { color: '#ffffff', fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  // Climate Matrix
  climateTable: { borderStyle: 'solid', borderWidth: 0.5, borderColor: '#cbd5e1', marginBottom: 15 },
  climateHeader: { flexDirection: 'row', backgroundColor: '#334155', color: '#ffffff' },
  climateRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderStyle: 'solid', borderColor: '#e2e8f0' },
  climateCol: { flex: 1, padding: 5, textAlign: 'center', borderRightWidth: 0.5, borderStyle: 'solid', borderColor: '#e2e8f0' },
  climateColLast: { flex: 1, padding: 5, textAlign: 'center' },
  climateText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },

  // Resource Grid (Cards)
  resourceSection: { marginBottom: 15 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  resourceCard: { 
    width: '24%', 
    borderStyle: 'solid', 
    borderWidth: 0.5, 
    borderColor: '#cbd5e1', 
    padding: 6, 
    alignItems: 'center', 
    backgroundColor: '#f8fafc',
    borderRadius: 2
  },
  cardTitle: { fontSize: 6, color: '#64748b', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', height: 14 },
  cardValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#066abc' },

  // Activities Table
  sectionHeader: { backgroundColor: '#334155', color: '#ffffff', padding: '4 8', marginBottom: 4, borderRadius: 1 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderStyle: 'solid', borderColor: '#334155', padding: '4 8' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderStyle: 'solid', borderColor: '#e2e8f0', padding: '6 8', alignItems: 'center' },
  colDesc: { flex: 5, fontSize: 8 },
  colStatus: { flex: 1, alignItems: 'center' },
  statusBadge: { padding: '2 6', borderRadius: 2, fontSize: 6, fontFamily: 'Helvetica-Bold' },

  // Observations with User Stamp
  obsContainer: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 2, marginTop: 5 },
  obsUser: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#066abc', marginBottom: 2 },
  obsText: { fontSize: 8, color: '#334155', lineHeight: 1.3 },

  // Photos Grid (Double)
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  photoBox: { width: '48%', marginBottom: 10 },
  photoImg: { width: '100%', height: 180, objectFit: 'cover', borderRadius: 2, borderStyle: 'solid', borderWidth: 0.5, borderColor: '#cbd5e1' },
  photoCaption: { fontSize: 7, color: '#64748b', marginTop: 4, fontFamily: 'Helvetica-Bold' },

  // Digital Approvals
  sigRow: { flexDirection: 'row', gap: 10, marginTop: 30 },
  digitalBox: { flex: 1, borderStyle: 'solid', borderWidth: 1, borderColor: '#22c55e', padding: 8, backgroundColor: '#f0fdf4', borderRadius: 2 },
  approvalTitle: { color: '#166534', fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4, textAlign: 'center' },
  approvalData: { fontSize: 6, color: '#166534', marginBottom: 1 },
  sigImg: { height: 35, objectFit: 'contain', marginVertical: 5, opacity: 0.8 },

  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', borderTopWidth: 0.5, borderColor: '#e2e8f0', paddingTop: 10, fontSize: 6, color: '#94a3b8' }
});

const ClimateTableRow = ({ period, data }: any) => {
    const isNT = !data || data.includes("N/T");
    let clima = "N/T";
    let condicao = "N/T";
    let isOp = true;

    if (!isNT) {
        const match = data.match(/: (.*?) \((.*?)\)/);
        clima = match ? match[1].toUpperCase() : "-";
        isOp = match ? match[2] === "Op" : true;
        condicao = isOp ? "PRATICÁVEL" : "NÃO PRATICÁVEL";
    }

    return (
        <View style={styles.climateRow}>
            <View style={styles.climateCol}><Text style={styles.climateText}>{period}</Text></View>
            <View style={styles.climateCol}><Text style={{ fontSize: 7 }}>{clima}</Text></View>
            <View style={styles.climateColLast}>
                <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: isOp ? '#166534' : '#991b1b' }}>{condicao}</Text>
            </View>
        </View>
    );
};

export const RdoPdfTemplate = ({ 
    rdo, obraNome, profile, obra, sequenceNumber, dayOfWeek,
    logoBase64, photosBase64, responsibleSigBase64, clientSigBase64,
    contractStats
}: any) => {
    
    const climaParts = rdo.clima_condicoes ? rdo.clima_condicoes.split(', ') : [];
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Grid Section */}
                <View style={styles.headerWrapper}>
                    <View style={styles.headerMain}>
                        <Image src={logoBase64 || LOGO_MEU_RDO_B64} style={styles.logo} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Obra:</Text>
                            <Text style={styles.infoValue}>{obraNome.toUpperCase()}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Localização:</Text>
                            <Text style={[styles.infoValue, { fontSize: 7 }]}>{obra?.endereco || "Local não informado"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Cliente:</Text>
                            <Text style={styles.infoValue}>{obra?.dono_cliente || "N/A"}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Responsável:</Text>
                            <Text style={styles.infoValue}>{rdo.signer_name || profile?.first_name + " " + profile?.last_name}</Text>
                        </View>
                    </View>

                    <View style={styles.headerStats}>
                        <View style={styles.statsHeader}>
                            <Text style={styles.statsHeaderText}>CONTROLE DE PRAZOS</Text>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.statsCell}><Text style={styles.statsLabel}>RDO Nº</Text><Text style={styles.statsValue}>{sequenceNumber}</Text></View>
                            <View style={styles.statsCellLast}><Text style={styles.statsLabel}>DATA</Text><Text style={styles.statsValue}>{format(parseISO(rdo.data_rdo), "dd/MM/yy")}</Text></View>
                        </View>
                        <View style={[styles.statsRow, { borderBottomWidth: 0 }]}>
                            <View style={{ flex: 1, padding: 4, alignItems: 'center' }}>
                                <Text style={styles.statsLabel}>DIA DA SEMANA</Text>
                                <Text style={[styles.statsValue, { color: '#066abc' }]}>{dayOfWeek.toUpperCase()}</Text>
                            </View>
                        </View>
                        {contractStats?.hasDeadline && (
                            <>
                                <View style={[styles.statsHeader, { backgroundColor: '#64748b' }]}>
                                    <Text style={styles.statsHeaderText}>DIAS DO CONTRATO</Text>
                                </View>
                                <View style={styles.statsRow}>
                                    <View style={styles.statsCell}><Text style={styles.statsLabel}>TOTAIS</Text><Text style={styles.statsValue}>{contractStats.total}</Text></View>
                                    <View style={styles.statsCell}><Text style={styles.statsLabel}>PASSADOS</Text><Text style={styles.statsValue}>{contractStats.elapsed}</Text></View>
                                    <View style={styles.statsCellLast}><Text style={styles.statsLabel}>RESTANTES</Text><Text style={[styles.statsValue, { color: '#166534' }]}>{contractStats.remaining}</Text></View>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Clima Matrix */}
                <View style={styles.climateTable}>
                    <View style={styles.climateHeader}>
                        <View style={styles.climateCol}><Text style={styles.statsHeaderText}>PERÍODO</Text></View>
                        <View style={styles.climateCol}><Text style={styles.statsHeaderText}>TEMPO</Text></View>
                        <View style={styles.climateColLast}><Text style={styles.statsHeaderText}>CONDIÇÃO</Text></View>
                    </View>
                    <ClimateTableRow period="MANHÃ" data={climaParts[0]} />
                    <ClimateTableRow period="TARDE" data={climaParts[1]} />
                </View>

                {/* Efetivo Grid (Card Style) */}
                <View style={styles.resourceSection}>
                    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Mão de Obra (Efetivo)</Text></View>
                    <View style={styles.gridContainer}>
                        {rdo.rdo_mao_de_obra?.map((m: any, i: number) => (
                            <View key={i} style={styles.resourceCard}>
                                <Text style={styles.cardTitle}>{m.funcao}</Text>
                                <Text style={styles.cardValue}>{m.quantidade}</Text>
                            </View>
                        ))}
                        {(!rdo.rdo_mao_de_obra || rdo.rdo_mao_de_obra.length === 0) && (
                            <Text style={{ fontSize: 7, color: '#94a3b8' }}>Nenhum efetivo registrado.</Text>
                        )}
                    </View>
                </View>

                {/* Equipamentos Grid (Card Style) */}
                {rdo.rdo_equipamentos && rdo.rdo_equipamentos.length > 0 && (
                    <View style={styles.resourceSection}>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Equipamentos e Máquinas</Text></View>
                        <View style={styles.gridContainer}>
                            {rdo.rdo_equipamentos.map((e: any, i: number) => (
                                <View key={i} style={styles.resourceCard}>
                                    <Text style={styles.cardTitle}>{e.equipamento}</Text>
                                    <Text style={[styles.cardValue, { fontSize: 10 }]}>{e.horas_trabalhadas}h</Text>
                                    <Text style={{ fontSize: 5, color: '#64748b' }}>TRABALHADAS</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Atividades Table */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Atividades e Serviços Realizados</Text></View>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDesc}>DESCRIÇÃO DO SERVIÇO</Text>
                        <Text style={[styles.colStatus, { fontSize: 7, fontFamily: 'Helvetica-Bold' }]}>STATUS</Text>
                    </View>
                    {rdo.rdo_atividades_detalhe?.map((atv: any, i: number) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDesc}>{atv.descricao_servico}</Text>
                            <View style={styles.colStatus}>
                                <View style={[styles.statusBadge, { backgroundColor: atv.avanco_percentual === 100 ? '#dcfce7' : '#f1f5f9', color: atv.avanco_percentual === 100 ? '#166534' : '#64748b' }]}>
                                    <Text>{atv.avanco_percentual === 100 ? "CONCLUÍDO" : "EM ANDAMENTO"}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Observations with User Stamp */}
                {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Observações e Ocorrências</Text></View>
                        <View style={styles.obsContainer}>
                            <Text style={styles.obsUser}>
                                {profile?.first_name || "Usuário"} - {format(parseISO(rdo.data_rdo), "dd/MM/yyyy")}
                            </Text>
                            <Text style={styles.obsText}>
                                {rdo.impedimentos_comentarios || ""} {rdo.observacoes_gerais || ""}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Photos Grid (Double Layout) */}
                {photosBase64 && photosBase64.length > 0 && (
                    <View style={{ marginTop: 20 }} break>
                        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Anexo Fotográfico</Text></View>
                        <View style={styles.photoGrid}>
                            {photosBase64.map((p: any, idx: number) => (
                                <View key={idx} style={styles.photoBox} wrap={false}>
                                    <Image src={p.base64} style={styles.photoImg} />
                                    <Text style={styles.photoCaption}>{p.desc.toUpperCase()}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Digital Approval Boxes */}
                <View style={styles.sigRow} wrap={false}>
                    <View style={styles.digitalBox}>
                        <Text style={styles.approvalTitle}>APROVADO ELETRONICAMENTE</Text>
                        <View style={{ borderTopWidth: 0.5, borderColor: '#22c55e', marginVertical: 4 }} />
                        <Text style={styles.approvalData}>NOME: {rdo.signer_name || profile?.first_name + " " + profile?.last_name}</Text>
                        <Text style={styles.approvalData}>CARGO: RESPONSÁVEL TÉCNICO</Text>
                        <Text style={styles.approvalData}>EMAIL: {profile?.email || "N/A"}</Text>
                        <Text style={styles.approvalData}>DATA: {timestamp}</Text>
                        {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.sigImg} />}
                    </View>
                    
                    <View style={[styles.digitalBox, { borderColor: '#cbd5e1', backgroundColor: '#f8fafc' }]}>
                        <Text style={[styles.approvalTitle, { color: '#64748b' }]}>FISCALIZAÇÃO / CLIENTE</Text>
                        <View style={{ borderTopWidth: 0.5, borderColor: '#cbd5e1', marginVertical: 4 }} />
                        <Text style={[styles.approvalData, { color: '#64748b' }]}>ASSINADO POR: {obra?.dono_cliente || "FISCALIZAÇÃO"}</Text>
                        <Text style={[styles.approvalData, { color: '#64748b' }]}>STATUS: VALIDADO NO CAMPO</Text>
                        <Text style={[styles.approvalData, { color: '#64748b' }]}>DATA: {timestamp}</Text>
                        {clientSigBase64 && <Image src={clientSigBase64} style={styles.sigImg} />}
                    </View>
                </View>

                <Text 
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages} | Documento Gerado em ${timestamp} | MEURDO.COM.BR`}
                />
            </Page>
        </Document>
    );
};