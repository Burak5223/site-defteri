import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  TrendingUp,
  Award,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  Package,
  Wrench,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/apiClient';

interface PerformanceData {
  overallScore: number;
  metrics: PerformanceMetric[];
  sitePerformances: SitePerformance[];
  trends: TrendData[];
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: string;
}

interface SitePerformance {
  siteId: string;
  siteName: string;
  overallScore: number;
  metrics: {
    dueCollection: number;
    ticketResolution: number;
    packageDelivery: number;
    residentSatisfaction: number;
  };
  rank: number;
}

interface TrendData {
  period: string;
  score: number;
}

const SuperAdminPerformanceScreen = ({ navigation }: any) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPerformanceData();
    }, [])
  );

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading performance data...');
      
      // Try to get real data from API
      const response = await apiClient.get('/super-admin/performance') as PerformanceData;
      setPerformanceData(response);
      
    } catch (error: any) {
      console.error('❌ Failed to load performance data:', error);
      
      // Mock data for demonstration
      const mockData: PerformanceData = {
        overallScore: 4.2,
        metrics: [
          {
            id: 'due_collection',
            name: 'Aidat Tahsilat Oranı',
            value: 92.5,
            target: 95.0,
            unit: '%',
            trend: 'up',
            color: colors.success,
            icon: 'dollar-sign',
          },
          {
            id: 'ticket_resolution',
            name: 'Arıza Çözüm Oranı',
            value: 87.3,
            target: 90.0,
            unit: '%',
            trend: 'up',
            color: colors.warning,
            icon: 'wrench',
          },
          {
            id: 'package_delivery',
            name: 'Paket Teslimat Oranı',
            value: 96.8,
            target: 95.0,
            unit: '%',
            trend: 'up',
            color: colors.primary,
            icon: 'package',
          },
          {
            id: 'response_time',
            name: 'Ortalama Yanıt Süresi',
            value: 2.4,
            target: 2.0,
            unit: 'saat',
            trend: 'down',
            color: colors.error,
            icon: 'clock',
          },
        ],
        sitePerformances: [
          {
            siteId: '1',
            siteName: 'Deniz Sitesi',
            overallScore: 4.8,
            metrics: {
              dueCollection: 96.8,
              ticketResolution: 94.2,
              packageDelivery: 98.5,
              residentSatisfaction: 4.9,
            },
            rank: 1,
          },
          {
            siteId: '2',
            siteName: 'Güneş Sitesi',
            overallScore: 4.5,
            metrics: {
              dueCollection: 95.2,
              ticketResolution: 89.7,
              packageDelivery: 97.1,
              residentSatisfaction: 4.6,
            },
            rank: 2,
          },
          {
            siteId: '3',
            siteName: 'Ay Sitesi',
            overallScore: 4.2,
            metrics: {
              dueCollection: 92.1,
              ticketResolution: 85.3,
              packageDelivery: 95.8,
              residentSatisfaction: 4.3,
            },
            rank: 3,
          },
          {
            siteId: '4',
            siteName: 'Yıldız Sitesi',
            overallScore: 3.9,
            metrics: {
              dueCollection: 88.7,
              ticketResolution: 82.1,
              packageDelivery: 94.2,
              residentSatisfaction: 4.0,
            },
            rank: 4,
          },
          {
            siteId: '5',
            siteName: 'Orman Sitesi',
            overallScore: 3.6,
            metrics: {
              dueCollection: 85.3,
              ticketResolution: 78.9,
              packageDelivery: 92.7,
              residentSatisfaction: 3.8,
            },
            rank: 5,
          },
          {
            siteId: '6',
            siteName: 'Göl Sitesi',
            overallScore: 3.2,
            metrics: {
              dueCollection: 78.9,
              ticketResolution: 74.5,
              packageDelivery: 89.3,
              residentSatisfaction: 3.4,
            },
            rank: 6,
          },
        ],
        trends: [
          { period: 'Ocak', score: 3.8 },
          { period: 'Şubat', score: 4.0 },
          { period: 'Mart', score: 4.2 },
        ],
      };
      
      setPerformanceData(mockData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerformanceData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return colors.success;
    if (score >= 3.5) return colors.warning;
    return colors.error;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Mükemmel';
    if (score >= 3.5) return 'İyi';
    if (score >= 2.5) return 'Orta';
    return 'Zayıf';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingUp; // Will be rotated
      default: return TrendingUp;
    }
  };

  const getMetricIcon = (iconName: string) => {
    switch (iconName) {
      case 'dollar-sign': return CheckCircle;
      case 'wrench': return Wrench;
      case 'package': return Package;
      case 'clock': return Clock;
      default: return Target;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!performanceData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Performans verileri yüklenemedi</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <TrendingUp size={20} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Performans Analizi</Text>
            <Text style={styles.headerSubtitle}>
              Genel Skor: {performanceData.overallScore.toFixed(1)}/5.0
            </Text>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: getScoreColor(performanceData.overallScore) }]}>
            {performanceData.overallScore.toFixed(1)}
          </Text>
          <Text style={styles.scoreLabel}>
            {getScoreLabel(performanceData.overallScore)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Key Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Anahtar Metrikler</Text>
          </View>
          
          <View style={styles.metricsGrid}>
            {performanceData.metrics.map((metric) => {
              const IconComponent = getMetricIcon(metric.icon);
              const TrendIcon = getTrendIcon(metric.trend);
              const isAboveTarget = metric.value >= metric.target;
              
              return (
                <View key={metric.id} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                      <IconComponent size={18} color={metric.color} />
                    </View>
                    <View style={styles.metricTrend}>
                      <TrendIcon 
                        size={14} 
                        color={metric.trend === 'up' ? colors.success : colors.error}
                        style={metric.trend === 'down' ? { transform: [{ rotate: '180deg' }] } : {}}
                      />
                    </View>
                  </View>
                  
                  <Text style={styles.metricName}>{metric.name}</Text>
                  
                  <View style={styles.metricValues}>
                    <Text style={[styles.metricValue, { color: metric.color }]}>
                      {metric.value}{metric.unit}
                    </Text>
                    <Text style={styles.metricTarget}>
                      Hedef: {metric.target}{metric.unit}
                    </Text>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
                          backgroundColor: isAboveTarget ? colors.success : colors.warning,
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Site Rankings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Site Sıralaması</Text>
          </View>
          
          {performanceData.sitePerformances.map((site) => (
            <View key={site.siteId} style={styles.siteCard}>
              <View style={styles.siteHeader}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankEmoji}>{getRankIcon(site.rank)}</Text>
                  <Text style={styles.rankNumber}>#{site.rank}</Text>
                </View>
                
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.siteName}</Text>
                  <Text style={[styles.siteScore, { color: getScoreColor(site.overallScore) }]}>
                    {site.overallScore.toFixed(1)}/5.0 - {getScoreLabel(site.overallScore)}
                  </Text>
                </View>
                
                <View style={styles.siteActions}>
                  <Building2 size={20} color={colors.primary} />
                </View>
              </View>
              
              <View style={styles.siteMetrics}>
                <View style={styles.siteMetricItem}>
                  <Text style={styles.siteMetricLabel}>Aidat</Text>
                  <Text style={styles.siteMetricValue}>
                    {site.metrics.dueCollection.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.siteMetricItem}>
                  <Text style={styles.siteMetricLabel}>Arıza</Text>
                  <Text style={styles.siteMetricValue}>
                    {site.metrics.ticketResolution.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.siteMetricItem}>
                  <Text style={styles.siteMetricLabel}>Paket</Text>
                  <Text style={styles.siteMetricValue}>
                    {site.metrics.packageDelivery.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.siteMetricItem}>
                  <Text style={styles.siteMetricLabel}>Memnuniyet</Text>
                  <Text style={styles.siteMetricValue}>
                    {site.metrics.residentSatisfaction.toFixed(1)}/5
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Performans Öngörüleri</Text>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <CheckCircle size={18} color={colors.success} />
              <Text style={styles.insightTitle}>Güçlü Yönler</Text>
            </View>
            <Text style={styles.insightText}>
              • Paket teslimat oranı hedefin üzerinde (%96.8)
            </Text>
            <Text style={styles.insightText}>
              • Genel performans skoru artış trendinde
            </Text>
            <Text style={styles.insightText}>
              • En iyi performans gösteren site: Deniz Sitesi
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <AlertTriangle size={18} color={colors.warning} />
              <Text style={styles.insightTitle}>İyileştirme Alanları</Text>
            </View>
            <Text style={styles.insightText}>
              • Yanıt süresi hedefin üzerinde (2.4 saat)
            </Text>
            <Text style={styles.insightText}>
              • Arıza çözüm oranı hedefin altında (%87.3)
            </Text>
            <Text style={styles.insightText}>
              • Göl Sitesi performansı düşük (3.2/5.0)
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Target size={18} color={colors.primary} />
              <Text style={styles.insightTitle}>Öneriler</Text>
            </View>
            <Text style={styles.insightText}>
              • Arıza yönetimi süreçlerini gözden geçirin
            </Text>
            <Text style={styles.insightText}>
              • Düşük performanslı sitelere destek sağlayın
            </Text>
            <Text style={styles.insightText}>
              • Yanıt sürelerini iyileştirmek için otomasyon kullanın
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SuperAdminPerformanceScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
  },
  scoreLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTrend: {
    padding: 4,
  },
  metricName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metricValues: {
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  metricTarget: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  siteCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  siteScore: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  siteActions: {
    padding: spacing.sm,
  },
  siteMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  siteMetricItem: {
    alignItems: 'center',
  },
  siteMetricLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  siteMetricValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  insightCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  insightText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});