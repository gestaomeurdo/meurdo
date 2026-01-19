import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

// Logo Padrão "Meu RDO" em Base64 para evitar erros de CORS (Versão simplificada para o código)
const LOGO_PADRAO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD3ElEQVR4nO2bz2sTQRSAX8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE+T/8A80eXfL0NAnVAAAAABJRU5ErkJggg==";

const colors = {
  primary: '#066abc',
  secondary: '#ff9f1c',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  danger: '#ef4444',
  highlight: '#f8fafc',
};

const styles = StyleSheet.create({
  page: {
    padding: 35,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    color: colors.text,
    fontSize: 9,
  },
  titleContainer: {
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary,
    paddingBottom: 5,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerGrid: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  headerLeft: {
    flex: 1.5,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 10,
  },
  headerRight: {
    flex: 1,
    paddingLeft: 5,
  },
  logo: {
    height: 40,
    width: 100,
    objectFit: 'contain',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.textLight,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  dataValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  rdoInfo: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 6,
    color: '#ffffff',
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rdoNumber: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  rdoDate: {
    fontSize: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase',
    backgroundColor: colors.highlight,
    padding: 5,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
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
    backgroundColor: colors.primary,
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
  activityRow: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
  },
  progressTag: {
    width: 35,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textAlign: 'right',
    marginRight: 10,
  },
  occurrenceBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 8,
    borderRadius: 4,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 4,
    padding: 3,
    marginBottom: 5,
  },
  photo: {
    width: '100%',
    height: 90,
    objectFit: 'cover',
    borderRadius: 2,
  },
  photoCaption: {
    fontSize: 6,
    color: colors.textLight,
    marginTop: 3,
    textAlign: 'center',
    height: 15,
  },
  signatureArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 40,
  },
  signatureBox: {
    flex: 1,
    alignItems: 'center',
  },
  signatureImg: {
    height: 45,
    width: 110,
    objectFit: 'contain',
  },
  sigLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    marginTop: 2,
    marginBottom: 4,
  },
  sigText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  sigSubtext: {
    fontSize: 7,
    color: colors.textLight,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 7,
    color: colors.textLight,
  }
});

interface RdoPdfTemplateProps {
  rdo: DiarioObra;
  obraNome: string;
  profile: Profile | null;
  obra?: Obra;
  sequenceNumber?: string;
  logoBase64: string | null;
  photosBase64: { desc: string; base64: string | null }[];
  responsibleSigBase64: string | null;
  clientSigBase64: string | null;
}

