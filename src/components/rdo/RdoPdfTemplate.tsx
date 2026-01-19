import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { DiarioObra } from "@/hooks/use-rdo";
import { Profile } from "@/hooks/use-profile";
import { Obra } from "@/hooks/use-obras";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const LOGO_PADRAO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD3ElEQVR4nO2bz2sTQRSAX8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE8SDePNo9SAIerByE+T/8A80eXfL0NAnVAAAAABJRU5ErkJggg==";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#066abc',
    paddingBottom: 10,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  headerInfo: {
    flex: 1,
    textAlign: 'right',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#066abc',
    marginBottom: 2,
  },
  
  // Identificação
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  label: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
  },

  // Dash KPIs
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#066abc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 7,
    color: '#e2e8f0',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },

  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#066abc',
    textTransform: 'uppercase',
    backgroundColor: '#f1f5f9',
    padding: 6,
    marginBottom: 8,
    borderRadius: 4,
  },

  // Listagem com Notas
  itemRow: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNote: {
    fontSize: 7,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
    marginLeft: 40, // Alinha com o texto da descrição
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#cbd5e1',
  },

  // Tabelas
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 5,
    minHeight: 20,
  },

  // Grid de Fotos
  gallerySection: { marginTop: 10 },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    gap: 8 
  },
  photoCard: {
    width: '31.5%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    padding: 2,
  },
  image: {
    width: '100%',
    height: 100, 
    objectFit: 'cover',
    backgroundColor: '#f1f5f9',
  },
  caption: {
    fontSize: 7,
    padding: 4,
    color: '#64748b',
    textAlign: 'center',
    height: 25,
  },

  // Alertas (Amarelo)
  alertBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  signatureGrid: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 50,
  },
  signatureLine: {
    flex: 1,
    alignItems: 'center',
  },
  sigImage: { height: 40, width: 100, objectFit: 'contain', marginBottom: 5 },
  line: { width: '100%', borderTopWidth: 1, borderTopColor: '#cbd5e1', marginBottom: 4 },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 5,
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
  const totalEquipe = rdo.rdo_mao_de_obra?.reduce((sum, m) => sum + m.quantidade, 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Image src={logoBase64 || LOGO_PADRAO_BASE64} style={styles.logo} />
          <View style={styles.headerInfo}>
            <Text style={styles.title}>DIÁRIO DE OBRA</Text>
            <Text style={{ fontSize: 9, color: '#64748b' }}>Relatório nº {sequenceNumber || '01'}</Text>
          </View>
        </View>

        {/* IDENTIFICAÇÃO */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Obra</Text>
            <Text style={styles.value}>{obraNome.toUpperCase()}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Localização</Text>
            <Text style={styles.value}>{obra?.endereco || "N/A"}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Construtora</Text>
            <Text style={styles.value}>{profile?.company_name || "N/A"}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Responsável Técnico</Text>
            <Text style={styles.value}>{obra?.responsavel_tecnico || "N/A"}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.summaryRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Data do Registro</Text>
            <Text style={styles.kpiValue}>{dateStr}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#f97316' }]}>
            <Text style={styles.kpiLabel}>Clima / Tempo</Text>
            <Text style={styles.kpiValue}>{rdo.clima_condicoes || 'Sol'}</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.kpiLabel}>Efetivo Total</Text>
            <Text style={styles.kpiValue}>{totalEquipe} Colab.</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#334155' }]}>
            <Text style={styles.kpiLabel}>Status do Dia</Text>
            <Text style={styles.kpiValue}>{rdo.status_dia?.split(': ')[1] || 'Operacional'}</Text>
          </View>
        </View>

        {/* OCORRÊNCIAS (HIGHLIGHT) */}
        {(rdo.impedimentos_comentarios || rdo.observacoes_gerais) && (
            <View style={styles.section} wrap={false}>
                <Text style={[styles.sectionTitle, { backgroundColor: '#fffbeb', color: '#92400e' }]}>Ocorrências e Observações Gerais</Text>
                <View style={styles.alertBox}>
                    {rdo.impedimentos_comentarios && (
                        <View style={{ marginBottom: 6 }}>
                            <Text style={styles.alertTitle}>Impedimentos:</Text>
                            <Text style={{ fontSize: 8 }}>{rdo.impedimentos_comentarios}</Text>
                        </View>
                    )}
                    {rdo.observacoes_gerais && (
                        <View>
                            <Text style={styles.alertTitle}>Notas Gerais:</Text>
                            <Text style={{ fontSize: 8 }}>{rdo.observacoes_gerais}</Text>
                        </View>
                    )}
                </View>
            </View>
        )}

        {/* ATIVIDADES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços Executados</Text>
          {rdo.rdo_atividades_detalhe && rdo.rdo_atividades_detalhe.length > 0 ? (
            rdo.rdo_atividades_detalhe.map((atv, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemMain}>
                    <Text style={[styles.progress, { width: 40 }]}>{atv.avanco_percentual}%</Text>
                    <Text style={{ fontFamily: 'Helvetica-Bold', flex: 1 }}>{atv.descricao_servico}</Text>
                </View>
                {atv.observacao && <Text style={styles.itemNote}>{atv.observacao}</Text>}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 8, color: '#94a3b8' }}>Nenhuma atividade registrada.</Text>
          )}
        </View>

        {/* EQUIPE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mão de Obra</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ flex: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Função</Text>
              <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>Qtd.</Text>
              <Text style={{ flex: 1.5, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>Tipo</Text>
            </View>
            {rdo.rdo_mao_de_obra?.map((m, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={{ flex: 3, fontSize: 8 }}>{m.funcao}</Text>
                <Text style={{ flex: 1, fontSize: 8, textAlign: 'center' }}>{m.quantidade}</Text>
                <Text style={{ flex: 1.5, fontSize: 8, textAlign: 'right', color: '#64748b' }}>{m.tipo}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* EQUIPAMENTOS */}
        {rdo.rdo_equipamentos && rdo.rdo_equipamentos.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Equipamentos / Ferramentas</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={{ flex: 3, fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Máquina</Text>
                        <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>H. Trab</Text>
                        <Text style={{ flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>H. Par.</Text>
                    </View>
                    {rdo.rdo_equipamentos.map((e, i) => (
                        <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                            <View style={[styles.tableRow, { borderBottomWidth: 0 }]} wrap={false}>
                                <Text style={{ flex: 3, fontSize: 8 }}>{e.equipamento}</Text>
                                <Text style={{ flex: 1, fontSize: 8, textAlign: 'center' }}>{e.horas_trabalhadas}h</Text>
                                <Text style={{ flex: 1, fontSize: 8, textAlign: 'center' }}>{e.horas_paradas}h</Text>
                            </View>
                            {(e as any).observacao && (
                                <Text style={{ fontSize: 7, color: '#64748b', padding: '0 5 5 5', fontStyle: 'italic' }}>
                                    Nota: {(e as any).observacao}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        )}

        {/* REGISTRO FOTOGRÁFICO */}
        {photosBase64.length > 0 && (
            <View style={styles.gallerySection}>
                <Text style={styles.sectionTitle}>Anexos e Registros ({photosBase64.length} imagens)</Text>
                <View style={styles.grid}>
                    {photosBase64.map((photo, index) => (
                    <View key={index} style={styles.photoCard} wrap={false}>
                        <Image src={photo.base64 || LOGO_PADRAO_BASE64} style={styles.image} />
                        <Text style={styles.caption} numberOfLines={2}>
                            {photo.desc || `Registro #${index + 1}`}
                        </Text>
                    </View>
                    ))}
                </View>
            </View>
        )}

        {/* ASSINATURAS */}
        <View style={styles.signatureGrid} wrap={false}>
          <View style={styles.signatureLine}>
            {responsibleSigBase64 && <Image src={responsibleSigBase64} style={styles.sigImage} />}
            <View style={styles.line} />
            <Text style={styles.sigName}>Responsável Técnico</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>{(rdo as any).signer_name || profile?.first_name}</Text>
          </View>
          <View style={styles.signatureLine}>
            {clientSigBase64 && <Image src={clientSigBase64} style={styles.sigImage} />}
            <View style={styles.line} />
            <Text style={styles.sigName}>Fiscalização / Cliente</Text>
            <Text style={{ fontSize: 7, color: '#64748b' }}>Visto Eletrônico</Text>
          </View>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
            `Meu RDO | Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} | Página ${pageNumber} de ${totalPages}`
        )} fixed />

      </Page>
    </Document>
  );
};