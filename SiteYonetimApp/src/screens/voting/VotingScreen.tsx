import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import {
  Plus,
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { votingService, Voting } from '../../services/voting.service';
import { colors, spacing, borderRadius, fontSize, fontWeight, lightTheme as theme } from '../../theme';
import { useI18n } from '../../context/I18nContext';

const VotingScreen = () => {
    const { user, hasRole } = useAuth();
    const { t } = useI18n();
    const [votings, setVotings] = useState<Voting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [votingInProgress, setVotingInProgress] = useState(false);

    // Create Voting State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newOptions, setNewOptions] = useState<string[]>(['', '']);

    useEffect(() => {
        loadVotings();
    }, []);

    const loadVotings = async () => {
        try {
            setIsLoading(true);
            const siteId = user?.siteId || '1';
            console.log('Loading votings for siteId:', siteId);
            const data = await votingService.getVotingTopics(siteId);
            console.log('Votings loaded:', data);
            setVotings(data);
        } catch (error) {
            console.error('Error loading votings:', error);
            Alert.alert(t('common.error'), t('votingScreen.loadError'));
            setVotings([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadVotings();
    };

    const handleVote = async (topicId: string, optionId: string) => {
        try {
            setVotingInProgress(true);
            console.log('Cast vote request:', { votingId: topicId, optionId });
            await votingService.castVote({ votingId: topicId, optionId });
            Alert.alert(t('common.success'), t('votingScreen.voteSuccess'));
            
            // Reload votings to get updated data
            await loadVotings();
            setSelectedOption(null);
        } catch (error: any) {
            console.error('Cast vote error:', error);
            
            // Check if already voted
            if (error?.message?.includes('zaten oy kullandınız') || error?.message?.includes('already voted')) {
                Alert.alert(t('common.info'), t('votingScreen.alreadyVoted'));
            } else {
                Alert.alert(t('common.error'), t('votingScreen.voteError'));
            }
            setSelectedOption(null);
        } finally {
            setVotingInProgress(false);
        }
    };

    const handleCreateWrapper = async () => {
        try {
            if (!newTitle.trim() || !newDesc.trim()) {
                Alert.alert(t('common.error'), t('votingScreen.fillAllFields'));
                return;
            }

            const validOptions = newOptions.filter(opt => opt.trim().length > 0);
            if (validOptions.length < 2) {
                Alert.alert(t('common.error'), t('votingScreen.minTwoOptions'));
                return;
            }

            const siteId = user?.siteId || '1';
            
            // Create voting with dates (30 days from now)
            const startDate = new Date().toISOString();
            const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await votingService.createVoting({
                title: newTitle.trim(),
                description: newDesc.trim(),
                startDate,
                endDate,
                options: validOptions
            }, siteId);

            setShowCreateModal(false);
            setNewTitle('');
            setNewDesc('');
            setNewOptions(['', '']);
            Alert.alert(t('common.success'), t('votingScreen.createSuccess'));
            loadVotings();
        } catch (error) {
            console.error('Create voting error:', error);
            Alert.alert(t('common.error'), t('votingScreen.createError'));
        }
    };

    const updateOptionText = (text: string, index: number) => {
        const updated = [...newOptions];
        updated[index] = text;
        setNewOptions(updated);
    };

    const addOptionField = () => {
        setNewOptions([...newOptions, '']);
    };

    const removeOptionField = (index: number) => {
        if (newOptions.length <= 2) return;
        setNewOptions(newOptions.filter((_, i) => i !== index));
    };

    const activeCount = votings.filter(v => v.status === 'active').length;

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {/* Title and Button */}
                <View style={styles.titleRow}>
                    <View>
                        <Text style={styles.title}>{t('votingScreen.title')}</Text>
                        <Text style={styles.subtitle}>{activeCount} {t('votingScreen.activeVotings')}</Text>
                    </View>
                    {hasRole('ADMIN') && (
                        <Pressable style={styles.addButton} onPress={() => setShowCreateModal(true)}>
                            <Plus size={16} color="#ffffff" />
                            <Text style={styles.addButtonText}>{t('votingScreen.createVoting')}</Text>
                        </Pressable>
                    )}
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>{t('votingScreen.loading')}</Text>
                    </View>
                ) : votings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <BarChart3 size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>{t('votingScreen.noVotings')}</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {votings.map((topic) => (
                                <View key={topic.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={{flex: 1}}>
                                            <Text style={styles.topicTitle}>{topic.title}</Text>
                                            <Text style={styles.topicDesc}>{topic.description}</Text>
                                            
                                            <View style={styles.metaRow}>
                                                <View style={[
                                                    styles.statusBadge, 
                                                    topic.status === 'active' ? styles.statusActive : styles.statusClosed
                                                ]}>
                                                    <Text style={[
                                                        styles.statusText,
                                                        topic.status === 'active' ? styles.statusTextActive : styles.statusTextClosed
                                                    ]}>
                                                        {topic.status === 'active' ? t('votingScreen.active') : t('votingScreen.closed')}
                                                    </Text>
                                                </View>
                                                <View style={styles.statsRow}>
                                                    <Users size={14} color="#64748b" style={{ marginRight: 4 }} />
                                                    <Text style={styles.statsText}>{topic.totalVotes} {t('votingScreen.votes')}</Text>
                                                </View>
                                                <View style={styles.statsRow}>
                                                    <Clock size={14} color="#64748b" style={{ marginRight: 4 }} />
                                                    <Text style={styles.statsText}>{t('votingScreen.endDate')} {new Date(topic.endDate).toLocaleDateString('tr-TR')}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.optionsList}>
                                        {topic.options.map((option) => {
                                            const percentage = topic.totalVotes > 0 
                                                ? Math.round((option.voteCount / topic.totalVotes) * 100) 
                                                : 0;
                                            const isSelected = selectedOption === option.id;
                                            const disabled = topic.hasVoted || topic.status !== 'active';

                                            return (
                                                <TouchableOpacity
                                                    key={option.id}
                                                    style={[
                                                        styles.optionButton,
                                                        isSelected && styles.optionSelected,
                                                        disabled && styles.optionDisabled
                                                    ]}
                                                    disabled={disabled}
                                                    onPress={() => !disabled && setSelectedOption(option.id)}
                                                >
                                                    <View style={styles.optionHeader}>
                                                        <Text style={styles.optionLabel}>{option.optionText}</Text>
                                                        <Text style={styles.optionPercent}>{percentage}%</Text>
                                                    </View>
                                                    <View style={styles.progressBg}>
                                                        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                                                    </View>
                                                    <Text style={styles.voteCount}>{option.voteCount} {t('votingScreen.votes')}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {topic.status === 'active' && !topic.hasVoted && (
                                        <TouchableOpacity
                                            style={[styles.voteButton, !selectedOption && styles.voteButtonDisabled]}
                                            disabled={!selectedOption || votingInProgress}
                                            onPress={() => selectedOption && handleVote(topic.id, selectedOption)}
                                        >
                                            {votingInProgress ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 6 }} />
                                                    <Text style={styles.voteButtonText}>{t('votingScreen.vote')}</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}

                                    {topic.hasVoted && (
                                        <View style={styles.votedInfo}>
                                            <CheckCircle2 size={16} color="#16a34a" style={{ marginRight: 6 }} />
                                            <Text style={styles.votedText}>{t('votingScreen.voted')}</Text>
                                        </View>
                                    )}
                                </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Create Voting Modal */}
            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('votingScreen.createVotingTitle')}</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.formScroll}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('votingScreen.titleLabel')}</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={newTitle} 
                                    onChangeText={setNewTitle}
                                    placeholder={t('votingScreen.titlePlaceholder')}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('votingScreen.descriptionLabel')}</Text>
                                <TextInput 
                                    style={styles.input} 
                                    value={newDesc} 
                                    onChangeText={setNewDesc}
                                    placeholder={t('votingScreen.descriptionPlaceholder')}
                                    multiline
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>{t('votingScreen.optionsLabel')}</Text>
                                {newOptions.map((opt, idx) => (
                                    <View key={idx} style={styles.optionRow}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginBottom: 8 }]}
                                            value={opt}
                                            onChangeText={(t) => updateOptionText(t, idx)}
                                            placeholder={t('votingScreen.optionPlaceholder').replace('{number}', String(idx + 1))}
                                        />
                                        {newOptions.length > 2 && (
                                            <TouchableOpacity onPress={() => removeOptionField(idx)} style={styles.removeBtn}>
                                                <X size={20} color="#ef4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                                <TouchableOpacity onPress={addOptionField} style={styles.addOptionBtn}>
                                    <Plus size={16} color={theme.colors.primary} />
                                    <Text style={styles.addOptionText}>{t('votingScreen.addOption')}</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.saveButton} onPress={handleCreateWrapper}>
                            <Text style={styles.saveButtonText}>{t('votingScreen.create')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default VotingScreen;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.white,
    },
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.screenPaddingHorizontal,
        paddingVertical: spacing.screenPaddingVertical,
        paddingBottom: spacing.screenPaddingBottom,
        rowGap: 14,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: fontSize.headerTitle,
        fontWeight: fontWeight.semibold,
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: fontSize.cardSubtitle,
        color: colors.textSecondary,
        marginTop: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.rowGap,
        paddingVertical: spacing.cardPadding,
        borderRadius: borderRadius.button,
        backgroundColor: colors.primary,
    },
    addButtonText: {
        color: colors.white,
        fontSize: fontSize.buttonText,
        fontWeight: fontWeight.semibold,
        marginLeft: spacing.iconMargin,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 12,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        gap: 16,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        marginTop: 12,
        color: '#94a3b8',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    topicTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    topicDesc: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#f0fdf4',
    },
    statusClosed: {
        backgroundColor: '#f1f5f9',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '500',
    },
    statusTextActive: {
        color: '#16a34a',
    },
    statusTextClosed: {
        color: '#64748b',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsText: {
        fontSize: 12,
        color: '#64748b',
    },
    optionsList: {
        gap: 10,
    },
    optionButton: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#f8fafc',
    },
    optionSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: '#f0fdfa',
    },
    optionDisabled: {
        opacity: 0.5,
        backgroundColor: '#f1f5f9',
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    optionPercent: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    progressBg: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    voteCount: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },
    voteButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    voteButtonDisabled: {
        backgroundColor: '#cbd5e1',
        opacity: 0.7,
    },
    voteButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    votedInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        padding: 10,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
    },
    votedText: {
        color: '#16a34a',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    formScroll: {
        flex: 1,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#0f172a',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    removeBtn: {
        padding: 8,
        marginLeft: 4,
    },
    addOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 12,
        borderStyle: 'dashed',
    },
    addOptionText: {
        marginLeft: 6,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
