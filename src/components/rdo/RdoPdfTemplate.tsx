import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";

const LOGO_MEU_RDO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABICAYAAACVv6umAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAYySURBVHgB7Z27bhNREIaf9S6WIEghIUFBIREpEiV8AD4EBR8AH4APQUVFCiokKiooUFAhQYIUCV0iRSBIEBAsvD67OfZ4xmdv7869tndm978ay57Z2fE5Z/ZcZuIkiYKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCQv6E03A6DufhvAsX4HIYzsD1MJyD62FIsE2YfTfMv0uXfAun4BqcgePDfA6uhWET7F9C6Mh4Hk7DbeD5NpwfhtNwHdgG/7mHj8H7LlwD8C5cg6fA9zicH4bzI/0yAofmXTiE88NwCO9n4SzwzN934G8+Gq4X8uAwnAKeBf6X34eE6v0onAd75OOf5XfH8729v/zXG+H0u7AHz0C79mO6n/fPInA9LidBvX4E798G9uI/6uO9eIeFfM7fM3D82H/s8B9/p9fD0Fm78h/v4eM5YPuB93+f78E7/P3HevFv629C/YFm7A/+P569/B92+U8In7H9/jve+2e635j2G47P8P6f8f5v4PwL3B52eRfaP88m2L8O3oU2P8PeZfAtpNuBdnY9z97p8R/CunS70C7O/7BveNizn7Bv6vY3wfpwH4Yl3Ae26Vp6/O/v9DzsH7fBfmB7+FfX/fX6m+D5z/C4H9j8vTfC1vV9eO496Xag3UvX9XU39X3G7L9o98vXp/vR76L16X6P8Xqff6frv/D9X+vXv+l+9Psv76D/oPvU76P10X3u72Xf/w/r1//U9xmz/x7v93r3z/X5u/T89U+6D+89Nqf7fT+uX3/G/f1v/N/7f7z7O+L19vefb/vHdfCfr6/v86e96/z7vL9L9+Fz8K6n9X3S++79v3f/8H6vX9+eN77vT79f9X1H77uX7396Xv3e6fU39PnTXnr9vXf9vUfvk/57/Xf9r+8vve72Pv930vvzX6/87nX/0ue8P88G3ofnO39DfX5X1+1v6L96f86HfcE7POxZ2Iez8A7tD98O0n+F/+JpOD8O79L1f4m9/Of8PUP3S++F97uXnre/u9M/+r3Wv/qf9pM9DmfhcRhOwdVfGJWv4Rhcl8MzYm9fC1Mfxv7L8A+fC1Mfmv6W9uOf0Oa6PzD9T99v6XOf7/890+8Yuj/eY3v9Y/v98f7qfUfXv+nr0vv73y8v//X6vP4X/6Zun/vT6/K7fH36v79/vI/Xp/vR76L96D9pP+S6Mvsv6Bf9r/S6/B/fX/73/pP2999/L93H95f+P68/+H3pX74e+X8Xf0H3i37H73+9Lv/H9xf9r98v+t/uP/ofvy99X/8XFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFP67AQC777f/YwG0VwAAAABJRU5ErkJggg==";

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 8, color: '#1e293b' },
  
  // Brand Header
  brandBar: { height: 35, backgroundColor: '#066abc', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 15, borderRadius: 2 },
  brandTitle: { color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },

  // Info Section
  mainHeader: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  identBlock: { flex: 1.5, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  identLogo: { height: 40, marginBottom: 10, objectFit: 'contain' },
  identRow: { flexDirection: 'row', marginBottom: 4 },
  identLabel: { width: 70, color: '#64748b', fontSize: 6, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  identValue: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#0f172a' },

  // Deadline Widget
  deadlineCard: { flex: 1, backgroundColor: '#ffffff', borderStyle: 'solid', borderLeftWidth: 3, borderLeftColor: '#066abc', borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  deadlineHead: { backgroundColor: '#f0f7ff', padding: 6, alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  deadlineTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#066abc' },
  deadlineBody: { padding: 6 },
  deadlineRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  deadlineLabel: { fontSize: 5, color: '#64748b', textTransform: 'uppercase' },
  deadlineValue: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  statusBadge: { padding: '2 8', borderRadius: 10, fontSize: 6, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 4 },

  // Tables "SaaS Style"
  tableSection: { marginBottom: 15 },
  tableHeader: { backgroundColor: '#066abc', color: '#ffffff', flexDirection: 'row', padding: '5 10', borderRadius: 2 },
  tableHeaderText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: '6 10', borderBottomWidth: 1, borderStyle: 'solid', borderColor: '#f1f5f9' },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: '#f8fafc' },

  // Resource Grid
  resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  resourceCard: { width: '23.8%', padding: 8, backgroundColor: '#f8fafc', borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, alignItems: 'center' },
  resourceName: { fontSize: 6, color: '#64748b', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase' },
  resourceVal: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#066abc' },

  // Activity Status Badges
  badgeConcluido: { backgroundColor: '#dcfce7', color: '#166534', padding: '2 6', borderRadius: 4, fontSize: 6, fontFamily: 'Helvetica-Bold' },
  badgeAndamento: { backgroundColor: '#f1f5f9', color: '#64748b', padding: '2 6', borderRadius: 4, fontSize: 6, fontFamily: 'Helvetica-Bold' },

  // Observations with User Stamp
  obsContainer: { padding: 12, backgroundColor: '#f0f7ff', borderLeftWidth: 3, borderLeftColor: '#066abc', borderRadius: 2, marginTop: 10 },
  obsStamp: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#066abc', marginBottom: 4, textTransform: 'uppercase' },
  obsText: { fontSize: 8, color: '#334155', lineHeight: 1.4 },

  // Photos Modern Grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
  photoItem: { width: '48.5%', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: 200, objectFit: 'cover' },
  photoCaption: { backgroundColor: '#334155', color: '#ffffff', fontSize: 6, padding: '4 8', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  // Digital Signatures
  sigSection: { flexDirection: 'row', gap: 15, marginTop: 30 },
  sigBox: { flex: 1, padding: 10, backgroundColor: '#f0fdf4', borderStyle: 'solid', borderWidth: 1, borderColor: '#bcf0da', borderRadius: 4 },
  sigStatus: { color: '#166534', fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 6, textAlign: 'center' },
  sigText: { fontSize: 6, color: '#166534', marginBottom: 2 },
  sigImage: { height: 35, objectFit: 'contain', marginVertical: 5, opacity: 0.8 },

  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, borderTopWidth: 1, borderColor: '#066abc', paddingTop: 10, textAlign: 'center' },
  footerText: { fontSize: 6, color: '#64748b' },
  footerBrand: { fontSize: 7, color: '#066abc', fontFamily: 'Helvetica-Bold' }
});

const TableHeader = ({ title, columns }: any) => (
  <View style={styles.tableHeader}>
    {columns.map((col: any, i: number) => (
      <Text key={i} style={[styles.tableHeaderText, { flex: col.flex || 1, textAlign: col.align || 'left' }]}>
        {col.label}
      </Text>
    ))}
  </View>
);

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
                {/* 1. TOP BRAND BAR */}
                <View style={styles.brandBar}>
                    <Text style={styles.brandTitle}>Relatório Diário de Obra (RDO)</Text>
                </View>

                {/* 2. HEADER: IDENT & DEADLINE */}
                <View style={styles.mainHeader}>
                    <View style={styles.identBlock}>
                        <Image src={logoBase64 || LOGO_MEU_RDO_B64} style={styles.identLogo} />
                        <View style={styles.identRow}><Text style={styles.identLabel}>Obra:</Text><Text style={styles.identValue}>{obraNome.toUpperCase()}</Text></View>
                        <View style={styles.identRow}><Text style={styles.identLabel}>Localização:</Text><Text style={[styles.identValue, { fontSize: 7 }]}>{obra?.endereco || "Local não informado"}</Text></View>
                        <View style={styles.identRow}><Text style={styles.identLabel}>Contratante:</Text><Text style={styles.identValue}>{obra?.dono_cliente || "N/A"}</Text></View>
                        <View style={styles.identRow}><Text style={styles.identLabel}>Responsável:</Text><Text style={styles.identValue}>{rdo.signer_name || `${profile?.first_name} ${profile?.last_name}`}</Text></View>
                    </View>

                    <View style={styles.deadlineCard}>
                        <View style={styles.deadlineHead}><Text style={styles.deadlineTitle}>CONTROLE DE PRAZOS</Text></View>
                        <View style={styles.deadlineBody}>
                            <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>RDO Nº:</Text><Text style={styles.deadlineValue}>{sequenceNumber}</Text></View>
                            <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>Data:</Text><Text style={styles.deadlineValue}>{format(parseISO(rdo.data_rdo), "dd/MM/yy")}</Text></View>
                            <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>Dia:</Text><Text style={[styles.deadlineValue, { color: '#066abc' }]}>{dayOfWeek.toUpperCase()}</Text></View>
                            
                            {contractStats?.hasDeadline && (
                                <View style={{ marginTop: 5, borderTopWidth: 0.5, borderColor: '#e2e8f0', paddingTop: 5 }}>
                                    <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>Dias Totais:</Text><Text style={styles.deadlineValue}>{contractStats.total}</Text></View>
                                    <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>Decorridos:</Text><Text style={styles.deadlineValue}>{contractStats.elapsed}</Text></View>
                                    <View style={styles.deadlineRow}><Text style={styles.deadlineLabel}>A Vencer:</Text><Text style={styles.deadlineValue}>{contractStats.remaining}</Text></View>
                                    <Text style={[styles.statusBadge, { backgroundColor: contractStats.isDelayed ? '#fee2e2' : '#dcfce7', color: contractStats.isDelayed ? '#991b1b' : '#166534' }]}>
                                        {contractStats.isDelayed ? "CRONOGRAMA ATRASADO" : "STATUS: NO PRAZO"}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* 3. CLIMATE SECTION */}
                <View style={styles.tableSection}>
                    <TableHeader columns={[{ label: 'PERÍODO', flex: 1 }, { label: 'TEMPO / CLIMA', flex: 2 }, { label: 'CONDIÇÃO DE TRABALHO', flex: 2, align: 'center' }]} />
                    {climaParts.slice(0, 2).map((data, i) => {
                        const isNT = !data || data.includes("N/T");
                        const label = i === 0 ? "MANHÃ" : "TARDE";
                        const match = !isNT ? data.match(/: (.*?) \((.*?)\)/) : null;
                        const cond = match ? (match[2] === "Op" ? "PRATICÁVEL" : "NÃO PRATICÁVEL") : "N/T";
                        return (
                            <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                                <Text style={{ flex: 1, fontFamily: 'Helvetica-Bold' }}>{label}</Text>
                                <Text style={{ flex: 2 }}>{match ? match[1].toUpperCase() : "N/T"}</Text>
                                <Text style={{ flex: 2, textAlign: 'center', fontFamily: 'Helvetica-Bold', color: cond === 'PRATICÁVEL' ? '#166534' : '#991b1b' }}>{cond}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* 4. RESOURCES (GRID CARDS) */}
                <View style={styles.tableSection}>
                    <Text style={[styles.tableHeaderText, { color: '#066abc', marginBottom: 5 }]}>Mão de Obra e Efetivo em Campo</Text>
                    <View style={styles.resourceGrid}>
                        {rdo.rdo_mao_de_obra?.map((m: any, i: number) => (
                            <View key={i} style={styles.resourceCard}>
                                <Text style={styles.resourceName}>{m.funcao}</Text>
                                <Text style={styles.resourceVal}>{m.quantidade}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 5. ACTIVITIES TABLE (ZEBRA) */}
                <View style={styles.tableSection}>
                    <TableHeader columns={[{ label: 'DESCRIÇÃO DOS SERVIÇOS EXECUTADOS', flex: 6 }, { label: 'AVANÇO / STATUS', flex: 2, align: 'right' }]} />
                    {rdo.rdo_atividades_detalhe?.map((atv: any, i: number) => (
                        <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                            <Text style={{ flex: 6 }}>{atv.descricao_servico}</Text>
                            <View style={{ flex: 2, alignItems: 'flex-end' }}>
                                <Text style={atv.avanco_percentual === 100 ? styles.badgeConcluido : styles.badgeAndamento}>
                                    {atv.avanco_percentual === 100 ? "CONCLUÍDO" : `EM DIA (${atv.avanco_percentual}%)`}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 6. OBSERVATIONS */}
                {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
                    <View style={styles.obsContainer}>
                        <Text style={styles.obsStamp}>Registro Oficial: {profile?.first_name || "Usuário"} em {timestamp}</Text>
                        <Text style={styles.obsText}>
                            {rdo.impedimentos_comentarios || ""} {rdo.observacoes_gerais || ""}
                        </Text>
                    </View>
                )}

                {/* 7. PHOTOS GRID */}
                {photosBase64 && photosBase64.length > 0 && (
                    <View style={{ marginTop: 20 }} break>
                        <Text style={[styles.tableHeaderText, { color: '#066abc', marginBottom: 10 }]}>Relatório Fotográfico</Text>
                        <View style={styles.photoGrid}>
                            {photosBase64.map((p: any, idx: number) => (
                                <View key={idx} style={styles.photoItem} wrap={false}>
                                    <Image src={p.base64} style={styles.photoImg} />
                                    <Text style={styles.photoCaption}>{p.desc.toUpperCase()}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 8. DIGITAL APPROVAL */}
                <View style={styles.sigSection} wrap={false}>
                    <View style={styles.sigBox}>
                        <Text style={styles.sigStatus}>✓ APROVADO ELETRONICAMENTE</Text>
                        <Text style={styles.sigText}>NOME: {rdo.signer_name || `${profile?.first_name} ${profile?.last_name}`}</Text>
                        <Text style={styles.sigText}>EMAIL: {profile?.email || "N/A"}</Text>
                        <Text style={styles.sigText}>VALIDAÇÃO: {timestamp}</Text>
                        {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.sigImage} />}
                    </View>
                    <View style={[styles.sigBox, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}>
                        <Text style={[styles.sigStatus, { color: '#64748b' }]}>FISCALIZAÇÃO / CLIENTE</Text>
                        <Text style={[styles.sigText, { color: '#64748b' }]}>ASSINADO POR: {obra?.dono_cliente || "FISCALIZAÇÃO"}</Text>
                        <Text style={[styles.sigText, { color: '#64748b' }]}>DATA: {timestamp}</Text>
                        {clientSigBase64 && <Image src={clientSigBase64} style={styles.sigImage} />}
                    </View>
                </View>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Gerado digitalmente via plataforma <Text style={styles.footerBrand}>Meu RDO</Text></Text>
                </View>
            </Page>
        </Document>
    );
};