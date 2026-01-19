import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 0, fontFamily: 'Helvetica' },
  
  // 1. HERO HEADER (1/3 of the page)
  heroContainer: { height: 280, position: 'relative', backgroundColor: '#1e293b', justifyContent: 'flex-end', padding: 40 },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5, objectFit: 'cover' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', opacity: 0.2 },
  heroContent: { position: 'relative', zIndex: 10 },
  
  healthSeal: { position: 'absolute', top: 40, right: 40, padding: '8 15', borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 },
  sealGreen: { backgroundColor: '#10b981' },
  sealRed: { backgroundColor: '#ef4444' },
  sealText: { color: 'white', fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },

  titleGiant: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: -1, marginBottom: 5 },
  subTitle: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  
  dateBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '10 20', borderRadius: 12, marginTop: 20, alignSelf: 'flex-start' },
  dateText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // 2. HUD DE MÉTRICAS (KPIs)
  kpiRow: { flexDirection: 'row', padding: '30 40', gap: 15 },
  kpiCard: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 20, padding: 15, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  kpiLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, fontWeight: 'bold' },
  kpiValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  kpiSub: { fontSize: 7, color: '#94a3b8', marginTop: 4 },

  // 3. PROGRESSO DAS ATIVIDADES
  section: { paddingHorizontal: 40, marginBottom: 30 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 5 },
  
  activityRow: { marginBottom: 12 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  activityName: { fontSize: 9, fontWeight: 'bold', color: '#334155' },
  activityPct: { fontSize: 9, fontWeight: 'bold', color: '#066abc' },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#066abc', borderRadius: 4 },

  // 4. TIMELINE VISUAL
  timelineContainer: { paddingHorizontal: 40, position: 'relative' },
  timelineLine: { position: 'absolute', left: 45, top: 0, bottom: 0, width: 2, backgroundColor: '#e2e8f0' },
  timelineItem: { flexDirection: 'row', marginBottom: 20, position: 'relative' },
  timelineDate: { width: 40, fontSize: 8, fontWeight: 'bold', color: '#64748b', paddingTop: 8 },
  timelineBullet: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#066abc', borderStyle: 'solid', borderWidth: 2, borderColor: 'white', marginHorizontal: 10, marginTop: 7, zIndex: 10 },
  timelineBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderStyle: 'solid', borderWidth: 1, borderColor: '#e2e8f0' },
  timelineText: { fontSize: 8, color: '#334155', lineHeight: 1.4 },

  // 5. GALERIA MOSAICO
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  galleryImgLarge: { width: '60%', height: 180, borderRadius: 12, objectFit: 'cover' },
  galleryImgSmall: { width: '38%', height: 85, borderRadius: 12, objectFit: 'cover' },
  photoLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  photoText: { color: 'white', fontSize: 6, textAlign: 'center' }
});

export const ExecutiveReportTemplate = ({ 
  rdoMetrics, obra, profile, startDate, endDate, obraPhotoBase64, activityPhotosMap 
}: any) => {
  const isDelayed = rdoMetrics.rainDays > 5;
  const periodText = `${format(parseISO(startDate), "dd MMM", { locale: ptBR })} - ${format(parseISO(endDate), "dd MMM yyyy", { locale: ptBR })}`.toUpperCase();
  
  // Selecionar as 5 fotos mais relevantes para o mosaico
  const topPhotos = Object.values(activityPhotosMap).slice(0, 5);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HERO HEADER */}
        <View style={styles.heroContainer}>
          {obraPhotoBase64 && <Image src={obraPhotoBase64} style={styles.heroBg} />}
          <View style={styles.heroOverlay} />
          
          <View style={[styles.healthSeal, isDelayed ? styles.sealRed : styles.sealGreen]}>
            <Text style={styles.sealText}>{isDelayed ? "ATENÇÃO" : "OBRA EM DIA"}</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.titleGiant}>Relatório de Performance</Text>
            <Text style={styles.subTitle}>{obra.nome} | {obra.endereco || "Localização não informada"}</Text>
            
            <View style={styles.dateBox}>
              <Text style={styles.dateText}>{periodText}</Text>
            </View>
          </View>
        </View>

        {/* HUD DE MÉTRICAS */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Avanço Físico</Text>
            <Text style={styles.kpiValue}>45%</Text>
            <Text style={styles.kpiSub}>Medição estimada</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Produtividade</Text>
            <Text style={styles.kpiValue}>{rdoMetrics.totalManpower * 8}h</Text>
            <Text style={styles.kpiSub}>Horas-Homem totais</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Clima / Impacto</Text>
            <Text style={[styles.kpiValue, rdoMetrics.rainDays > 0 ? { color: '#f97316' } : {}]}>{rdoMetrics.rainDays} Dias</Text>
            <Text style={styles.kpiSub}>Afetados por chuva</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Qualidade</Text>
            <Text style={styles.kpiValue}>{rdoMetrics.allRdos.filter((r: any) => r.status === 'approved').length}</Text>
            <Text style={styles.kpiSub}>Diários Aprovados</Text>
          </View>
        </View>

        {/* PROGRESSO DAS ATIVIDADES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progresso das Atividades</Text>
          {rdoMetrics.allRdos[0]?.rdo_atividades_detalhe?.slice(0, 4).map((atv: any, i: number) => (
            <View key={i} style={styles.activityRow}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityName}>{atv.descricao_servico}</Text>
                <Text style={styles.activityPct}>{atv.avanco_percentual}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${atv.avanco_percentual}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* TIMELINE VISUAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linha do Tempo de Ocorrências</Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineLine} />
            {rdoMetrics.occurrenceTimeline.slice(0, 4).map((item: any, i: number) => (
              <View key={i} style={styles.timelineItem}>
                <Text style={styles.timelineDate}>{format(parseISO(item.date), "dd MMM", { locale: ptBR })}</Text>
                <View style={[styles.timelineBullet, item.comments.toLowerCase().includes('chuva') ? { backgroundColor: '#f97316' } : {}]} />
                <View style={styles.timelineBox}>
                  <Text style={styles.timelineText}>{item.comments}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* GALERIA DE DESTAQUES */}
        {topPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Destaques Fotográficos</Text>
            <View style={styles.galleryGrid}>
              <Image src={topPhotos[0]} style={styles.galleryImgLarge} />
              <View style={{ width: '38%', gap: 10 }}>
                {topPhotos.slice(1, 3).map((img: any, i: number) => (
                  <Image key={i} src={img} style={styles.galleryImgSmall} />
                ))}
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};