import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Wrench,
  Plus,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Settings,
  ChevronDown,
  Building,
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/apiClient';
import { lightTheme } from '../../theme';
import { useI18n } from '../../context/I18nContext';

const MaintenanceManagementScreen = () => {
  const { t } = useI18n();
  const { user, hasRole } = useAuth();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form states
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentType, setEquipmentType] = useState('Asansör');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintenancePeriod, setMaintenancePeriod] = useState('30 Gün (Aylık)');
  const [notes, setNotes] = useState('');

  const equipmentTypes = ['Asansör', 'Jeneratör', 'Yangın Söndürme', 'Hidrofor', 'Isıtma Sistemi', 'Soğutma Sistemi', 'Diğer'];
  const maintenancePeriods = ['30 Gün (Aylık)', '90 Gün (3 Aylık)', '180 Gün (6 Aylık)', '365 Gün (Yıllık)'];

  useEffect(() => {
    loadData();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadData = async () => {
    try {
      const siteId = user?.siteId || '1';
      const response: any = await apiClient.get(`/sites/${siteId}/maintenance`);
      
      // Ensure response is an array
      const dataArray = Array.isArray(response) ? response : [];
      
      // Transform API response to match UI format
      const transformedData = dataArray.map((item: any) => ({
        id: item.id,
        name: item.equipmentName,
        type: item.equipmentType,
        status: item.status || 'Yaklaşıyor',
        lastMaintenance: new Date(item.lastMaintenanceDate).toLocaleDateString('tr-TR'),
        nextMaintenance: item.nextMaintenanceDate 
          ? new Date(item.nextMaintenanceDate).toLocaleDateString('tr-TR')
          : '-',
        daysRemaining: item.nextMaintenanceDate
          ? Math.ceil((new Date(item.nextMaintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0,
        period: item.notes || `${item.maintenanceIntervalDays} günlük periyodik bakım`,
      }));
      
      setEquipment(transformedData);
    } catch (error) {
      console.error('Maintenance management data load error:', error);
      // Fallback to empty array on error
      setEquipment([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetForm = () => {
    setEquipmentName('');
    setEquipmentType('Asansör');
    setLastMaintenanceDate(new Date().toISOString().split('T')[0]);
    setMaintenancePeriod('30 Gün (Aylık)');
    setNotes('');
    setShowTypeDropdown(false);
    setShowPeriodDropdown(false);
  };

  const handleAdd = async () => {
    if (!equipmentName) {
      Alert.alert(t('common.error'), t('maintenanceManagement.fillEquipmentName'));
      return;
    }

    if (!user?.siteId) {
      Alert.alert(t('common.error'), 'Site bilgisi bulunamadı');
      return;
    }

    try {
      const siteId = user.siteId;
      
      // Convert period to days
      const periodDays = maintenancePeriod === '30 Gün (Aylık)' ? 30 
        : maintenancePeriod === '90 Gün (3 Aylık)' ? 90
        : maintenancePeriod === '180 Gün (6 Aylık)' ? 180
        : 365;
      
      await apiClient.post(`/sites/${siteId}/maintenance`, {
        equipmentName,
        equipmentType,
        lastMaintenanceDate,
        maintenanceIntervalDays: periodDays,
        notes,
      });
      
      Alert.alert(t('common.success'), t('maintenanceManagement.addSuccess'));
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Add error:', error);
      Alert.alert(t('common.error'), t('maintenanceManagement.operationFailed'));
    }
  };

  const getStatusColors = (status: string) => {
    switch (status.toLowerCase()) {
      case 'yaklaşıyor':
        return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', icon: Clock };
      case 'zamanı geldi':
        return { bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', icon: AlertCircle };
      case 'gecikmiş':
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', icon: AlertCircle };
      default:
        return { bg: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', icon: CheckCircle2 };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.siteSelector}>
          <View style={styles.siteSelectorLeft}>
            <View style={styles.siteIcon}>
              <Building size={16} color={lightTheme.colors.primary} />
            </View>
            <View>
              <Text style={styles.siteLabel}>{t('ui.siteName')}</Text>
              <Text style={styles.siteSubLabel}>{t('dashboard.admin')}</Text>
            </View>
          </View>
          <ChevronDown size={20} color="#64748b" />
        </View>
        <Pressable style={styles.settingsButton}>
          <Settings size={20} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[lightTheme.colors.primary]} />}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('maintenanceManagement.title')}</Text>
            <Text style={styles.subtitle}>{equipment.length} {t('maintenanceManagement.equipmentCount')}</Text>
          </View>
        </View>

        {/* Equipment List */}
        {equipment.length === 0 ? (
          <View style={styles.emptyState}>
            <Wrench size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>{t('maintenanceManagement.noEquipment')}</Text>
          </View>
        ) : (
          equipment.map((item) => {
            const colors = getStatusColors(item.status);
            const StatusIcon = colors.icon;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View style={[styles.iconBox, { backgroundColor: colors.bg }]}>
                      <StatusIcon size={20} color={colors.color} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardType}>{item.type}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statusText, { color: colors.color }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.dateRow}>
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>{t('maintenanceManagement.lastMaintenance')}</Text>
                      <Text style={styles.dateValue}>{item.lastMaintenance}</Text>
                    </View>
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>{t('maintenanceManagement.nextMaintenance')}</Text>
                      <Text style={styles.dateValue}>{item.nextMaintenance}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.daysText}>{item.daysRemaining} {t('maintenanceManagement.daysLater')}</Text>
                  <Text style={styles.periodText}>{item.period}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Footer Add Button - Only for Admin */}
      {hasRole('ADMIN') && (
        <View style={styles.footer}>
          <Pressable 
            style={styles.footerButton} 
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.footerButtonText}>{t('maintenanceManagement.addEquipment')}</Text>
          </Pressable>
        </View>
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('maintenanceManagement.newEquipment')}</Text>
              <Text style={styles.modalSubtitle}>{t('maintenanceManagement.newEquipmentSubtitle')}</Text>
              <Pressable style={styles.closeButton} onPress={() => { setShowAddModal(false); resetForm(); }}>
                <X size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.modalBody}
              onTouchStart={() => {
                setShowTypeDropdown(false);
                setShowPeriodDropdown(false);
              }}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('maintenanceManagement.equipmentName')}</Text>
                <TextInput
                  style={styles.input}
                  value={equipmentName}
                  onChangeText={setEquipmentName}
                  placeholder={t('maintenanceManagement.equipmentNamePlaceholder')}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('maintenanceManagement.equipmentType')}</Text>
                <Pressable 
                  style={styles.selectInput}
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  <Text style={styles.selectText}>{equipmentType}</Text>
                  <ChevronDown size={16} color="#64748b" />
                </Pressable>
                {showTypeDropdown && (
                  <View style={styles.dropdown}>
                    {equipmentTypes.map((type) => (
                      <Pressable
                        key={type}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setEquipmentType(type);
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          equipmentType === type && styles.dropdownItemTextActive
                        ]}>
                          {type}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('maintenanceManagement.lastMaintenanceDate')}</Text>
                <TextInput
                  style={styles.input}
                  value={lastMaintenanceDate}
                  onChangeText={setLastMaintenanceDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('maintenanceManagement.maintenancePeriod')}</Text>
                <Pressable 
                  style={styles.selectInput}
                  onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}
                >
                  <Text style={styles.selectText}>{maintenancePeriod}</Text>
                  <ChevronDown size={16} color="#64748b" />
                </Pressable>
                {showPeriodDropdown && (
                  <View style={styles.dropdown}>
                    {maintenancePeriods.map((period) => (
                      <Pressable
                        key={period}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setMaintenancePeriod(period);
                          setShowPeriodDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          maintenancePeriod === period && styles.dropdownItemTextActive
                        ]}>
                          {period}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('maintenanceManagement.notes')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('maintenanceManagement.maintenanceDetails')}
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => { setShowAddModal(false); resetForm(); }}
              >
                <Text style={styles.buttonSecondaryText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleAdd}
              >
                <Text style={styles.buttonPrimaryText}>{t('common.add')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  siteSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  siteSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  siteLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#020617',
  },
  siteSubLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#020617',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#020617',
    marginBottom: 2,
  },
  cardType: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020617',
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  daysText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  periodText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#020617',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020617',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#020617',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  selectText: {
    fontSize: 14,
    color: '#020617',
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#475569',
  },
  dropdownItemTextActive: {
    color: lightTheme.colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  buttonPrimary: {
    backgroundColor: lightTheme.colors.primary,
  },
  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: lightTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: lightTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MaintenanceManagementScreen;
