import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: '#333333',
    fontSize: 9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#066abc',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 50,
    width: 100, // Approximate aspect ratio
    objectFit: 'contain',
    marginRight: 10,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#066abc',
    textTransform: 'uppercase',
  },
  subHeader: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  section: {
    marginTop: 15,
    marginBottom: 5,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
    paddingRight: 10,
  },
  label: {
    fontSize: 7,
    color: '#888888',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333333',
  },
  weatherSection: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f4f7f9',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  weatherItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 2,
  },
  weatherIconText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#066abc',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#e6fffa', // Greenish light
    borderWidth: 1,
    borderColor: '#b2f5ea',
    maxWidth: 200,
  },
  statusText: {
    color: '#2c7a7b',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statusBadgeDanger: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#feb2b2',
    maxWidth: 200,
  },
  statusTextDanger: {
    color: '#c53030',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#066abc',
    marginBottom: 6,
    textTransform: 'uppercase',
    borderLeftWidth: 3,
    borderLeftColor: '#066abc',
    paddingLeft: 6,
  },
  twoColContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 15,
  },
  col: {
    flex: 1,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#066abc',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    flex: 1,
    textAlign: 'left',
    paddingLeft: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 8,
    color: '#444',
    flex: 1,
    textAlign: 'left',
    paddingLeft: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photoCard: {
    width: '48%', // 2 per row
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 4,
    backgroundColor: '#ffffff',
  },
  photo: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 2,
    backgroundColor: '#f0f0f0',
  },
  photoDesc: {
    marginTop: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique', // Italic
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    alignItems: 'center',
  },
  signatureBox: {
    alignItems: 'center',
    marginBottom: 10,
  },
  signatureImage: {
    height: 40,
    width: 100,
    objectFit: 'contain',
  },
  footerText: {
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    fontSize: 7,
    color: '#999',
  }
});

interface RdoPdfTemplateProps {
  rdo: DiarioObra;
  obraNome: string;
  profile: Profile | null;
}

const DEFAULT_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

