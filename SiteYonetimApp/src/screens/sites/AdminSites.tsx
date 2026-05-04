import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Home,
  MoreVertical,
  Check,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { siteService, Site, CreateSiteRequest, UpdateSiteRequest } from '../../services/site.service';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

const AdminSites = () => {
  const { user, switchSite } = useAuth();
  const { t } = useI18n();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState(1);
  const [switching, setSwitching] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateSiteRequest>({
    name: '',
    address: '',
    city: '',
    country: 'Türkiye',
    currency: 'TRY',
    timezone: 'Europe/Istanbul',
  });

  useEffect(() => {
    loadSites();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadSites = async () => {
    try {
      const data = await siteService.getSites();
      setSites(data);
    } catch (error) {
      console.error('Load sites error:', error);
      Alert.alert(t('common.error'), t('adminSites.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.city) {
      Alert.alert(t('common.error'), t('adminSites.fillRequired'));
      return;
    }

    try {
      await siteService.createSite(formData);
      Alert.alert(t('common.success'), t('adminSites.createSuccess'));
      resetCreateModal();
      loadSites();
    } catch (error) {
      console.error('Create site error:', error);
      Alert.alert(t('common.error'), t('adminSites.createError'));
    }
  };

  const handleUpdate = async () => {
    if (!editingSite) return;

    try {
      await siteService.updateSite(editingSite.id, {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country,
      });
      Alert.alert(t('common.success'), t('adminSites.updateSuccess'));
      setEditingSite(null);
      loadSites();
    } catch (error) {
      console.error('Update site error:', error);
      Alert.alert(t('common.error'), t('adminSites.updateError'));
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      t('adminSites.deleteSite'),
      t('adminSites.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await siteService.deleteSite(id);
              Alert.alert(t('common.success'), t('adminSites.deleteSuccess'));
              loadSites();
            } catch (error) {
              Alert.alert(t('common.error'), t('adminSites.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handleSwitchSite = async (site: Site) => {
    try {
      setSwitching(true);
      await switchSite(site.id, site.name);
      Alert.alert(
        t('adminSites.siteChanged'),
        t('adminSites.siteChangedMessage', { siteName: site.name }),
        [{ text: t('common.confirm') }]
      );
      setShowActionMenu(null);
    } catch (error) {
      console.error('Switch site error:', error);
      Alert.alert(t('common.error'), t('adminSites.switchError'));
    } finally {
      setSwitching(false);
    }
  };

  const resetCreateModal = () => {
    setShowAddModal(false);
    setCreateStep(1);
    setFormData({
      name: '',
      address: '',
      city: '',
      country: 'Türkiye',
      currency: 'TRY',
      timezone: 'Europe/Istanbul',
    });
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      address: site.address,
      city: site.city,
      country: site.country || 'Türkiye',
    });
  };

  const totalStats = {
    apartments: sites.reduce((a, b) => a + b.totalApartments, 0),
    residents: sites.reduce((a, b) => a + b.totalResidents, 0),
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('adminSites.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {sites.length} {t('adminSites.site')} • {totalStats.apartments} {t('adminSites.apartment')} • {totalStats.residents} {t('adminSites.resident')}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Building2 size={20} color={colors.primary} style={{ marginBottom: 4 }} />
            <Text style={styles.statValue}>{sites.length}</Text>
            <Text style={styles.statLabel}>{t('adminSites.site')}</Text>
          </View>
          <View style={styles.statCard}>
            <Home size={20} color={colors.success} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValue, { color: colors.success }]}>{totalStats.apartments}</Text>
            <Text style={styles.statLabel}>{t('adminSites.apartment')}</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color={colors.info} style={{ marginBottom: 4 }} />
            <Text style={[styles.statValue, { color: colors.info }]}>{totalStats.residents}</Text>
            <Text style={styles.statLabel}>{t('adminSites.resident')}</Text>
          </View>
        </View>

        {/* Sites List */}
        <View style={styles.sitesList}>
          {sites.map(site => {
            const isCurrentSite = user?.siteId === site.id;
            return (
              <View
                key={site.id}
                style={[
                  styles.siteCard,
                  isCurrentSite && styles.siteCardActive
                ]}
              >
                <View style={styles.siteHeader}>
                  <View style={[
                    styles.siteIcon,
                    isCurrentSite && styles.siteIconActive
                  ]}>
                    <Building2 size={24} color={isCurrentSite ? colors.white : colors.primary} />
                  </View>
                  <View style={styles.siteInfo}>
                    <View style={styles.siteNameRow}>
                      <Text style={styles.siteName}>{site.name}</Text>
                      {isCurrentSite && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>{t('adminSites.active')}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.siteLocation}>
                      <MapPin size={12} color={colors.textSecondary} />
                      <Text style={styles.siteLocationText}>{site.city}</Text>
                    </View>
                    <View style={styles.siteStats}>
                      <View style={styles.siteStatItem}>
                        <Home size={12} color={colors.textSecondary} />
                        <Text style={styles.siteStatText}>{site.totalApartments} {t('adminSites.apartment')}</Text>
                      </View>
                      <View style={styles.siteStatItem}>
                        <Users size={12} color={colors.textSecondary} />
                        <Text style={styles.siteStatText}>{site.totalResidents} {t('adminSites.resident')}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    style={styles.menuButton}
                    onPress={() => setShowActionMenu(showActionMenu === site.id ? null : site.id)}
                  >
                    <MoreVertical size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {/* Action Menu */}
                {showActionMenu === site.id && (
                  <View style={styles.actionMenu}>
                    {!isCurrentSite && (
                      <>
                        <Pressable 
                          style={styles.actionMenuItem}
                          onPress={() => handleSwitchSite(site)}
                          disabled={switching}
                        >
                          <Check size={16} color={colors.textPrimary} />
                          <Text style={styles.actionMenuText}>
                            {switching ? t('adminSites.switching') : t('adminSites.switchToSite')}
                          </Text>
                        </Pressable>
                        <View style={styles.actionMenuDivider} />
                      </>
                    )}
                    <Pressable
                      style={styles.actionMenuItem}
                      onPress={() => {
                        openEditModal(site);
                        setShowActionMenu(null);
                      }}
                    >
                      <Edit size={16} color={colors.textPrimary} />
                      <Text style={styles.actionMenuText}>{t('common.edit')}</Text>
                    </Pressable>
                    <View style={styles.actionMenuDivider} />
                    <Pressable
                      style={styles.actionMenuItem}
                      onPress={() => {
                        handleDelete(site.id);
                        setShowActionMenu(null);
                      }}
                    >
                      <Trash2 size={16} color={colors.error} />
                      <Text style={[styles.actionMenuText, { color: colors.error }]}>{t('common.delete')}</Text>
                    </Pressable>
                  </View>
                )}

                {!isCurrentSite && (
                  <Pressable 
                    style={styles.switchButton}
                    onPress={() => handleSwitchSite(site)}
                    disabled={switching}
                  >
                    <Text style={styles.switchButtonText}>
                      {switching ? t('adminSites.switching') : t('adminSites.switchToSite')}
                    </Text>
                    <ChevronRight size={16} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {/* Add Button */}
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>{t('adminSites.addNewSite')}</Text>
        </Pressable>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={resetCreateModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {createStep === 1 ? t('adminSites.siteInfo') : t('adminSites.addResident')}
              </Text>
              <View style={styles.stepIndicator}>
                <View style={[styles.stepDot, createStep >= 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, createStep >= 2 && styles.stepDotActive]} />
              </View>
              <Pressable onPress={resetCreateModal}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {createStep === 1 ? (
                <View style={styles.formContainer}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('adminSites.siteName')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('adminSites.siteNamePlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('adminSites.address')}</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={t('adminSites.addressPlaceholder')}
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
                      value={formData.address}
                      onChangeText={(text) => setFormData({ ...formData, address: text })}
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>{t('adminSites.city')}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={t('adminSites.cityPlaceholder')}
                        placeholderTextColor={colors.textSecondary}
                        value={formData.city}
                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                      />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>{t('adminSites.country')}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={t('adminSites.countryPlaceholder')}
                        placeholderTextColor={colors.textSecondary}
                        value={formData.country}
                        onChangeText={(text) => setFormData({ ...formData, country: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>{t('adminSites.currency')}</Text>
                      <View style={styles.selectButton}>
                        <Text style={styles.selectButtonText}>{formData.currency}</Text>
                      </View>
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                      <Text style={styles.label}>{t('adminSites.timezone')}</Text>
                      <View style={styles.selectButton}>
                        <Text style={styles.selectButtonText}>{t('adminSites.istanbul')}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  <Text style={styles.infoText}>
                    {t('adminSites.residentInviteInfo')}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              {createStep === 2 && (
                <Pressable
                  style={styles.backButton}
                  onPress={() => setCreateStep(1)}
                >
                  <ChevronLeft size={16} color={colors.textPrimary} />
                  <Text style={styles.backButtonText}>{t('common.back')}</Text>
                </Pressable>
              )}
              {createStep === 1 ? (
                <Pressable
                  style={[styles.submitButton, { flex: 1 }]}
                  onPress={() => setCreateStep(2)}
                  disabled={!formData.name || !formData.city}
                >
                  <Text style={styles.submitButtonText}>{t('common.next')}</Text>
                  <ChevronRight size={16} color={colors.white} />
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.submitButton, { flex: 1 }]}
                  onPress={handleCreate}
                >
                  <Building2 size={16} color={colors.white} />
                  <Text style={styles.submitButtonText}>{t('adminSites.createSite')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editingSite} transparent animationType="slide" onRequestClose={() => setEditingSite(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('adminSites.editSite')}</Text>
              <Pressable onPress={() => setEditingSite(null)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('adminSites.siteName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('adminSites.siteName')}
                    placeholderTextColor={colors.textSecondary}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('adminSites.address')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder={t('adminSites.addressPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('adminSites.city')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('adminSites.city')}
                      placeholderTextColor={colors.textSecondary}
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('adminSites.country')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('adminSites.country')}
                      placeholderTextColor={colors.textSecondary}
                      value={formData.country}
                      onChangeText={(text) => setFormData({ ...formData, country: text })}
                    />
                  </View>
                </View>

                <Pressable style={styles.submitButton} onPress={handleUpdate}>
                  <Text style={styles.submitButtonText}>{t('common.save')}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  header: { backgroundColor: colors.primaryLight, borderRadius: borderRadius.cardLg, padding: spacing.lg, marginBottom: spacing.lg },
  headerTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 4 },
  statsContainer: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: borderRadius.card, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.primary },
  statLabel: { fontSize: fontSize.cardMeta, color: colors.textSecondary, marginTop: 4 },
  sitesList: { gap: spacing.md, marginBottom: spacing.lg },
  siteCard: { backgroundColor: colors.white, borderRadius: borderRadius.cardLg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  siteCardActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' },
  siteHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  siteIcon: { width: 48, height: 48, borderRadius: borderRadius.card, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  siteIconActive: { backgroundColor: colors.primary },
  siteInfo: { flex: 1 },
  siteNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  siteName: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  activeBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  activeBadgeText: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.white },
  siteLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  siteLocationText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  siteStats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  siteStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  siteStatText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  menuButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  actionMenu: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  actionMenuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  actionMenuText: { fontSize: fontSize.cardSubtitle, color: colors.textPrimary },
  actionMenuDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  switchButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md, paddingVertical: spacing.md, borderRadius: borderRadius.button, backgroundColor: colors.primaryLight },
  switchButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.primary },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  addButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.primary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  stepIndicator: { flexDirection: 'row', gap: 4, position: 'absolute', left: 0, right: 0, justifyContent: 'center', top: spacing.xl },
  stepDot: { width: 8, height: 8, borderRadius: borderRadius.full, backgroundColor: colors.gray300 },
  stepDotActive: { backgroundColor: colors.primary },
  modalScroll: { maxHeight: 400 },
  formContainer: { padding: spacing.xl },
  formGroup: { marginBottom: spacing.lg },
  formRow: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, padding: spacing.md, fontSize: fontSize.inputText, color: colors.textPrimary },
  textArea: { height: 80, textAlignVertical: 'top' },
  selectButton: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, padding: spacing.md },
  selectButtonText: { fontSize: fontSize.inputText, color: colors.textPrimary },
  infoText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl },
  modalFooter: { flexDirection: 'row', gap: spacing.md, padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, borderRadius: borderRadius.button, backgroundColor: colors.gray100 },
  backButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, borderRadius: borderRadius.button },
  submitButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
});

export default AdminSites;
