import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

const colors = {
  primary: '#066abc',
  secondary: '#ff9f1c',
  background: '#ffffff',
  card: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  danger: '#ef4444',
  highlight: '#f1f5f9',
  tableHeader: '#066abc',
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: colors.text,
    fontSize: 9,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 10,
  },
  brandArea: {
    width: '60%',
  },
  logo: {
    height: 45,
    marginBottom: 5,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  companyDetails: {
    fontSize: 8,
    color: colors.textLight,
  },
  rdoBadge: {
    width: '35%',
    alignItems: 'flex-end',
  },
  rdoNumber: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  rdoDate: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  rdoDay: {
    fontSize: 8,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  infoBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    paddingLeft: 6,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    paddingVertical: 4,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeader,
    padding: 5,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 5,
  },
  tableCell: {
    fontSize: 8,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  progressBox: {
    width: 40,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  progressText: {
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  fullWidthBox: {
    width: '100%',
    backgroundColor: colors.highlight,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  blockText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  // ESTILOS DO GRID DE FOTOS (Solicitados)
  galleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  photoBox: {
    width: '31%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 4,
    padding: 4,
  },
  photoImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    borderRadius: 2,
  },
  photoCaption: {
    fontSize: 7,
    color: '#555555',
    marginTop: 4,
    textAlign: 'center',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 40,
  },
  signatureCol: {
    flex: 1,
    alignItems: 'center',
  },
  signatureImage: {
    height: 50,
    width: 120,
    objectFit: 'contain',
    marginBottom: 5,
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.text,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  }
});

interface RdoPdfTemplateProps {
  rdo: DiarioObra;
  obraNome: string;
  profile: Profile | null;
  obra?: Obra;
  sequenceNumber?: string;
}

const DEFAULT_SYSTEM_LOGO = "https://meurdo.com.br/wp-content/uploads/2026/01/Logo-MEU-RDO-scaled.png";

export const RdoPdfTemplate = ({ rdo, obraNome, profile, obra, sequenceNumber }: RdoPdfTemplateProps) => {
  // Lógica de Fallback de Logo (Forçada)
  const logoUrl = (profile?.avatar_url && profile.avatar_url.trim().length > 0) 
    ? profile.avatar_url 
    : DEFAULT_SYSTEM_LOGO;

  let dateStr = '---';
  let dayStr = '---';
  try {
    const d = typeof rdo.data_rdo === 'string' ? new Date(rdo.data_rdo + 'T12:00:00') : rdo.data_rdo;
    if (isValid(d)) {
      dateStr = format(d, "dd/MM/yyyy");
      dayStr = format(d, "EEEE", { locale: ptBR });
    }
  } catch (e) {}

  // Consolidação de todas as fotos para o Grid
  const allPhotos = [
    ...(rdo.rdo_atividades_detalhe?.filter(a => a.foto_anexo_url).map(a => ({ url: a.foto_anexo_url!, desc: a.descricao_servico })) || []),
    { url: (rdo as any).safety_nr35_photo, desc: "Trabalho em Altura / NR-35" },
    { url: (rdo as any).safety_epi_photo, desc: "Uso de EPIs" },
    { url: (rdo as any).safety_cleaning_photo, desc: "Limpeza e Organização" },
    { url: (rdo as any).safety_dds_photo, desc: "Registro de DDS" }
  ].filter(p => p.url && p.url.trim() !== "");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO COM LOGO */}
        <View style={styles.headerRow}>
          <View style={styles.brandArea}>
            <Image src={logoUrl} style={styles.logo} />
            {profile?.company_name && <Text style={styles.companyName}>{profile.company_name}</Text>}
            {profile?.cnpj && <Text style={styles.companyDetails}>CNPJ: {profile.cnpj}</Text>}
          </View>
          <View style={styles.rdoBadge}>
            <Text style={styles.rdoNumber}>RDO nº {sequenceNumber || '00'}</Text>
            <Text style={styles.rdoDate}>{dateStr}</Text>
            <Text style={styles.rdoDay}>{dayStr}</Text>
          </View>
        </View>

        {/* BARRA DE INFO */}
        <View style={styles.infoBar}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Obra</Text>
            <Text style={styles.infoValue}>{obraNome.toUpperCase()}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Clima / Condições</Text>
            <Text style={styles.infoValue}>{rdo.clima_condicoes || 'Informação não disponível'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Status do Dia</Text>
            <Text style={[styles.infoValue, { color: rdo.status_dia?.includes('Operacional') ? colors.success : colors.danger }]}>
              {rdo.status_dia?.toUpperCase() || 'OPERACIONAL'}
            </Text>
          </View>
        </View>

        {/* MÃO DE OBRA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Efetivo e Equipe em Campo</Text>
          {rdo.rdo_mao_de_obra && rdo.rdo_mao_de_obra.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Função / Cargo</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Tipo</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Qtd.</Text>
              </View>
              {rdo.rdo_mao_de_obra.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>{item.funcao}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.tipo || 'Própria'}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{item.quantidade}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.companyDetails}>Nenhum registro de efetivo para esta data.</Text>
          )}
        </View>

        {/* EQUIPAMENTOS */}
        {rdo.rdo_equipamentos && rdo.rdo_equipamentos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Máquinas e Equipamentos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Equipamento</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>H. Trab</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>H. Paradas</Text>
              </View>
              {rdo.rdo_equipamentos.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{item.equipamento}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.horas_trabalhadas}h</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.horas_paradas}h</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ATIVIDADES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades e Evolução do Dia</Text>
          {rdo.rdo_atividades_detalhe && rdo.rdo_atividades_detalhe.length > 0 ? (
            rdo.rdo_atividades_detalhe.map((item, i) => (
              <View key={i} style={styles.activityItem} wrap={false}>
                <View style={styles.progressBox}>
                  <Text style={styles.progressText}>{item.avanco_percentual}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>{item.descricao_servico}</Text>
                  {item.observacao && <Text style={[styles.companyDetails, { marginTop: 2 }]}>{item.observacao}</Text>}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.companyDetails}>Nenhuma atividade registrada.</Text>
          )}
        </View>

        {/* MATERIAIS */}
        {rdo.rdo_materiais && rdo.rdo_materiais.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materiais e Insumos</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Insumo</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Recebido</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Consumo</Text>
              </View>
              {rdo.rdo_materiais.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{item.nome_material}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantidade_entrada || 0} {item.unidade}</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantidade_consumida || 0} {item.unidade}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* OCORRÊNCIAS */}
        {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ocorrências e Notas Gerais</Text>
            <View style={styles.fullWidthBox}>
              {rdo.impedimentos_comentarios && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={[styles.infoLabel, { color: colors.danger }]}>IMPEDIMENTOS / CRÍTICO:</Text>
                  <Text style={styles.blockText}>{rdo.impedimentos_comentarios}</Text>
                </View>
              )}
              {rdo.observacoes_gerais && (
                <View>
                  <Text style={styles.infoLabel}>OBSERVAÇÕES DO DIA:</Text>
                  <Text style={styles.blockText}>{rdo.observacoes_gerais}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* GRID DE FOTOS CORRIGIDO */}
        <View style={styles.section} wrap={false}> 
          <Text style={styles.sectionTitle}>EVIDÊNCIAS FOTOGRÁFICAS</Text>
          <View style={styles.galleryContainer}>
            {allPhotos.length > 0 ? (
              allPhotos.map((photo, index) => (
                <View key={index} style={styles.photoBox}>
                  <Image src={photo.url} style={styles.photoImage} />
                  <Text style={styles.photoCaption}>
                    {photo.desc || `Registro ${index + 1}`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{fontSize: 9, color: colors.textLight, fontStyle: 'italic'}}>Nenhuma evidência fotográfica registrada neste dia.</Text>
            )}
          </View>
        </View>

        {/* ASSINATURAS */}
        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureCol}>
            {rdo.responsible_signature_url && <Image src={rdo.responsible_signature_url} style={styles.signatureImage} />}
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Responsável Técnico</Text>
            <Text style={styles.companyDetails}>{(rdo as any).signer_name || profile?.first_name}</Text>
          </View>
          <View style={styles.signatureCol}>
            {rdo.client_signature_url && <Image src={rdo.client_signature_url} style={styles.signatureImage} />}
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Fiscalização / Cliente</Text>
          </View>
        </View>

        <Text style={{ position: 'absolute', bottom: 15, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: colors.textLight }}>
          Documento gerado pela plataforma Meu RDO - Registro Oficial de Campo
        </Text>

      </Page>
    </Document>
  );
};