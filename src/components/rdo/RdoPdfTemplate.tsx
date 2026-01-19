import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Paleta de Cores e Estilos ---
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
  // --- Header ---
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%',
  },
  logo: {
    height: 40,
    maxWidth: 100,
    objectFit: 'contain',
  },
  headerCenter: {
    alignItems: 'center',
    width: '40%',
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
  headerRight: {
    alignItems: 'flex-end',
    width: '30%',
  },
  dateBox: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  dayText: {
    fontSize: 9,
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  // --- Sub-Header (Compliance) ---
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  complianceText: {
    fontSize: 8,
    color: colors.textLight,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  // --- Dashboard Summary Cards ---
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
    borderColor: '#e5e7eb', // Soft border instead of shadow
  },
  cardLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: colors.textLight,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  cardValueBig: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  // --- Tables ---
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
  twoColContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  col: {
    flex: 1,
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
  // --- Activities ---
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 6,
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
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  activitySub: {
    fontSize: 8,
    color: colors.textLight,
    fontStyle: 'italic',
    marginTop: 1,
  },
  activityStatus: {
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginLeft: 8,
    fontFamily: 'Helvetica-Bold',
  },
  // --- Occurrences ---
  occurrenceBox: {
    backgroundColor: colors.warningBg,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fed7aa', // Light orange border
    marginBottom: 10,
  },
  occurrenceText: {
    fontSize: 9,
    color: '#9a3412', // Dark orange text
    lineHeight: 1.4,
  },
  // --- Photos ---
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  photoCard: {
    width: '32%', // 3 per row roughly
    backgroundColor: colors.card,
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  photoCaption: {
    marginTop: 4,
    fontSize: 7,
    color: colors.textLight,
    textAlign: 'center',
    maxLines: 2,
  },
  // --- Footer ---
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 15,
  },
  signatureBox: {
    flex: 1,
    height: 70,
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
  },
  signatureText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: colors.text,
  },
  footerMeta: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  metaText: {
    fontSize: 7,
    color: '#9ca3af',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  }
});

interface RdoPdfTemplateProps {
  rdo: DiarioObra;
  obraNome: string;
  profile: Profile | null;
  obra?: Obra; // Added obra to access address/start_date
}

const DEFAULT_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

