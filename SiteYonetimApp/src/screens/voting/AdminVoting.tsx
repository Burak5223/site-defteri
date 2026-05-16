import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Plus, X, Calendar, Users } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { votingService, Voting } from '../../services/voting.service';
import { useAuth } from '../../context/AuthContext';

const AdminVoting = ({ navigation }: any) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [votings, setVotings] = useState<Voting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '', '']);
  const [startDate] = useState(new Date().toISOString());
  const [endDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

  useEffect(() => {
    loadVotings();
  }, [user?.siteId]); // Site değiştiğinde yeniden yükle

  const loadVotings = async () => {
    if (!user?.siteId) return;
    
    try {
      const data = await votingService.getVotings(user.siteId);
      setVotings(data);
    } catch (error) {
      console.error('Load votings error:', error);
      Alert.alert('Hata', 'Oylamalar yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVotings();
  };

  const handleCreate = async () => {
    if (!title || !description) {
      Alert.alert('Hata', 'Lütfen başlık ve açıklama girin');
      return;
    }

    const validOptions = options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) {
      Alert.alert('Hata', 'En az 2 seçenek girmelisiniz');
      return;
    }

    try {
      await votingService.createVoting({
        title,
        description,
        startDate,
        endDate,
        options: validOptions,
      }, user?.siteId || '1');
      Alert.alert('Başarılı', 'Oylama oluşturuldu');
      setShowCreateModal(false);
      resetForm();
      loadVotings();
    } catch (error) {
      console.error('Create voting error:', error);
      Alert.alert('Hata', 'Oylama oluşturulamadı');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOptions(['', '', '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: colors.successLight, text: colors.successDark, label: 'Devam Ediyor' };
      case 'ended': return { bg: colors.gray200, text: colors.textSecondary, label: 'Sona Erdi' };
      case 'upcoming': return { bg: colors.primaryLight, text: colors.primary, label: 'Yakında' };
      default: return { bg: colors.gray200, text: colors.textSecondary, label: status };
    }
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
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>E-Oylama</Text>
            <Text style={styles.headerSubtitle}>{votings.length} aktif oylama</Text>
          </View>
          <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
            <Plus size={20} color={colors.white} />
            <Text style={styles.createButtonText}>Oylama Oluştur</Text>
          </Pressable>
        </View>

        <View style={styles.votingsList}>
          {votings.map(voting => {
            const statusInfo = getStatusColor(voting.status);
            return (
              <Pressable
                key={voting.id}
                style={styles.votingCard}
                onPress={() => navigation.navigate('Voting', { votingId: voting.id })}
              >
                <View style={styles.votingHeader}>
                  <Text style={styles.votingTitle}>{voting.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.text }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.votingDescription} numberOfLines={2}>
                  {voting.description}
                </Text>
                <View style={styles.votingFooter}>
                  <View style={styles.votingMeta}>
                    <Users size={16} color={colors.textSecondary} />
                    <Text style={styles.votingMetaText}>{voting.totalVotes} oy</Text>
                  </View>
                  <View style={styles.votingMeta}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={styles.votingMetaText}>
                      {new Date(voting.endDate).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Oylama Oluştur</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Başlık</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Oylama başlığı"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Açıklama</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Oylama açıklaması"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Seçenekler</Text>
                {options.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <TextInput
                      style={[styles.input, styles.optionInput]}
                      value={option}
                      onChangeText={(value) => updateOption(index, value)}
                      placeholder={`Seçenek ${index + 1}`}
                      placeholderTextColor={colors.textSecondary}
                    />
                    {options.length > 2 && (
                      <Pressable style={styles.removeButton} onPress={() => removeOption(index)}>
                        <X size={20} color={colors.error} />
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable style={styles.addOptionButton} onPress={addOption}>
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.addOptionText}>Seçenek Ekle</Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelButton} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </Pressable>
              <Pressable style={styles.submitButton} onPress={handleCreate}>
                <Text style={styles.submitButtonText}>Oluştur</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 4 },
  createButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.button },
  createButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  votingsList: { gap: spacing.md },
  votingCard: { backgroundColor: colors.background, borderRadius: borderRadius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  votingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  votingTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  statusBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: borderRadius.pill },
  statusText: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold },
  votingDescription: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginBottom: spacing.md },
  votingFooter: { flexDirection: 'row', gap: spacing.lg },
  votingMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  votingMetaText: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalScroll: { padding: spacing.xl },
  formGroup: { marginBottom: spacing.xl },
  label: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.input, padding: spacing.md, fontSize: fontSize.inputText, color: colors.textPrimary },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  optionInput: { flex: 1 },
  removeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.icon, backgroundColor: colors.errorLight },
  addOptionButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  addOptionText: { fontSize: fontSize.cardSubtitle, color: colors.primary, fontWeight: fontWeight.medium },
  modalFooter: { flexDirection: 'row', gap: spacing.md, padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border },
  cancelButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.gray100, alignItems: 'center' },
  cancelButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  submitButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.primary, alignItems: 'center' },
  submitButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
});

export default AdminVoting;



