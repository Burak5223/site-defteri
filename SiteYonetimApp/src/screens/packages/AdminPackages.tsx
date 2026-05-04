import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Package as PackageIcon,
  Plus,
  Search,
  CheckCircle2,
  Truck,
  QrCode,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { packageService, Package } from '../../services/package.service';
import { colors, spacing, borderRadius } from '../../theme';
import { useI18n } from '../../context/I18nContext';

// Mock apartments for display purposes if backend doesn't provide them with packages
// In a real app we might fetch these or have them in a context
const mockApartments = [
    { id: '1', block: 'A', number: '1' },
    { id: '2', block: 'A', number: '2' },
    { id: '3', block: 'B', number: '5' },
    { id: '4', block: 'B', number: '6' },
];

type TabKey = 'all' | 'waiting' | 'delivered';

const PackagesScreen = () => {
    const { t } = useI18n();
    const { user, hasRole } = useAuth();
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [packages, setPackages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // UI States
    const [showAddPackage, setShowAddPackage] = useState(false);
    const [showQRGenerator, setShowQRGenerator] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
    const [deliveryPackage, setDeliveryPackage] = useState<Package | null>(null);
    
    // Form State
    const [newPackage, setNewPackage] = useState({
        recipientName: '',
        description: '',
        apartmentId: '',
    });

    useEffect(() => {
        loadPackages();
    }, [user?.siteId]); // Site değiştiğinde yeniden yükle

    // Ekrana her gelindiğinde verileri yenile
    useFocusEffect(
        useCallback(() => {
            if (user?.siteId) {
                loadPackages();
            }
        }, [user?.siteId])
    );

    const loadPackages = async () => {
        try {
            const siteId = user?.siteId || '1';
            setIsLoading(true);
            
            // Timeout ile API çağrısı
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 saniye
            );
            
            const packagesPromise = packageService.getPackages(siteId);
            
            const data = await Promise.race([packagesPromise, timeoutPromise]) as any[];
            setPackages(data);
        } catch (error: any) {
            console.error('Packages load error:', error);
            
            // Timeout veya network hatası durumunda mock data kullan
            if (error?.message?.includes('timeout') || error?.message?.includes('Network')) {
                console.log('Using mock data due to timeout/network error');
            }
            
            // Mock data fallback
            setPackages([
                { id: '1', trackingNumber: 'YK123456', courierCompany: 'Yurtiçi Kargo', apartmentId: '1', apartmentNumber: 'A-1', recipientName: 'Test', description: 'Paket', status: 'waiting', arrivalDate: '2024-02-13T10:00:00', receivedDate: '2024-02-13T10:00:00' },
                { id: '2', trackingNumber: 'MNG987654', courierCompany: 'MNG Kargo', apartmentId: '3', apartmentNumber: 'B-5', recipientName: 'Test 2', description: 'Paket 2', status: 'delivered', arrivalDate: '2024-02-12T09:00:00', deliveryDate: '2024-02-12T14:00:00', receivedDate: '2024-02-12T09:00:00' },
            ]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadPackages();
    };

    const handleAddPackage = async () => {
        if (!newPackage.recipientName || !newPackage.description || !newPackage.apartmentId) return;

        try {
            const siteId = user?.siteId || '1';
            await packageService.createPackage({ 
                recipientName: newPackage.recipientName,
                description: newPackage.description,
                apartmentId: newPackage.apartmentId,
            }, siteId);
            setShowAddPackage(false);
            setNewPackage({ recipientName: '', description: '', apartmentId: '' });
            loadPackages();
        } catch (error) {
            console.error('Create package error:', error);
            // Optimistically add for demo
            setPackages(prev => [
                { 
                    id: Math.random().toString(), 
                    trackingNumber: 'AUTO-' + Date.now(), 
                    courierCompany: 'Kargo Firması', 
                    apartmentId: newPackage.apartmentId,
                    apartmentNumber: newPackage.apartmentId,
                    recipientName: newPackage.recipientName,
                    description: newPackage.description,
                    status: 'waiting', 
                    arrivalDate: new Date().toISOString(),
                    receivedDate: new Date().toISOString()
                },
                ...prev
            ]);
            setShowAddPackage(false);
        }
    };

    const handleDeliverPackage = async () => {
        if (!deliveryPackage) return;

        try {
            await packageService.deliverPackage(deliveryPackage.id);
            setShowDeliveryConfirm(false);
            setDeliveryPackage(null);
            loadPackages();
        } catch (error) {
            console.error('Deliver package error:', error);
            // Optimistically update
            setPackages(prev => prev.map((p: any) => 
                p.id === deliveryPackage.id 
                ? { ...p, status: 'delivered', deliveryDate: new Date().toISOString() } 
                : p
            ));
            setShowDeliveryConfirm(false);
            setDeliveryPackage(null);
        }
    };

    const handleQuickDeliver = (pkg: Package) => {
        setDeliveryPackage(pkg);
        setShowDeliveryConfirm(true);
    };

    const getApartmentInfo = (pkg: any) => {
        // Backend'den gelen apartmentNumber ve blockName kullan
        if (pkg.apartmentNumber && pkg.blockName) {
            return `${pkg.blockName} - ${pkg.apartmentNumber}`;
        } else if (pkg.apartmentNumber) {
            return pkg.apartmentNumber;
        } else {
            // Fallback: apartmentId'yi kullan
            return `Daire ${pkg.apartmentId}`;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const filteredPackages = packages
        .filter((p: Package) => activeTab === 'all' || p.status === activeTab)
        .filter((p: Package) => {
            const query = searchQuery.toLowerCase();
            const tracking = (p.trackingNumber || '').toLowerCase();
            const courier = (p.courierCompany || '').toLowerCase();
            return tracking.includes(query) || courier.includes(query);
        });

    const waitingCount = packages.filter(p => p.status === 'waiting').length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>{t('packages.cargoTracking')}</Text>
                        <Text style={styles.headerSubtitle}>{waitingCount} {t('packages.waitingPackages')}</Text>
                    </View>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Search size={18} color="#94a3b8" style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder={t('packages.searchPlaceholder')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {(['all', 'waiting', 'delivered'] as TabKey[]).map((tab) => (
                        <Pressable 
                            key={tab} 
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab === 'all' ? t('common.all') : tab === 'waiting' ? t('packages.waiting') : t('packages.delivered')}
                            </Text>
                        </Pressable>
                     ))}
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView 
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                >
                    {filteredPackages.length === 0 ? (
                        <View style={styles.emptyState}>
                            <PackageIcon size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>{t('packages.noPackages')}</Text>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {filteredPackages.map((pkg: Package) => (
                                <View key={pkg.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.courierInfo}>
                                            <View style={[styles.iconBox, pkg.status === 'waiting' ? styles.iconBoxWarning : styles.iconBoxSuccess]}>
                                                {pkg.status === 'waiting' ? <Truck size={20} color="#b45309" /> : <CheckCircle2 size={20} color="#15803d" />}
                                            </View>
                                            <View>
                                                <Text style={styles.courierName}>{pkg.courierCompany}</Text>
                                                <Text style={styles.trackingNumber}>{pkg.trackingNumber}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, pkg.status === 'waiting' ? styles.statusBadgeWarning : styles.statusBadgeSuccess]}>
                                            <Text style={[styles.statusText, pkg.status === 'waiting' ? styles.statusTextWarning : styles.statusTextSuccess]}>
                                                {pkg.status === 'waiting' ? t('packages.waiting') : t('packages.delivered')}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.cardBody}>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>{t('packages.apartment')}:</Text>
                                            <Text style={styles.infoValue}>{getApartmentInfo(pkg)}</Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>{t('packages.arrival')}:</Text>
                                            <Text style={styles.infoValue}>{formatDate(pkg.arrivalDate || pkg.recordedAt)}</Text>
                                        </View>
                                        {pkg.deliveryDate && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>{t('packages.delivery')}:</Text>
                                                <Text style={styles.infoValue}>{formatDate(pkg.deliveryDate)}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {pkg.status === 'waiting' && (hasRole('ADMIN') || hasRole('SECURITY')) && (
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity 
                                                style={styles.qrButton}
                                                onPress={() => {
                                                    setSelectedPackageId(pkg.id);
                                                    setShowQRGenerator(true);
                                                }}
                                            >
                                                <QrCode size={18} color="#475569" />
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={styles.deliverButton}
                                                onPress={() => handleQuickDeliver(pkg)}
                                            >
                                                <Text style={styles.deliverButtonText}>{t('packages.quickDeliver')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Simulated QR Scanner/Generator Modals would go here if needed, keeping it simple for now */}
            
             {/* Add Package Modal */}
            <Modal visible={showAddPackage} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('packages.addPackage')}</Text>
                            <TouchableOpacity onPress={() => setShowAddPackage(false)}>
                                <Text style={styles.closeButton}>X</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('packages.recipientName')}</Text>
                            <TextInput 
                                style={styles.input} 
                                value={newPackage.recipientName} 
                                onChangeText={t => setNewPackage(p => ({...p, recipientName: t}))}
                                placeholder={t('packages.recipientPlaceholder')}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('packages.description')}</Text>
                            <TextInput 
                                style={styles.input} 
                                value={newPackage.description} 
                                onChangeText={t => setNewPackage(p => ({...p, description: t}))}
                                placeholder={t('packages.descriptionPlaceholder')}
                            />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{t('packages.apartmentId')}</Text>
                            <TextInput 
                                style={styles.input} 
                                value={newPackage.apartmentId} 
                                onChangeText={t => setNewPackage(p => ({...p, apartmentId: t}))}
                                placeholder={t('packages.apartmentIdPlaceholder')}
                                keyboardType="numeric"
                            />
                        </View>
                        <TouchableOpacity style={styles.saveButton} onPress={handleAddPackage}>
                            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delivery Confirmation Modal */}
            <Modal visible={showDeliveryConfirm} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('packages.deliveryConfirmation')}</Text>
                        <Text style={styles.confirmText}>
                            {deliveryPackage ? `${deliveryPackage.courierCompany || t('packages.courierCompany')} - ${deliveryPackage.trackingNumber}` : ''} 
                            {t('packages.deliveryConfirmText')}
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDeliveryConfirm(false)}>
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleDeliverPackage}>
                                <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

             {/* QR Generator Mock Modal */}
             <Modal visible={showQRGenerator} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('packages.qrCode')}</Text>
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <QrCode size={120} color="#0f172a" />
                            <Text style={{ marginTop: 10, fontSize: 16, fontWeight: 'bold' }}>
                                {packages.find((p: Package) => p.id === selectedPackageId)?.trackingNumber}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setShowQRGenerator(false)}>
                            <Text style={styles.cancelButtonText}>{t('common.close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Footer Button - Sadece Güvenlik için */}
            <View style={styles.footer}>
                <Pressable
                    style={[
                        styles.footerButton,
                        !hasRole('SECURITY') && styles.footerButtonDisabled
                    ]}
                    onPress={() => {
                        if (!hasRole('SECURITY')) return;
                        setShowAddPackage(true);
                    }}
                    disabled={!hasRole('SECURITY')}
                >
                    <Plus size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.footerButtonText}>{t('packages.addPackage')}</Text>
                </Pressable>
            </View>

        </View>
    );
};