export const RdoPdfTemplate = ({ rdo, obraNome, profile, obra }: RdoPdfTemplateProps) => {
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const logoUrl = (isPro && obra?.foto_url) ? obra.foto_url : ((isPro && profile?.avatar_url) ? profile.avatar_url : DEFAULT_LOGO);
  
  // Dates and Formatting
  let dateFormatted = 'Data inválida';
  let dayOfWeek = '';
  try {
    const dateObj = new Date(rdo.data_rdo + 'T12:00:00');
    dateFormatted = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    dayOfWeek = format(dateObj, "EEEE", { locale: ptBR });
  } catch (e) {}

  // Totals Calculation
  const totalManpower = rdo.rdo_mao_de_obra?.reduce((acc, curr) => acc + curr.quantidade, 0) || 0;
  const totalEquipment = rdo.rdo_equipamentos?.length || 0;
  
  // Progress Calculation (Visual Only)
  let progressPercent = 0;
  let deadlineLabel = "Prazo Indefinido";
  if (obra?.data_inicio && obra?.previsao_entrega) {
    const start = new Date(obra.data_inicio);
    const end = new Date(obra.previsao_entrega);
    const now = new Date(rdo.data_rdo); // Calculate based on RDO date context
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(now, start);
    if (totalDays > 0) {
      progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      deadlineLabel = `${elapsedDays}/${totalDays} dias corridos`;
    }
  }

  // Safety Status
  const isZeroAccidents = !rdo.work_stopped && rdo.hours_lost === 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* 1. Header (Identidade) */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Image src={logoUrl} style={styles.logo} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>RDO #{rdo.id.slice(0, 4).toUpperCase()}</Text>
            <Text style={styles.headerSubTitle}>RELATÓRIO DIÁRIO DE OBRA</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>{dateFormatted}</Text>
              <Text style={styles.dayText}>{dayOfWeek}</Text>
            </View>
          </View>
        </View>

        {/* Sub-Header Compliance Data */}
        <View style={styles.complianceRow}>
          <Text style={styles.complianceText}>
            EMPREENDIMENTO: <Text style={styles.bold}>{obraNome.toUpperCase()}</Text>
          </Text>
          <Text style={styles.complianceText}>
            RESP. TÉCNICO: <Text style={styles.bold}>{(rdo as any).signer_name || (rdo as any).responsavel || 'N/A'}</Text>
          </Text>
          <Text style={styles.complianceText}>
            ART / RRT: <Text style={styles.bold}>{(rdo as any).signer_registration || '___________'}</Text>
          </Text>
        </View>

        {/* 2. Dashboard Summary Cards */}
        <View style={styles.dashboardRow}>
          
          {/* Card 1: Clima */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Condições Climáticas</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 4}}>
               <Text style={{fontSize: 8}}>{rdo.clima_condicoes || 'Não Informado'}</Text>
            </View>
            <View style={{marginTop: 6, alignSelf: 'flex-start'}}>
                <Text style={[
                    styles.statusBadge, 
                    { 
                        backgroundColor: rdo.status_dia === 'Operacional' ? colors.successBg : colors.dangerBg,
                        color: rdo.status_dia === 'Operacional' ? colors.success : colors.danger
                    }
                ]}>
                    {rdo.status_dia === 'Operacional' ? 'PRATICÁVEL' : 'IMPRATICÁVEL'}
                </Text>
            </View>
          </View>

          {/* Card 2: Efetivo */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Efetivo</Text>
            <View style={styles.cardContentRow}>
               <Text style={styles.cardValueBig}>{totalManpower}</Text>
               <Text style={{fontSize: 8, color: colors.textLight}}>Colaboradores</Text>
            </View>
          </View>

          {/* Card 3: Prazos */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Cronograma Físico</Text>
            <Text style={{fontSize: 8, marginBottom: 2}}>{deadlineLabel}</Text>
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={{fontSize: 7, color: colors.textLight, marginTop: 2, textAlign: 'right'}}>{progressPercent.toFixed(0)}% Decorrido</Text>
          </View>

          {/* Card 4: Segurança */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Segurança do Trabalho</Text>
            <View style={{ alignItems: 'center', marginTop: 4 }}>
                <Text style={[
                    styles.statusBadge, 
                    { 
                        backgroundColor: isZeroAccidents ? colors.successBg : colors.dangerBg,
                        color: isZeroAccidents ? colors.success : colors.danger,
                        fontSize: 8,
                        paddingVertical: 4
                    }
                ]}>
                    {isZeroAccidents ? 'ZERO ACIDENTES' : 'COM OCORRÊNCIA'}
                </Text>
            </View>
          </View>

        </View>

        {/* 3. Corpo Técnico (Tabelas Lado a Lado) */}
        <View style={styles.twoColContainer}>
            
            {/* Manpower Table */}
            <View style={styles.col}>
                <Text style={styles.sectionTitle}>Mão de Obra</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Função</Text>
                        <Text style={styles.tableHeaderCell}>Qtd</Text>
                        <Text style={[styles.tableHeaderCell, {textAlign: 'right'}]}>Tipo</Text>
                    </View>
                    {rdo.rdo_mao_de_obra?.map((item, index) => (
                        <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? colors.card : colors.zebra }]}>
                            <Text style={[styles.tableCell, { flex: 3 }]}>{item.funcao}</Text>
                            <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{item.quantidade}</Text>
                            <Text style={[styles.tableCell, { textAlign: 'right', fontSize: 7, color: colors.textLight }]}>{item.tipo}</Text>
                        </View>
                    ))}
                    {!rdo.rdo_mao_de_obra?.length && (
                        <View style={styles.tableRow}><Text style={styles.tableCell}>--</Text></View>
                    )}
                </View>
            </View>

            {/* Equipment Table */}
            <View style={styles.col}>
                <Text style={styles.sectionTitle}>Equipamentos</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descrição</Text>
                        <Text style={styles.tableHeaderCell}>Trab</Text>
                        <Text style={styles.tableHeaderCell}>Par</Text>
                    </View>
                    {rdo.rdo_equipamentos?.map((item, index) => (
                        <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? colors.card : colors.zebra }]}>
                            <Text style={[styles.tableCell, { flex: 3 }]}>{item.equipamento}</Text>
                            <Text style={styles.tableCell}>{item.horas_trabalhadas}h</Text>
                            <Text style={styles.tableCell}>{item.horas_paradas}h</Text>
                        </View>
                    ))}
                    {!rdo.rdo_equipamentos?.length && (
                        <View style={styles.tableRow}><Text style={styles.tableCell}>--</Text></View>
                    )}
                </View>
            </View>
        </View>

        {/* 4. Atividades e Ocorrências */}
        <View style={{ marginTop: 5 }}>
            <Text style={styles.sectionTitle}>Atividades Executadas</Text>
            <View style={{ paddingLeft: 4 }}>
                {rdo.rdo_atividades_detalhe?.map((item, index) => (
                    <View key={index} style={styles.activityRow} wrap={false}>
                        <View style={styles.bullet} />
                        <View style={styles.activityContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={styles.activityText}>{item.descricao_servico}</Text>
                                <Text style={[
                                    styles.activityStatus,
                                    { backgroundColor: item.avanco_percentual === 100 ? colors.successBg : '#e0f2fe', color: item.avanco_percentual === 100 ? colors.success : colors.primary }
                                ]}>
                                    {item.avanco_percentual === 100 ? 'CONCLUÍDO' : `${item.avanco_percentual}%`}
                                </Text>
                            </View>
                            {item.observacao && <Text style={styles.activitySub}>Obs: {item.observacao}</Text>}
                        </View>
                    </View>
                ))}
                {!rdo.rdo_atividades_detalhe?.length && <Text style={{fontSize: 9, color: colors.textLight, fontStyle: 'italic'}}>Nenhuma atividade registrada.</Text>}
            </View>
        </View>

        {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
            <View style={{ marginTop: 10 }} wrap={false}>
                <Text style={styles.sectionTitle}>Ocorrências e Observações</Text>
                <View style={styles.occurrenceBox}>
                    {rdo.impedimentos_comentarios && (
                        <Text style={styles.occurrenceText}>
                            <Text style={{fontFamily: 'Helvetica-Bold'}}>IMPEDIMENTOS: </Text>
                            {rdo.impedimentos_comentarios}
                        </Text>
                    )}
                    {rdo.observacoes_gerais && (
                        <Text style={[styles.occurrenceText, { marginTop: rdo.impedimentos_comentarios ? 4 : 0, color: colors.text }]}>
                            <Text style={{fontFamily: 'Helvetica-Bold'}}>GERAL: </Text>
                            {rdo.observacoes_gerais}
                        </Text>
                    )}
                </View>
            </View>
        )}

        {/* 5. Registro Fotográfico (3 Col Grid) */}
        <View style={{ marginTop: 10 }} break>
            <Text style={styles.sectionTitle}>Registro Fotográfico</Text>
            <View style={styles.photoGrid}>
                {rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map((item, index) => (
                    <View key={index} style={styles.photoCard} wrap={false}>
                        <Image src={item.foto_anexo_url!} style={styles.photoImage} />
                        <Text style={styles.photoCaption}>{item.descricao_servico}</Text>
                    </View>
                ))}
                {isPro && rdo.safety_photo_url && (
                    <View style={styles.photoCard} wrap={false}>
                        <Image src={rdo.safety_photo_url} style={styles.photoImage} />
                        <Text style={styles.photoCaption}>Registro de Segurança</Text>
                    </View>
                )}
            </View>
            {(!rdo.rdo_atividades_detalhe?.some(a => a.foto_anexo_url) && !rdo.safety_photo_url) && (
                <Text style={{fontSize: 9, color: colors.textLight, fontStyle: 'italic', padding: 10}}>Sem registros fotográficos.</Text>
            )}
        </View>

        {/* 6. Validação (Footer) */}
        <View style={styles.footerContainer} wrap={false}>
            <View style={styles.signatureBox}>
                {rdo.responsible_signature_url ? (
                    <Image src={rdo.responsible_signature_url} style={styles.signatureImg} />
                ) : null}
                <View style={styles.signatureLine} />
                <Text style={styles.signatureText}>RESPONSÁVEL TÉCNICO</Text>
                <Text style={{fontSize: 6, color: colors.textLight}}>{(rdo as any).signer_name}</Text>
            </View>

            <View style={styles.signatureBox}>
                {rdo.client_signature_url ? (
                    <Image src={rdo.client_signature_url} style={styles.signatureImg} />
                ) : null}
                <View style={styles.signatureLine} />
                <Text style={styles.signatureText}>FISCALIZAÇÃO / CLIENTE</Text>
            </View>
        </View>

        {/* Page Footer Meta */}
        <View style={styles.footerMeta} fixed>
            <Text style={styles.metaText}>Gerado via Meu RDO - Tecnologia para Engenharia</Text>
            <Text style={styles.metaText} render={({ pageNumber, totalPages }) => (
                `Página ${pageNumber} de ${totalPages}`
            )} />
        </View>

      </Page>
    </Document>
  );
};