export const RdoPdfTemplate = ({ 
    rdo, 
    obraNome, 
    profile, 
    obra,
    sequenceNumber,
    logoBase64,
    photosBase64,
    responsibleSigBase64,
    clientSigBase64
}: RdoPdfTemplateProps) => {

  const dateStr = format(new Date(rdo.data_rdo + 'T12:00:00'), "dd/MM/yyyy");
  const dayStr = format(new Date(rdo.data_rdo + 'T12:00:00'), "EEEE", { locale: ptBR });

  return (
    <Document title={`RDO ${sequenceNumber} - ${obraNome}`}>
      <Page size="A4" style={styles.page}>
        
        {/* TÍTULO PRINCIPAL */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Relatório Diário de Obra</Text>
        </View>

        {/* CABEÇALHO COMPLETO */}
        <View style={styles.headerGrid}>
          <View style={styles.headerLeft}>
            {/* Logo do Cliente ou Padrão do Sistema */}
            <Image src={logoBase64 || LOGO_PADRAO_BASE64} style={styles.logo} />
            
            <Text style={styles.dataLabel}>Identificação da Obra:</Text>
            <Text style={styles.dataValue}>{obraNome.toUpperCase()}</Text>
            
            <Text style={styles.dataLabel}>Localização / Endereço:</Text>
            <Text style={styles.dataValue}>{obra?.endereco || "Endereço não informado"}</Text>
            
            <Text style={styles.dataLabel}>Proprietário / Cliente:</Text>
            <Text style={styles.dataValue}>{obra?.dono_cliente || "Não informado"}</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.dataLabel}>Executora / Construtora:</Text>
            <Text style={styles.dataValue}>{profile?.company_name || "N/A"}</Text>
            {profile?.cnpj && <Text style={{fontSize: 8, marginBottom: 5}}>CNPJ: {profile.cnpj}</Text>}
            
            <Text style={styles.dataLabel}>Responsável Técnico:</Text>
            <Text style={styles.dataValue}>{obra?.responsavel_tecnico || "N/A"}</Text>
            
            <Text style={styles.dataLabel}>Período de Execução:</Text>
            <Text style={styles.dataValue}>{rdo.periodo || "Integral"}</Text>
          </View>
        </View>

        {/* BADGE DE IDENTIFICAÇÃO DO RDO */}
        <View style={styles.rdoInfo}>
          <Text style={styles.rdoNumber}>SEQUENCIAL: nº {sequenceNumber || '01'}</Text>
          <Text style={styles.rdoDate}>{dateStr} ({dayStr.toUpperCase()})</Text>
          <Text style={{fontSize: 10, fontFamily: 'Helvetica-Bold'}}>STATUS: {rdo.status_dia?.toUpperCase() || 'OPERACIONAL'}</Text>
        </View>

        {/* CONDIÇÕES CLIMÁTICAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condições de Campo</Text>
          <View style={{flexDirection: 'row', gap: 15}}>
             <View style={{flex: 1}}>
                <Text style={styles.dataLabel}>Clima / Tempo:</Text>
                <Text style={styles.dataValue}>{rdo.clima_condicoes || "N/A"}</Text>
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.dataLabel}>Efetivo Total:</Text>
                <Text style={styles.dataValue}>{rdo.rdo_mao_de_obra?.reduce((sum, m) => sum + m.quantidade, 0) || 0} Colaboradores</Text>
             </View>
          </View>
        </View>

        {/* ATIVIDADES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços Executados e Evolução</Text>
          {rdo.rdo_atividades_detalhe && rdo.rdo_atividades_detalhe.length > 0 ? (
            rdo.rdo_atividades_detalhe.map((item, i) => (
              <View key={i} style={styles.activityRow}>
                <Text style={styles.progressTag}>{item.avanco_percentual}%</Text>
                <View style={{flex: 1}}>
                  <Text style={{fontFamily: 'Helvetica-Bold'}}>{item.descricao_servico}</Text>
                  {item.observacao && <Text style={{fontSize: 7, color: colors.textLight, marginTop: 1}}>{item.observacao}</Text>}
                </View>
              </View>
            ))
          ) : (
            <Text style={{fontSize: 8, color: colors.textLight}}>Nenhum serviço registrado neste dia.</Text>
          )}
        </View>

        {/* MÃO DE OBRA TABELA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Efetivo por Função</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Função / Atividade</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'center' }]}>Contratação</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'center' }]}>Qtd.</Text>
            </View>
            {rdo.rdo_mao_de_obra?.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3, fontFamily: 'Helvetica-Bold' }]}>{item.funcao}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'center' }]}>{item.tipo || 'Própria'}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{item.quantidade}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* OCORRÊNCIAS */}
        {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações e Ocorrências Técnicas</Text>
            <View style={styles.occurrenceBox}>
              {rdo.impedimentos_comentarios && (
                <View style={{ marginBottom: 5 }}>
                  <Text style={[styles.dataLabel, { color: colors.danger }]}>IMPEDIMENTOS:</Text>
                  <Text style={{fontSize: 8}}>{rdo.impedimentos_comentarios}</Text>
                </View>
              )}
              {rdo.observacoes_gerais && (
                <View>
                  <Text style={styles.dataLabel}>NOTAS GERAIS:</Text>
                  <Text style={{fontSize: 8}}>{rdo.observacoes_gerais}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* GALERIA DE FOTOS (GRID REFORÇADO) */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Evidências Fotográficas</Text>
          <View style={styles.photosGrid}>
            {photosBase64.length > 0 ? (
              photosBase64.map((photo, index) => (
                <View key={index} style={styles.photoCard}>
                  {photo.base64 ? (
                    <Image src={photo.base64} style={styles.photo} />
                  ) : (
                    <View style={[styles.photo, {backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center'}]}>
                       <Text style={{fontSize: 6}}>FOTO INDISPONÍVEL</Text>
                    </View>
                  )}
                  <Text style={styles.photoCaption} numberOfLines={2}>
                    {photo.desc || `Registro de campo #${index + 1}`}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{fontSize: 8, fontStyle: 'italic'}}>Nenhum registro fotográfico anexado.</Text>
            )}
          </View>
        </View>

        {/* ASSINATURAS */}
        <View style={styles.signatureArea} wrap={false}>
          <View style={styles.signatureBox}>
            {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.signatureImg} />}
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Responsável Técnico</Text>
            <Text style={styles.sigSubtext}>{(rdo as any).signer_name || profile?.first_name}</Text>
          </View>
          
          <View style={styles.signatureBox}>
            {clientSigBase64 && <Image src={clientSigBase64} style={styles.signatureImg} />}
            <View style={styles.sigLine} />
            <Text style={styles.sigText}>Fiscalização / Cliente</Text>
            <Text style={styles.sigSubtext}>Visto Eletrônico</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Documento gerado eletronicamente pela plataforma Meu RDO - Gestão Digital de Obras.
        </Text>

      </Page>
    </Document>
  );
};