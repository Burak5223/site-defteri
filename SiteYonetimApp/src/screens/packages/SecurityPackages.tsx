import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Package, Search, QrCode, Plus, X, CheckCircle, Scan } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { packageService, Package as PackageType, CreatePackageRequest, ScanQRResponse } from '../../services/package.service';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/apiClient';
import { useNavigation } from '@react-navigation/native';

interface Apartment {
  id: string;
  unitNumber: string;
  blockName?: string;
  floor?: number;
}

export function SecurityPackages() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'waiting' | 'requested' | 'delivered'>('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScannedPackagesModal, setShowScannedPackagesModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [scannedData, setScannedData] = useState<ScanQRResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  
  // Form states
  const [formData, setFormData] = useState<CreatePackageRequest>({
    apartmentId: '',
    trackingNumber: '',
    courierName: '',
    recipientName: '',
    senderName: '',
    packageSize: 'Orta',
    notes: '',
  });
  const [apartmentSearch, setApartmentSearch] = useState('');
  const [courierSearch, setCourierSearch] = useState('');
  const [showApartmentDropdown, setShowApartmentDropdown] = useState(false);
  const [showCourierDropdown, setShowCourierDropdown] = useState(false);

  const courierCompanies = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'UPS', 'DHL', 'FedEx', 'Diğer'];
  const packageSizes = ['Küçük', 'Orta', 'Büyük', 'Çok Büyük'];

  useEffect(() => {
    loadData();
  }, [user?.siteId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadPackages(), loadApartments()]);
    setLoading(false);
  };

  const loadPackages = async () => {
    try {
      const siteId = user?.siteId || '1';
      const data = await packageService.getPackages(siteId);
      console.log('Loaded packages:', data.length);
      setPackages(data);
    } catch (error) {
      console.error('Load packages error:', error);
      Alert.alert('Hata', 'Paketler yüklenemedi');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadApartments = async () => {
    try {
      const siteId = user?.siteId || '1';
      const data = await apiClient.get<Apartment[]>(`/sites/${siteId}/apartments`);
      setApartments(data);
    } catch (error) {
      console.error('Load apartments error:', error);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = 
      pkg.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.courierCompany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.apartmentNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'waiting') return (pkg.status === 'beklemede' || pkg.status === 'waiting') && matchesSearch;
    if (activeTab === 'requested') return pkg.status === 'requested' && matchesSearch;
    if (activeTab === 'delivered') return (pkg.status === 'teslim_edildi' || pkg.status === 'delivered') && matchesSearch;
    return matchesSearch;
  });

  const waitingCount = packages.filter(p => p.status === 'beklemede' || p.status === 'waiting').length;
  const requestedCount = packages.filter(p => p.status === 'requested').length;

  const handleShowQR = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setShowQRModal(true);
  };

  const handleScanResidentQR = () => {
    (navigation as any).navigate('QRScanner', {
      title: 'Sakin QR Kodunu Okut',
      onScan: async (qrData: string) => {
        try {
          const result = await packageService.scanResidentQR(qrData);
          setScannedData(result);
          setShowScannedPackagesModal(true);
        } catch (error: any) {
          console.error('Scan QR error:', error);
          Alert.alert('Hata', error.response?.data?.message || 'QR kod okunamadı');
        }
      },
    });
  };

  const handleDeliver = async (pkg: PackageType) => {
    try {
      // Güvenlik teslim ediyor (onay bekliyor)
      await packageService.initiateDelivery(pkg.id);
      Alert.alert('Başarılı', 'Paket teslim edildi. Sakin onayı bekleniyor.');
      
      // Scanned packages modal'ını kapat (eğer açıksa)
      setShowScannedPackagesModal(false);
      
      // Listeyi yenile
      await loadPackages();
    } catch (error: any) {
      console.error('Deliver package error:', error);
      const errorMsg = error.response?.data?.message || 'Paket teslim edilemedi';
      Alert.alert('Hata', errorMsg);
    }
  };

  const handleBulkDeliver = async () => {
    if (!scannedData || scannedData.packages.length === 0) {
      Alert.alert('Hata', 'Teslim edilecek paket bulunamadı');
      return;
    }

    try {
      const packageIds = scannedData.packages.map(pkg => pkg.id);
      await packageService.bulkInitiateDelivery(packageIds);
      
      Alert.alert(
        'Başarılı', 
        `${scannedData.packages.length} paket teslim edildi. Sakin onayı bekleniyor.`,
        [
          {
            text: 'Tamam',
            onPress: () => {
              setShowScannedPackagesModal(false);
              setScannedData(null);
              loadPackages();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Bulk deliver error:', error);
      const errorMsg = error.response?.data?.message || 'Paketler teslim edilemedi';
      Alert.alert('Hata', errorMsg);
    }
  };

  const handleAddPackage = async () => {
    if (!formData.apartmentId || !formData.trackingNumber || !formData.courierName) {
      Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun (Daire, Takip No, Kargo Şirketi)');
      return;
    }

    try {
      const siteId = user?.siteId || '1';
      await packageService.createPackage({
        ...formData,
        siteId,
      }, siteId);
      
      Alert.alert('Başarılı', 'Paket kaydedildi');
      setShowAddModal(false);
      setShowApartmentDropdown(false);
      setShowCourierDropdown(false);
      setFormData({
        apartmentId: '',
        trackingNumber: '',
        courierName: '',
        recipientName: '',
        senderName: '',
        packageSize: 'Orta',
        notes: '',
      });
      setApartmentSearch('');
      setCourierSearch('');
      loadPackages();
    } catch (error) {
      console.error('Add package error:', error);
      Alert.alert('Hata', 'Paket eklenemedi');
    }
  };

  const handleSelectApartment = (apartment: Apartment) => {
    setApartmentSearch(apartment.unitNumber);
    setFormData({ ...formData, apartmentId: apartment.id });
    setShowApartmentDropdown(false);
  };

  const handleSelectCourier = (courier: string) => {
    setFormData({ ...formData, courierName: courier });
    setCourierSearch('');
    setShowCourierDropdown(false);
  };

  const filteredApartments = apartments.filter(apt => 
    (apt.unitNumber?.toLowerCase() || '').includes(apartmentSearch.toLowerCase()) ||
    (apt.blockName?.toLowerCase() || '').includes(apartmentSearch.toLowerCase())
  );

  const filteredCouriers = courierCompanies.filter(courier =>
    courier.toLowerCase().includes(courierSearch.toLowerCase()) ||
    courier.toLowerCase().includes(formData.courierName?.toLowerCase() || '')
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Paket Yönetimi</Text>
          <Text style={styles.headerSubtitle}>
            {waitingCount} Bekleyen • {requestedCount} Talep
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.aiCargoButton}
            onPress={() => (navigation as any).navigate('AICargoRegistration')}
          >
            <Plus size={18} color={colors.white} />
            <Text style={styles.aiCargoButtonText}>AI Kargo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleScanResidentQR}
          >
            <Scan size={20} color={colors.white} />
            <Text style={styles.scanButtonText}>Sakin QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Takip no, kargo, daire ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray400}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tümü
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requested' && styles.activeTab]}
          onPress={() => setActiveTab('requested')}
        >
          <Text style={[styles.tabText, activeTab === 'requested' && styles.activeTabText]}>
            Talepler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'waiting' && styles.activeTab]}
          onPress={() => setActiveTab('waiting')}
        >
          <Text style={[styles.tabText, activeTab === 'waiting' && styles.activeTabText]}>
            Bekleyen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'delivered' && styles.activeTab]}
          onPress={() => setActiveTab('delivered')}
        >
          <Text style={[styles.tabText, activeTab === 'delivered' && styles.activeTabText]}>
            Teslim
          </Text>
        </TouchableOpacity>
      </View>

      {/* Package List */}
      <ScrollView 
        style={styles.packageList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {filteredPackages.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>Paket bulunamadı</Text>
          </View>
        ) : (
          filteredPackages.map(pkg => {
            // Durum rengini belirle
            const getStatusStyle = () => {
              if (pkg.status === 'requested') {
                return { style: styles.requestedIcon, color: colors.info };
              } else if (pkg.status === 'teslim_edildi' || pkg.status === 'delivered') {
                return { style: styles.deliveredIcon, color: colors.success };
              } else if (pkg.status === 'teslim_bekliyor' || pkg.status === 'waiting_confirmation') {
                return { style: styles.pendingConfirmIcon, color: colors.gray400 };
              } else {
                return { style: styles.waitingIcon, color: colors.warning };
              }
            };
            
            const statusStyle = getStatusStyle();
            
            return (
            <View key={pkg.id} style={styles.packageCard}>
              <View style={[styles.packageIcon, statusStyle.style]}>
                <Package size={24} color={statusStyle.color} />
              </View>
              <View style={styles.packageContent}>
                <View style={styles.packageHeaderRow}>
                  <Text style={styles.packageCompany}>
                    {pkg.status === 'requested' 
                      ? (pkg.recipientName || 'Sakin Talebi')
                      : (pkg.courierName || pkg.courierCompany || 'Kargo Şirketi')}
                  </Text>
                  {pkg.aiExtracted && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>🤖 AI</Text>
                    </View>
                  )}
                  {pkg.matchedNotificationId && pkg.status === 'waiting' && (
                    <View style={styles.matchedBadge}>
                      <Text style={styles.matchedBadgeText}>✓ Eşleşme Var</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.packageTracking}>
                  {pkg.status === 'requested'
                    ? (pkg.courierName ? `Kargo: ${pkg.courierName}` : 'Kargo bekleniyor')
                    : (pkg.trackingNumber || 'Takip No Yok')}
                </Text>
                <Text style={styles.packageApartment}>
                  {pkg.apartmentNumber || pkg.apartmentId} {pkg.blockName && `• ${pkg.blockName}`} • {new Date(pkg.recordedAt || pkg.arrivalDate || pkg.receivedDate).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <View style={styles.packageActions}>
                {pkg.status === 'requested' ? (
                  <View style={styles.requestedBadge}>
                    <Text style={styles.requestedText}>Talep Edildi</Text>
                  </View>
                ) : (pkg.status === 'beklemede' || pkg.status === 'waiting') ? (
                  <>
                    <TouchableOpacity 
                      style={styles.qrIconButton}
                      onPress={() => handleShowQR(pkg)}
                    >
                      <QrCode size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deliverButton}
                      onPress={() => handleDeliver(pkg)}
                    >
                      <Text style={styles.deliverButtonText}>Teslim Et</Text>
                    </TouchableOpacity>
                  </>
                ) : (pkg.status === 'teslim_bekliyor' || pkg.status === 'waiting_confirmation') ? (
                  <View style={styles.pendingConfirmBadge}>
                    <Text style={styles.pendingConfirmText}>Onay Bekleniyor</Text>
                  </View>
                ) : (
                  <View style={styles.deliveredBadge}>
                    <Text style={styles.deliveredText}>Teslim Edildi</Text>
                  </View>
                )}
              </View>
            </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={24} color={colors.white} />
        <Text style={styles.floatingButtonText}>Paket Ekle</Text>
      </TouchableOpacity>

      {/* QR Modal */}
      <Modal visible={showQRModal} transparent animationType="fade" onRequestClose={() => setShowQRModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowQRModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paket QR Kodu</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Sakine göstermek için QR kodu</Text>
            
            <View style={styles.qrCodeContainer}>
              {selectedPackage && (
                <QRCode
                  value={JSON.stringify({
                    id: selectedPackage.id,
                    tracking: selectedPackage.trackingMasked || selectedPackage.trackingNumber,
                    apartment: selectedPackage.apartmentNumber || selectedPackage.apartmentId,
                  })}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              )}
              <Text style={styles.trackingNumberText}>
                {selectedPackage?.trackingMasked || selectedPackage?.trackingNumber || 'YK123456789'}
              </Text>
              <Text style={styles.apartmentText}>
                Daire: {selectedPackage?.apartmentNumber || selectedPackage?.apartmentId}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.modalCancelText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Package Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => {
        setShowAddModal(false);
        setShowApartmentDropdown(false);
        setShowCourierDropdown(false);
      }}>
        <Pressable style={styles.modalOverlay} onPress={() => {
          setShowAddModal(false);
          setShowApartmentDropdown(false);
          setShowCourierDropdown(false);
        }}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Paket Kaydı</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setShowApartmentDropdown(false);
                setShowCourierDropdown(false);
              }}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Gelen paketi kaydedin</Text>
            
            <ScrollView style={styles.formScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Daire * (Yazmaya başlayın veya ok'a tıklayın)</Text>
                <View style={styles.inputWithDropdown}>
                  <TextInput
                    style={styles.inputDropdown}
                    placeholder="Daire numarası yazın (örn: A-101)"
                    value={apartmentSearch}
                    onChangeText={(text) => {
                      setApartmentSearch(text);
                      setShowApartmentDropdown(true);
                    }}
                    onFocus={() => setShowApartmentDropdown(true)}
                    placeholderTextColor={colors.gray400}
                  />
                  <TouchableOpacity 
                    style={styles.dropdownArrow}
                    onPress={() => setShowApartmentDropdown(!showApartmentDropdown)}
                  >
                    <Text style={styles.dropdownArrowText}>{showApartmentDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                </View>
                {showApartmentDropdown && filteredApartments.length > 0 && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {filteredApartments.slice(0, 10).map((apartment) => (
                        <TouchableOpacity
                          key={apartment.id}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectApartment(apartment)}
                        >
                          <Text style={styles.dropdownItemText}>{apartment.unitNumber}</Text>
                          {apartment.blockName && (
                            <Text style={styles.dropdownItemSubtext}>Blok: {apartment.blockName}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Takip Numarası *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: YK123456789"
                  value={formData.trackingNumber}
                  onChangeText={(text) => setFormData({ ...formData, trackingNumber: text })}
                  placeholderTextColor={colors.gray400}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kargo Şirketi * (Yazmaya başlayın veya ok'a tıklayın)</Text>
                <View style={styles.inputWithDropdown}>
                  <TextInput
                    style={styles.inputDropdown}
                    placeholder="Kargo şirketi yazın (örn: Yurtiçi)"
                    value={formData.courierName}
                    onChangeText={(text) => {
                      setFormData({ ...formData, courierName: text });
                      setCourierSearch(text);
                      setShowCourierDropdown(true);
                    }}
                    onFocus={() => setShowCourierDropdown(true)}
                    placeholderTextColor={colors.gray400}
                  />
                  <TouchableOpacity 
                    style={styles.dropdownArrow}
                    onPress={() => setShowCourierDropdown(!showCourierDropdown)}
                  >
                    <Text style={styles.dropdownArrowText}>{showCourierDropdown ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                </View>
                {showCourierDropdown && filteredCouriers.length > 0 && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {filteredCouriers.map((courier) => (
                        <TouchableOpacity
                          key={courier}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectCourier(courier)}
                        >
                          <Text style={styles.dropdownItemText}>{courier}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Alıcı Adı (Opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Alıcı adı (opsiyonel)"
                  value={formData.recipientName}
                  onChangeText={(text) => setFormData({ ...formData, recipientName: text })}
                  placeholderTextColor={colors.gray400}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Paket Boyutu (Opsiyonel)</Text>
                <View style={styles.sizeButtons}>
                  {packageSizes.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[styles.sizeButton, formData.packageSize === size && styles.sizeButtonActive]}
                      onPress={() => setFormData({ ...formData, packageSize: size })}
                    >
                      <Text style={[styles.sizeButtonText, formData.packageSize === size && styles.sizeButtonTextActive]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Not (Opsiyonel)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Ek bilgi (opsiyonel)"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholderTextColor={colors.gray400}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setShowApartmentDropdown(false);
                  setShowCourierDropdown(false);
                }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleAddPackage}
              >
                <Plus size={20} color={colors.white} />
                <Text style={styles.modalSaveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Scanned Packages Modal */}
      <Modal
        visible={showScannedPackagesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScannedPackagesModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowScannedPackagesModal(false)}>
          <Pressable style={styles.scannedModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.scannedHeader}>
              <Text style={styles.scannedTitle}>Sakin Paketleri</Text>
              <TouchableOpacity onPress={() => setShowScannedPackagesModal(false)}>
                <X size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {scannedData && (
              <>
                <View style={styles.scannedUserInfo}>
                  <Text style={styles.scannedUserName}>{scannedData.fullName}</Text>
                  <Text style={styles.scannedApartment}>
                    {scannedData.blockName} - {scannedData.apartmentNumber}
                  </Text>
                  <Text style={styles.scannedApartment}>
                    {scannedData.packageCount} Bekleyen Paket
                  </Text>
                </View>

                <ScrollView style={styles.scannedPackagesList}>
                  {scannedData.packages.map((pkg) => (
                    <View key={pkg.id} style={styles.scannedPackageCard}>
                      <View style={styles.scannedPackageHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.scannedPackageCourier}>
                              {pkg.courierName}
                            </Text>
                            {pkg.aiExtracted && (
                              <View style={styles.aiBadge}>
                                <Text style={styles.aiBadgeText}>🤖 AI</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.scannedPackageTracking}>
                            {pkg.trackingMasked || pkg.trackingNumber}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setShowScannedPackagesModal(false);
                            handleDeliver(pkg);
                          }}
                          style={styles.deliverButtonInModal}
                        >
                          <CheckCircle size={20} color={colors.white} />
                          <Text style={styles.deliverButtonInModalText}>Teslim Ettim</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Tümünü Teslim Et Butonu */}
                <View style={styles.bulkDeliverContainer}>
                  <TouchableOpacity
                    onPress={handleBulkDeliver}
                    style={styles.bulkDeliverButton}
                  >
                    <CheckCircle size={24} color={colors.white} />
                    <Text style={styles.bulkDeliverButtonText}>
                      Tümünü Teslim Et ({scannedData.packageCount})
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  aiCargoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  aiCargoButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  scanButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: fontSize.headerTitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.headerSubtitle,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    padding: 0,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 4,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray50,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  packageList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  packageCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestedIcon: {
    backgroundColor: colors.infoLight,
  },
  waitingIcon: {
    backgroundColor: colors.warningLight,
  },
  pendingConfirmIcon: {
    backgroundColor: colors.gray100,
  },
  deliveredIcon: {
    backgroundColor: colors.successLight,
  },
  packageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  packageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  packageCompany: {
    fontSize: fontSize.cardTitle,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  packageTracking: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  packageApartment: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textTertiary,
  },
  packageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrIconButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.button,
    backgroundColor: colors.gray100,
  },
  deliverButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  deliverButtonText: {
    color: colors.white,
    fontSize: fontSize.buttonText,
    fontWeight: '600',
  },
  pendingConfirmBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  pendingConfirmText: {
    color: colors.gray500,
    fontSize: fontSize.buttonText,
    fontWeight: '600',
  },
  deliveredBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  deliveredText: {
    color: colors.success,
    fontSize: fontSize.buttonText,
    fontWeight: '600',
  },
  requestedBadge: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
  },
  requestedText: {
    color: colors.info,
    fontSize: fontSize.buttonText,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing['3xl'],
    left: '50%',
    transform: [{ translateX: -70 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.modal,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  trackingNumberText: {
    fontSize: fontSize['2xl'],
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  apartmentText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  inputWithDropdown: {
    position: 'relative',
  },
  inputDropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    padding: spacing.md,
    paddingRight: 40,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  dropdownArrow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownArrowText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdownList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  selectText: {
    fontSize: fontSize.lg,
    color: colors.gray400,
  },
  selectTextFilled: {
    color: colors.textPrimary,
  },
  selectArrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sizeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  sizeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sizeButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  apartmentList: {
    maxHeight: 400,
  },
  apartmentItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  apartmentNumber: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  apartmentBlock: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  deliverInfo: {
    backgroundColor: colors.gray50,
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  deliverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliverLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  deliverValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  modalCancelText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primary,
  },
  modalSaveText: {
    fontSize: fontSize.lg,
    color: colors.white,
    fontWeight: '600',
  },
  modalDeliverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.button,
    backgroundColor: colors.success,
  },
  modalDeliverText: {
    fontSize: fontSize.lg,
    color: colors.white,
    fontWeight: '600',
  },
  scannedModalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  scannedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scannedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scannedUserInfo: {
    backgroundColor: colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scannedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  scannedApartment: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  scannedPackagesList: {
    maxHeight: 400,
  },
  scannedPackageCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scannedPackageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scannedPackageCourier: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scannedPackageTracking: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  deliverButtonInModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.success,
    borderRadius: 8,
  },
  deliverButtonInModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  bulkDeliverContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  bulkDeliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bulkDeliverButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  matchedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#10B981',
    borderRadius: 12,
  },
  matchedBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