export default PackagesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: colors.white,
        paddingHorizontal: spacing.screenPaddingHorizontal,
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 14,
        color: '#0f172a',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
    },
    activeTabText: {
        color: '#0f766e',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    list: {
        gap: 12,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 16,
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    courierInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBoxWarning: {
        backgroundColor: '#fffbeb',
    },
    iconBoxSuccess: {
        backgroundColor: '#f0fdf4',
    },
    courierName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
    },
    trackingNumber: {
        fontSize: 12,
        color: '#64748b',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeWarning: {
        backgroundColor: '#fff7ed',
    },
    statusBadgeSuccess: {
        backgroundColor: '#f0fdf4',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextWarning: {
        color: '#c2410c',
    },
    statusTextSuccess: {
        color: '#15803d',
    },
    cardBody: {
        gap: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    infoValue: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    cardActions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
    },
    qrButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deliverButton: {
        flex: 1,
        height: 40,
        backgroundColor: colors.primary,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deliverButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    closeButton: {
        fontSize: 18,
        color: '#64748b',
        fontWeight: 'bold',
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0f172a',
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmText: {
        fontSize: 16,
        color: '#334155',
        marginBottom: 24,
        lineHeight: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#64748b',
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    footerButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#94a3b8',
        shadowColor: '#94a3b8',
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});