export const RdoPdfTemplate = ({ rdo, obraNome, profile }: RdoPdfTemplateProps) => {
  const isPro = profile?.subscription_status === 'active' || profile?.plan_type === 'pro';
  const logoUrl = (isPro && profile?.avatar_url) ? profile.avatar_url : DEFAULT_LOGO;
  
  // Format Date
  let dateFormatted = 'Data inválida';
  try {
    const dateObj = new Date(rdo.data_rdo + 'T12:00:00');
    dateFormatted = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
  } catch (e) {}

  const getStatusStyle = (status: string) => {
    if (status.includes('Não Praticável')) return styles.statusBadgeDanger;
    return styles.statusBadge;
  };

  const getStatusTextStyle = (status: string) => {
    if (status.includes('Não Praticável')) return styles.statusTextDanger;
    return styles.statusText;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={logoUrl} style={styles.logo} />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>RDO - RELATÓRIO DIÁRIO DE OBRA</Text>
            <Text style={styles.subHeader}>Relatório #{rdo.id.slice(0, 4)} | Data: {dateFormatted}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Obra</Text>
            <Text style={styles.value}>{obraNome}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Responsável</Text>
            <Text style={styles.value}>{(rdo as any).responsavel || 'Não informado'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Período</Text>
            <Text style={styles.value}>{rdo.periodo}</Text>
          </View>
        </View>

        {/* Weather & Status Section */}
        <View style={styles.weatherSection}>
          <View style={styles.weatherItem}>
            <Text style={styles.label}>Clima / Condições</Text>
            <Text style={styles.weatherIconText}>{rdo.clima_condicoes || 'N/A'}</Text>
          </View>
          
          <View style={getStatusStyle(rdo.status_dia)}>
            <Text style={getStatusTextStyle(rdo.status_dia)}>{rdo.status_dia}</Text>
          </View>
        </View>

        {/* Tables Container */}
        <View style={styles.twoColContainer}>
          
          {/* Manpower */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Efetivo (Mão de Obra)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Função</Text>
                <Text style={styles.tableHeaderCell}>Qtd</Text>
                <Text style={styles.tableHeaderCell}>Tipo</Text>
              </View>
              {rdo.rdo_mao_de_obra?.map((item, index) => (
                <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.funcao}</Text>
                  <Text style={styles.tableCell}>{item.quantidade}</Text>
                  <Text style={styles.tableCell}>{item.tipo}</Text>
                </View>
              ))}
              {(!rdo.rdo_mao_de_obra || rdo.rdo_mao_de_obra.length === 0) && (
                <View style={styles.tableRow}><Text style={styles.tableCell}>Sem registros.</Text></View>
              )}
            </View>
          </View>

          {/* Equipments */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Equipamentos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Equipamento</Text>
                <Text style={styles.tableHeaderCell}>Trab (h)</Text>
                <Text style={styles.tableHeaderCell}>Par (h)</Text>
              </View>
              {rdo.rdo_equipamentos?.map((item, index) => (
                <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.equipamento}</Text>
                  <Text style={styles.tableCell}>{item.horas_trabalhadas}</Text>
                  <Text style={styles.tableCell}>{item.horas_paradas}</Text>
                </View>
              ))}
              {(!rdo.rdo_equipamentos || rdo.rdo_equipamentos.length === 0) && (
                <View style={styles.tableRow}><Text style={styles.tableCell}>Sem registros.</Text></View>
              )}
            </View>
          </View>

        </View>

        {/* Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades Realizadas</Text>
          <View style={styles.table}>
             <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Descrição do Serviço</Text>
                <Text style={styles.tableHeaderCell}>Avanço</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
              </View>
            {rdo.rdo_atividades_detalhe?.map((item, index) => {
              const isComplete = item.avanco_percentual === 100;
              return (
                <View key={index} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9', paddingVertical: 6 }]}>
                  <Text style={[styles.tableCell, { flex: 3, fontSize: 9 }]}>
                    {item.descricao_servico}
                    {item.observacao && `\nObs: ${item.observacao}`}
                  </Text>
                  <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{item.avanco_percentual}%</Text>
                  <View style={[styles.tableCell, { flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={[styles.statusDot, { backgroundColor: isComplete ? '#48bb78' : '#ecc94b' }]} />
                    <Text style={{ fontSize: 8 }}>{isComplete ? 'Concluído' : 'Em Andamento'}</Text>
                  </View>
                </View>
              );
            })}
            {(!rdo.rdo_atividades_detalhe || rdo.rdo_atividades_detalhe.length === 0) && (
                <View style={styles.tableRow}><Text style={styles.tableCell}>Nenhuma atividade registrada.</Text></View>
            )}
          </View>
        </View>

        {/* Occurrences / Observations */}
        {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações e Ocorrências</Text>
            <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#e0e0e0' }}>
              {rdo.impedimentos_comentarios && (
                <View style={{marginBottom: 5}}>
                  <Text style={[styles.label, {color: '#c53030'}]}>Impedimentos / Ocorrências:</Text>
                  <Text style={styles.value}>{rdo.impedimentos_comentarios}</Text>
                </View>
              )}
              {rdo.observacoes_gerais && (
                <View>
                  <Text style={styles.label}>Geral:</Text>
                  <Text style={styles.value}>{rdo.observacoes_gerais}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Safety (If Pro) */}
        {isPro && (rdo.safety_nr35 || rdo.safety_epi || rdo.safety_cleaning || rdo.safety_dds) && (
           <View style={styles.section}>
             <Text style={styles.sectionTitle}>Segurança do Trabalho (Checklist)</Text>
             <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: '#f0fff4', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#c6f6d5' }}>
                <Text style={{ fontSize: 8 }}>Treinamentos: {rdo.safety_nr35 ? '✅ OK' : '⚪ N/A'}</Text>
                <Text style={{ fontSize: 8 }}>EPIs: {rdo.safety_epi ? '✅ OK' : '⚪ N/A'}</Text>
                <Text style={{ fontSize: 8 }}>Limpeza: {rdo.safety_cleaning ? '✅ OK' : '⚪ N/A'}</Text>
                <Text style={{ fontSize: 8 }}>DDS: {rdo.safety_dds ? '✅ Realizado' : '⚪ N/A'}</Text>
             </View>
           </View>
        )}

        {/* Photo Report */}
        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>Relatório Fotográfico</Text>
          <View style={styles.photoGrid}>
            {rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map((item, index) => (
              <View key={index} style={styles.photoCard}>
                <Image src={item.foto_anexo_url!} style={styles.photo} />
                <Text style={styles.photoDesc}>{item.descricao_servico}</Text>
              </View>
            ))}
            {isPro && rdo.safety_photo_url && (
                <View style={styles.photoCard}>
                    <Image src={rdo.safety_photo_url} style={styles.photo} />
                    <Text style={styles.photoDesc}>Registro de Segurança / DDS</Text>
                </View>
            )}
            {rdo.rdo_materiais?.filter(m => (m as any).foto_url).map((item: any, index) => (
               <View key={`mat-${index}`} style={styles.photoCard}>
                  <Image src={item.foto_url!} style={styles.photo} />
                  <Text style={styles.photoDesc}>Material: {item.nome_material}</Text>
               </View>
            ))}
          </View>
          {(!rdo.rdo_atividades_detalhe?.some(a => a.foto_anexo_url) && !rdo.safety_photo_url) && (
             <Text style={{ fontSize: 9, color: '#999', fontStyle: 'italic', padding: 10 }}>Nenhum registro fotográfico anexado.</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} wrap={false}>
          {isPro && rdo.responsible_signature_url && (
            <View style={styles.signatureBox}>
              <Image src={rdo.responsible_signature_url} style={styles.signatureImage} />
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{(rdo as any).signer_name || 'Responsável Técnico'}</Text>
              <Text style={{ fontSize: 7, color: '#666' }}>Assinado Digitalmente</Text>
            </View>
          )}
          <Text style={styles.footerText}>Gerado via Meu RDO - Tecnologia para Engenharia</Text>
          {!isPro && <Text style={{fontSize: 7, color: '#ccc', marginTop: 2}}>Versão Gratuita</Text>}
        </View>

        <Text style={styles.pagination} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages}`
        )} fixed />

      </Page>
    </Document>
  );
};