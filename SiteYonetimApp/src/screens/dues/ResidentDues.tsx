import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import {
  Wallet,
  CheckCircle,
  CreditCard,
  X,
  Building2,
  Smartphone,
  Banknote,
  RefreshCw,
  Download,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { dueService, Due } from '../../services/due.service';
import { paymentService } from '../../services/payment.service';
import { currencyService, CurrencyRate } from '../../services/currency.service';
import { formatAmount, formatPaymentDate, getPaymentMethodName, getPaymentStatusName } from '../../utils/paymentHelpers';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ResidentDues = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [selectedDue, setSelectedDue] = useState<any>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currencyRates, setCurrencyRates] = useState<Record<string, CurrencyRate>>({});
  const [loadingRates, setLoadingRates] = useState(false);
  
  // Payment modal states
  const [selectedDues, setSelectedDues] = useState<string[]>(['Şubat']);
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'transfer' | 'cash'>('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);
  const [errors, setErrors] = useState({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });

  useEffect(() => {
    loadDues();
    loadCurrencyRates();
    
    // 20 saniyede bir kur güncelleme
    const interval = setInterval(() => {
      loadCurrencyRates();
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDues = async () => {
    try {
      const data = await dueService.getMyDues();
      setDues(data);
    } catch (error) {
      console.error('Load dues error:', error);
      Alert.alert('Hata', 'Aidatlar yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCurrencyRates = async () => {
    try {
      setLoadingRates(true);
      const rates = await currencyService.getCurrentRates();
      
      // Null/undefined kontrolü
      if (!rates || !Array.isArray(rates) || rates.length === 0) {
        console.warn('No currency rates received, using fallback');
        throw new Error('No rates received');
      }
      
      const ratesMap: Record<string, CurrencyRate> = {};
      rates.forEach(rate => {
        ratesMap[rate.currency] = rate;
      });
      setCurrencyRates(ratesMap);
      console.log('Currency rates loaded:', ratesMap);
    } catch (error) {
      console.error('Load currency rates error:', error);
      // Hata durumunda varsayılan değerler
      if (Object.keys(currencyRates).length === 0) {
        setCurrencyRates({
          TRY: { currency: 'TRY', symbol: '₺', rate: 1, lastUpdate: new Date().toISOString() },
          USD: { currency: 'USD', symbol: '$', rate: 34.50, lastUpdate: new Date().toISOString() },
          EUR: { currency: 'EUR', symbol: '€', rate: 37.50, lastUpdate: new Date().toISOString() },
        });
      }
    } finally {
      setLoadingRates(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDues();
  };

  const totalDebt = dues.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = dues.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return { bg: colors.successLight, text: colors.successDark, label: t('duesScreen.paidStatus') };
      case 'pending': return { bg: colors.warningLight, text: colors.warningDark, label: t('duesScreen.pendingStatus') };
      case 'overdue': return { bg: colors.errorLight, text: colors.errorDark, label: t('duesScreen.overdueStatus') };
      default: return { bg: colors.gray200, text: colors.textSecondary, label: status };
    }
  };

  const handlePayDue = (due: any) => {
    setSelectedDue(due);
    setSelectedDues(['Şubat']);
    setSelectedCurrency('TRY');
    setSelectedInstallment(1);
    setSelectedPaymentMethod('card');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setPaymentModalVisible(true);
  };

  const downloadReceipt = async (due: any) => {
    try {
      // Direkt PDF oluştur ve indir
      const currentDate = new Date();
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Segoe UI', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 20px;
              }
              .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px;
                text-align: center;
                position: relative;
              }
              .header h1 {
                font-size: 36px;
                font-weight: 700;
                margin-bottom: 10px;
                letter-spacing: 1px;
              }
              .header .subtitle {
                font-size: 16px;
                opacity: 0.9;
                margin-bottom: 20px;
              }
              .status-badge {
                display: inline-block;
                background: #10b981;
                color: white;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-top: 10px;
              }
              .section {
                padding: 30px 40px;
                border-bottom: 2px solid #f3f4f6;
              }
              .section:last-child {
                border-bottom: none;
              }
              .section-title {
                color: #667eea;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #f3f4f6;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                color: #6b7280;
                font-size: 14px;
                font-weight: 500;
              }
              .info-value {
                color: #111827;
                font-size: 14px;
                font-weight: 600;
                text-align: right;
              }
              .total-section {
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
                padding: 25px 40px;
                text-align: center;
              }
              .total-label {
                color: #6b7280;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .total-amount {
                color: #667eea;
                font-size: 42px;
                font-weight: 700;
              }
              .demo-section {
                background: #fef3c7;
                padding: 20px 40px;
                border-left: 4px solid #f59e0b;
              }
              .demo-title {
                color: #92400e;
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
              }
              .demo-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
              }
              .demo-label {
                color: #78350f;
                font-size: 13px;
              }
              .demo-value {
                color: #78350f;
                font-size: 13px;
                font-weight: 600;
              }
              .footer {
                background: #f9fafb;
                padding: 30px 40px;
                text-align: center;
              }
              .footer-title {
                color: #111827;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 10px;
              }
              .footer-text {
                color: #6b7280;
                font-size: 12px;
                line-height: 1.6;
                margin: 5px 0;
              }
              .stamp {
                margin-top: 30px;
                display: inline-block;
                border: 3px solid #667eea;
                border-radius: 50%;
                width: 120px;
                height: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                color: #667eea;
                font-weight: 700;
                font-size: 12px;
                line-height: 1.3;
                transform: rotate(-15deg);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ÖDEME MAKBUZU</h1>
                <div class="subtitle">Site Yönetim Sistemi</div>
                <div class="status-badge">✓ ÖDENDİ</div>
              </div>

              <div class="section">
                <div class="section-title">MAKBUZ BİLGİLERİ</div>
                <div class="info-row">
                  <span class="info-label">Makbuz No:</span>
                  <span class="info-value">#${due.id || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Düzenlenme Tarihi:</span>
                  <span class="info-value">${currentDate.toLocaleDateString('tr-TR')} ${currentDate.toLocaleTimeString('tr-TR')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ödeme Tarihi:</span>
                  <span class="info-value">${due.paidDate ? new Date(due.paidDate).toLocaleDateString('tr-TR') : 'N/A'}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">SAKIN BİLGİLERİ</div>
                <div class="info-row">
                  <span class="info-label">Ad Soyad:</span>
                  <span class="info-value">Sakin</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Daire No:</span>
                  <span class="info-value">${due.apartmentNumber || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Site:</span>
                  <span class="info-value">Yeşil Vadi Sitesi</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">ÖDEME DETAYLARI</div>
                <div class="info-row">
                  <span class="info-label">Aidat Dönemi:</span>
                  <span class="info-value">${due.month || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Aidat Tutarı:</span>
                  <span class="info-value">${formatAmount(due.amount)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Ödeme Yöntemi:</span>
                  <span class="info-value">Kredi Kartı</span>
                </div>
              </div>

              <div class="total-section">
                <div class="total-label">TOPLAM ÖDENEN TUTAR</div>
                <div class="total-amount">${formatAmount(due.amount)}</div>
              </div>

              <div class="demo-section">
                <div class="demo-title">📄 DEMO DEKONT BİLGİLERİ</div>
                <div class="demo-row">
                  <span class="demo-label">İşlem No:</span>
                  <span class="demo-value">${Math.random().toString(36).substring(2, 15).toUpperCase()}</span>
                </div>
                <div class="demo-row">
                  <span class="demo-label">Onay Kodu:</span>
                  <span class="demo-value">${Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
                <div class="demo-row">
                  <span class="demo-label">Banka:</span>
                  <span class="demo-value">Demo Banka A.Ş.</span>
                </div>
                <div class="demo-row">
                  <span class="demo-label">Kart:</span>
                  <span class="demo-value">**** **** **** 2490</span>
                </div>
                <div class="demo-row">
                  <span class="demo-label">İşlem Tarihi:</span>
                  <span class="demo-value">${currentDate.toLocaleDateString('tr-TR')} ${currentDate.toLocaleTimeString('tr-TR')}</span>
                </div>
                <div class="demo-row">
                  <span class="demo-label">Durum:</span>
                  <span class="demo-value">✓ BAŞARILI</span>
                </div>
              </div>

              <div class="footer">
                <div class="stamp">
                  SİTE<br/>YÖNETİMİ<br/>ONAY<br/>MÜHRÜ
                </div>
                <div class="footer-title">Site Yönetim Sistemi</div>
                <div class="footer-text">Bu makbuz elektronik ortamda oluşturulmuştur ve geçerlidir.</div>
                <div class="footer-text">Sorularınız için: info@siteyonetim.com | Tel: 0 (212) 555 00 00</div>
                <div class="footer-text">Yazdırma Tarihi: ${currentDate.toLocaleDateString('tr-TR')} ${currentDate.toLocaleTimeString('tr-TR')}</div>
              </div>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html });
      
      // Dosya adı oluştur
      const fileName = `Makbuz_${due.month}_${Date.now()}.pdf`;
      
      // Android için Downloads klasörüne kaydet
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/pdf'
          )
            .then(async (fileUri) => {
              await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
            });
          
          Alert.alert('Başarılı', `Makbuz indirildi:\n${fileName}`);
        } else {
          Alert.alert('Hata', 'Dosya kaydetme izni verilmedi');
        }
      } else {
        // iOS için Documents klasörüne kaydet
        const documentsDir = FileSystem.documentDirectory;
        const newUri = `${documentsDir}${fileName}`;
        
        await FileSystem.copyAsync({
          from: uri,
          to: newUri,
        });
        
        Alert.alert('Başarılı', `Makbuz kaydedildi:\n${fileName}\n\nDosyalar uygulamasından erişebilirsiniz.`);
      }
    } catch (error) {
      console.error('Download receipt error:', error);
      Alert.alert('Hata', 'Makbuz oluşturulurken bir hata oluştu');
    }
  };

  const toggleDueSelection = (month: string) => {
    setSelectedDues(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const getCurrencyInfo = (code: string) => {
    return currencyRates[code] || { currency: code, symbol: code, rate: 1, lastUpdate: '' };
  };

  const installmentOptions = [
    { value: 1, label: 'Tek Çekim', commission: 0 },
    { value: 2, label: '2 Taksit', commission: 1.5 },
    { value: 3, label: '3 Taksit', commission: 3 },
    { value: 6, label: '6 Taksit', commission: 5 },
    { value: 9, label: '9 Taksit', commission: 7 },
    { value: 12, label: '12 Taksit', commission: 9 },
  ];

  const calculateTotal = () => {
    if (!selectedDue) return 0;
    const baseAmount = selectedDue.amount * selectedDues.length;
    const commission = installmentOptions.find(opt => opt.value === selectedInstallment)?.commission || 0;
    return baseAmount * (1 + commission / 100);
  };

  const validateCardInfo = () => {
    const newErrors = {
      cardName: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
    };

    let isValid = true;

    if (selectedPaymentMethod === 'card') {
      if (!cardName.trim()) {
        newErrors.cardName = 'Kart üzerindeki isim gereklidir';
        isValid = false;
      }
      
      const cleanedNumber = cardNumber.replace(/\s/g, '');
      if (!cleanedNumber || cleanedNumber.length < 16) {
        newErrors.cardNumber = 'Geçerli bir kart numarası giriniz (16 hane)';
        isValid = false;
      }
      
      if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
        newErrors.cardExpiry = 'Son kullanma tarihini giriniz (AA/YY)';
        isValid = false;
      } else {
        const [month, year] = cardExpiry.split('/');
        if (parseInt(month) < 1 || parseInt(month) > 12) {
          newErrors.cardExpiry = 'Geçersiz ay (01-12 arası olmalı)';
          isValid = false;
        }
      }
      
      if (!cardCvv.trim() || cardCvv.length < 3) {
        newErrors.cardCvv = 'CVV kodunu giriniz (3 hane)';
        isValid = false;
      }
    }

    setErrors(newErrors);

    if (!isValid) {
      return false;
    }

    if (!contractAccepted) {
      Alert.alert('Uyarı', 'Lütfen ödeme sözleşmesini onaylayınız');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateCardInfo()) {
      return;
    }

    setProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process payment through backend
      await paymentService.processPayment({
        dueId: selectedDue?.id || '',
        dueIds: selectedDues.map(month => selectedDue?.id || ''),
        amount: calculateTotal(),
        currencyCode: selectedCurrency,
        installment: selectedInstallment,
        paymentMethod: selectedPaymentMethod,
        cardInfo: selectedPaymentMethod === 'card' ? {
          cardName,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardExpiry,
          cardCvv,
        } : undefined,
      });
      
      Alert.alert('Başarılı', 'Ödeme işlemi başarıyla tamamlandı');
      setPaymentModalVisible(false);
      
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      
      loadDues();
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Hata', error.response?.data?.message || 'Ödeme işlemi başarısız oldu');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
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
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Wallet size={20} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Aidatlarım</Text>
          <Text style={styles.headerSubtitle}>Aidat takip ve ödeme</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Owner exemption notice */}
        {user?.residentType === 'owner' && (
          <View style={styles.ownerExemptionCard}>
            <View style={styles.ownerExemptionIcon}>
              <Building2 size={20} color={colors.warning} />
            </View>
            <View style={styles.ownerExemptionContent}>
              <Text style={styles.ownerExemptionTitle}>Kat Maliki Muafiyeti</Text>
              <Text style={styles.ownerExemptionSubtitle}>
                Kat malikleri aidat ödemekle yükümlü değildir. Sadece kiracılar aidat öder.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <CreditCard size={20} color={colors.error} />
            </View>
            <Text style={styles.summaryLabel}>TOPLAM BORÇ</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>₺{totalDebt.toLocaleString('tr-TR')},00</Text>
            <Text style={styles.summarySubtitle}>{dues.filter(d => d.status !== 'paid').length} aidat</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <CheckCircle size={20} color={colors.success} />
            </View>
            <Text style={styles.summaryLabel}>ÖDENEN</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>₺{totalPaid.toLocaleString('tr-TR')},00</Text>
            <Text style={styles.summarySubtitle}>Bu yıl</Text>
          </View>
        </View>

        <Pressable style={styles.financeInfoCard}>
          <View style={[styles.financeInfoIcon, { backgroundColor: colors.primaryLight }]}>
            <Wallet size={20} color={colors.primary} />
          </View>
          <View style={styles.financeInfoContent}>
            <Text style={styles.financeInfoTitle}>Site Finansal Durumu</Text>
            <Text style={styles.financeInfoSubtitle}>Gelir, gider ve bütçe şeffaflığı</Text>
          </View>
        </Pressable>

        <Pressable style={styles.payAllButton}>
          <CreditCard size={20} color={colors.white} />
          <Text style={styles.payAllButtonText}>Tüm Borçları Öde</Text>
        </Pressable>

        <Text style={styles.payAllHint}>Birden fazla ay seçmek için aidatlara tıklayın</Text>

        <View style={styles.filterRow}>
          <Pressable style={[styles.filterButton, styles.filterButtonActive]}>
            <Text style={[styles.filterButtonText, styles.filterButtonTextActive]}>{t('duesScreen.all')}</Text>
          </Pressable>
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterButtonText}>{t('duesScreen.pending')}</Text>
          </Pressable>
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterButtonText}>{t('duesScreen.overdue')}</Text>
          </Pressable>
          <Pressable style={styles.filterButton}>
            <Text style={styles.filterButtonText}>{t('duesScreen.paid')}</Text>
          </Pressable>
        </View>

        <View style={styles.duesList}>
          {dues.map(due => {
            const statusInfo = getStatusColor(due.status);
            return (
              <View key={due.id} style={styles.dueCard}>
                <View style={styles.dueCardHeader}>
                  <View style={styles.dueCardLeft}>
                    {due.status === 'paid' ? (
                      <View style={[styles.dueCardIcon, { backgroundColor: colors.successLight }]}>
                        <CheckCircle size={20} color={colors.success} />
                      </View>
                    ) : (
                      <View style={[styles.dueCardIcon, { backgroundColor: statusInfo.bg }]}>
                        <CreditCard size={20} color={statusInfo.text} />
                      </View>
                    )}
                    <View style={styles.dueCardInfo}>
                      <Text style={styles.dueCardMonth}>{due.month} {due.year}</Text>
                      <Text style={styles.dueCardDate}>Son ödeme: {formatDate(due.dueDate)}</Text>
                    </View>
                  </View>
                  <View style={styles.dueCardRight}>
                    <Text style={styles.dueCardAmount}>₺{due.amount.toLocaleString('tr-TR')},00</Text>
                    <View style={[styles.dueCardStatus, { backgroundColor: statusInfo.bg }]}>
                      <Text style={[styles.dueCardStatusText, { color: statusInfo.text }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Payment restrictions for owners */}
                {due.status !== 'paid' && user?.residentType !== 'owner' && (
                  <Pressable 
                    style={styles.payButton}
                    onPress={() => handlePayDue(due)}
                  >
                    <Text style={styles.payButtonText}>Öde</Text>
                  </Pressable>
                )}

                {due.status !== 'paid' && user?.residentType === 'owner' && (
                  <View style={styles.ownerRestrictionInfo}>
                    <Text style={styles.ownerRestrictionText}>
                      Kat malikleri aidat ödemez
                    </Text>
                  </View>
                )}

                {due.status === 'paid' && (
                  <Pressable 
                    style={styles.downloadButton}
                    onPress={() => downloadReceipt(due)}
                  >
                    <Download size={16} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.downloadButtonText}>Makbuz İndir</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aidat Ödemesi</Text>
              <Pressable onPress={() => setPaymentModalVisible(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedDue && (
                <View style={styles.modalBody}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Seçili Aidatlar</Text>
                    <View style={styles.modalTabs}>
                      <Pressable 
                        style={[styles.modalTab, selectedDues.includes('Şubat') && styles.modalTabActive]}
                        onPress={() => toggleDueSelection('Şubat')}
                      >
                        <Text style={[styles.modalTabText, selectedDues.includes('Şubat') && styles.modalTabTextActive]}>
                          Şubat
                        </Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.modalTab, selectedDues.includes('Aralık') && styles.modalTabActive]}
                        onPress={() => toggleDueSelection('Aralık')}
                      >
                        <Text style={[styles.modalTabText, selectedDues.includes('Aralık') && styles.modalTabTextActive]}>
                          Aralık
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.modalLabel}>Para Birimi</Text>
                      <Pressable 
                        style={styles.refreshButton}
                        onPress={loadCurrencyRates}
                        disabled={loadingRates}
                      >
                        <RefreshCw size={14} color={colors.primary} />
                        <Text style={styles.refreshButtonText}>
                          {loadingRates ? 'Güncelleniyor...' : 'Kurları Güncelle'}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.currencyGrid}>
                      {Object.entries(currencyRates).map(([key, curr]) => (
                        <Pressable
                          key={key}
                          style={[
                            styles.currencyButton,
                            selectedCurrency === key && styles.currencyButtonActive
                          ]}
                          onPress={() => setSelectedCurrency(key as any)}
                        >
                          <Text style={[
                            styles.currencySymbol,
                            selectedCurrency === key && styles.currencySymbolActive
                          ]}>
                            {curr.symbol} {curr.currency}
                          </Text>
                          {key !== 'TRY' && (
                            <Text style={styles.currencyRate}>1 {curr.currency} = {curr.rate.toFixed(2)} ₺</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                    {Object.keys(currencyRates).length > 0 && (
                      <Text style={styles.lastUpdateText}>
                        Son güncelleme: {new Date(getCurrencyInfo('TRY').lastUpdate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Text>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Taksit Seçeneği</Text>
                    <View style={styles.installmentGrid}>
                      {installmentOptions.map(option => (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.installmentButton,
                            selectedInstallment === option.value && styles.installmentButtonActive
                          ]}
                          onPress={() => setSelectedInstallment(option.value)}
                        >
                          <Text style={[
                            styles.installmentLabel,
                            selectedInstallment === option.value && styles.installmentLabelActive
                          ]}>
                            {option.label}
                          </Text>
                          {option.commission > 0 && (
                            <Text style={styles.installmentCommission}>+%{option.commission}</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Ödeme Yöntemi Seçin</Text>
                    
                    <Pressable 
                      style={[
                        styles.paymentMethod,
                        selectedPaymentMethod === 'card' && styles.paymentMethodActive
                      ]}
                      onPress={() => setSelectedPaymentMethod('card')}
                    >
                      <View style={[styles.paymentMethodIcon, { backgroundColor: colors.primaryLight }]}>
                        <CreditCard size={20} color={colors.primary} />
                      </View>
                      <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodTitle}>Kredi/Banka Kartı</Text>
                        <Text style={styles.paymentMethodSubtitle}>Visa, Mastercard, Troy</Text>
                      </View>
                      <View style={[
                        styles.paymentMethodRadio,
                        selectedPaymentMethod === 'card' && styles.paymentMethodRadioActive
                      ]} />
                    </Pressable>

                    <Pressable 
                      style={[
                        styles.paymentMethod,
                        selectedPaymentMethod === 'transfer' && styles.paymentMethodActive
                      ]}
                      onPress={() => setSelectedPaymentMethod('transfer')}
                    >
                      <View style={[styles.paymentMethodIcon, { backgroundColor: colors.primaryLight }]}>
                        <Building2 size={20} color={colors.primary} />
                      </View>
                      <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodTitle}>Havale/EFT</Text>
                        <Text style={styles.paymentMethodSubtitle}>Banka havalesi</Text>
                      </View>
                      <View style={[
                        styles.paymentMethodRadio,
                        selectedPaymentMethod === 'transfer' && styles.paymentMethodRadioActive
                      ]} />
                    </Pressable>

                    <Pressable 
                      style={[
                        styles.paymentMethod,
                        selectedPaymentMethod === 'cash' && styles.paymentMethodActive
                      ]}
                      onPress={() => setSelectedPaymentMethod('cash')}
                    >
                      <View style={[styles.paymentMethodIcon, { backgroundColor: colors.primaryLight }]}>
                        <Banknote size={20} color={colors.primary} />
                      </View>
                      <View style={styles.paymentMethodInfo}>
                        <Text style={styles.paymentMethodTitle}>Nakit</Text>
                        <Text style={styles.paymentMethodSubtitle}>Yönetim ofisinde</Text>
                      </View>
                      <View style={[
                        styles.paymentMethodRadio,
                        selectedPaymentMethod === 'cash' && styles.paymentMethodRadioActive
                      ]} />
                    </Pressable>
                  </View>

                  {selectedPaymentMethod === 'card' && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Kart Bilgileri</Text>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Kart Üzerindeki İsim</Text>
                        <TextInput
                          style={[styles.input, errors.cardName && styles.inputError]}
                          placeholder="Ad Soyad"
                          value={cardName}
                          onChangeText={(text) => {
                            setCardName(text);
                            if (errors.cardName) setErrors({...errors, cardName: ''});
                          }}
                          autoCapitalize="characters"
                        />
                        {errors.cardName ? (
                          <Text style={styles.errorText}>{errors.cardName}</Text>
                        ) : null}
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Kart Numarası</Text>
                        <TextInput
                          style={[styles.input, errors.cardNumber && styles.inputError]}
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChangeText={(text) => {
                            const cleaned = text.replace(/\s/g, '');
                            const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                            setCardNumber(formatted);
                            if (errors.cardNumber) setErrors({...errors, cardNumber: ''});
                          }}
                          keyboardType="numeric"
                          maxLength={19}
                        />
                        {errors.cardNumber ? (
                          <Text style={styles.errorText}>{errors.cardNumber}</Text>
                        ) : null}
                      </View>

                      <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>AA/YY</Text>
                          <TextInput
                            style={[styles.input, errors.cardExpiry && styles.inputError]}
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChangeText={(text) => {
                              const cleaned = text.replace(/\D/g, '');
                              if (cleaned.length >= 2) {
                                setCardExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
                              } else {
                                setCardExpiry(cleaned);
                              }
                              if (errors.cardExpiry) setErrors({...errors, cardExpiry: ''});
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                          />
                          {errors.cardExpiry ? (
                            <Text style={styles.errorText}>{errors.cardExpiry}</Text>
                          ) : null}
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>CVV</Text>
                          <TextInput
                            style={[styles.input, errors.cardCvv && styles.inputError]}
                            placeholder="***"
                            value={cardCvv}
                            onChangeText={(text) => {
                              setCardCvv(text);
                              if (errors.cardCvv) setErrors({...errors, cardCvv: ''});
                            }}
                            keyboardType="numeric"
                            maxLength={3}
                            secureTextEntry
                          />
                          {errors.cardCvv ? (
                            <Text style={styles.errorText}>{errors.cardCvv}</Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  )}

                  {selectedPaymentMethod === 'transfer' && (
                    <View style={styles.modalSection}>
                      <Pressable 
                        style={styles.transferInfoButton}
                        onPress={() => setTransferModalVisible(true)}
                      >
                        <Text style={styles.transferInfoButtonText}>Havale/EFT Bilgilerini Gör</Text>
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.securityMessage}>
                    <Text style={styles.securityMessageText}>
                      🔒 256-bit SSL ile güvenli ödeme
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.paymentSummaryTitle}>Ödeme Özeti</Text>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.paymentSummaryLabel}>Seçili Aidatlar</Text>
                      <Text style={styles.paymentSummaryValue}>{selectedDues.length} ay</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.paymentSummaryLabel}>Ara Toplam</Text>
                      <Text style={styles.paymentSummaryValue}>
                        {getCurrencyInfo(selectedCurrency).symbol}
                        {((selectedDue?.amount || 0) * selectedDues.length / getCurrencyInfo(selectedCurrency).rate).toFixed(2)}
                      </Text>
                    </View>

                    {selectedInstallment > 1 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.paymentSummaryLabel}>
                          Taksit Komisyonu (%{installmentOptions.find(opt => opt.value === selectedInstallment)?.commission})
                        </Text>
                        <Text style={[styles.paymentSummaryValue, { color: colors.warning }]}>
                          +{getCurrencyInfo(selectedCurrency).symbol}
                          {(((selectedDue?.amount || 0) * selectedDues.length * (installmentOptions.find(opt => opt.value === selectedInstallment)?.commission || 0) / 100) / getCurrencyInfo(selectedCurrency).rate).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabelBold}>Toplam Tutar</Text>
                      <Text style={styles.summaryValueBold}>
                        {getCurrencyInfo(selectedCurrency).symbol}
                        {(calculateTotal() / getCurrencyInfo(selectedCurrency).rate).toFixed(2)}
                      </Text>
                    </View>

                    {selectedInstallment > 1 && (
                      <View style={styles.installmentInfoBox}>
                        <Text style={styles.installmentInfoText}>
                          {selectedInstallment} taksit x {getCurrencyInfo(selectedCurrency).symbol}
                          {(calculateTotal() / selectedInstallment / getCurrencyInfo(selectedCurrency).rate).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Pressable 
                    style={styles.contractCheckbox}
                    onPress={() => setContractAccepted(!contractAccepted)}
                  >
                    <View style={[styles.checkbox, contractAccepted && styles.checkboxActive]}>
                      {contractAccepted && <CheckCircle size={16} color={colors.white} />}
                    </View>
                    <Text style={styles.contractText}>
                      <Text style={styles.contractLink}>Ön bilgilendirme formu</Text>
                      {' '}ve{' '}
                      <Text style={styles.contractLink}>mesafeli satış sözleşmesi</Text>
                      'ni okudum, onaylıyorum.
                    </Text>
                  </Pressable>

                  <View style={styles.modalFooter}>
                    <Pressable 
                      style={styles.modalCancelButton} 
                      onPress={() => setPaymentModalVisible(false)}
                      disabled={processing}
                    >
                      <Text style={styles.modalCancelButtonText}>İptal</Text>
                    </Pressable>
                    <Pressable 
                      style={[
                        styles.modalPayButton, 
                        (processing || !contractAccepted) && styles.modalPayButtonDisabled
                      ]}
                      onPress={handlePayment}
                      disabled={processing || !contractAccepted}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.modalPayButtonText}>Ödemeyi Tamamla</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={transferModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.transferModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Havale/EFT Bilgileri</Text>
              <Pressable onPress={() => setTransferModalVisible(false)}>
                <X size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.transferInfo}>
              <View style={styles.transferInfoRow}>
                <Text style={styles.transferInfoLabel}>Banka</Text>
                <Text style={styles.transferInfoValue}>Ziraat Bankası</Text>
              </View>
              <View style={styles.transferInfoRow}>
                <Text style={styles.transferInfoLabel}>IBAN</Text>
                <Text style={styles.transferInfoValue}>TR00 0000 0000 0000 0000 0000 00</Text>
              </View>
              <View style={styles.transferInfoRow}>
                <Text style={styles.transferInfoLabel}>Hesap Sahibi</Text>
                <Text style={styles.transferInfoValue}>Site Yönetimi A.Ş.</Text>
              </View>
              <View style={styles.transferInfoRow}>
                <Text style={styles.transferInfoLabel}>Açıklama</Text>
                <Text style={styles.transferInfoValue}>Daire No: {selectedDue?.apartmentNumber || '-'}</Text>
              </View>
            </View>

            <Pressable 
              style={styles.transferModalButton}
              onPress={() => setTransferModalVisible(false)}
            >
              <Text style={styles.transferModalButtonText}>Tamam</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  headerTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginTop: 2 },
  content: { flex: 1 },
  scrollContent: { padding: spacing.screenPaddingHorizontal, paddingBottom: 100 },
  summaryGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  summaryCard: { flex: 1, borderRadius: borderRadius.card, padding: spacing.lg },
  summaryIcon: { width: 36, height: 36, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  summaryLabel: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: fontWeight.bold, marginBottom: 2 },
  summarySubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  financeInfoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.card, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  financeInfoIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  financeInfoContent: { flex: 1 },
  financeInfoTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  financeInfoSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  payAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.button, marginBottom: spacing.sm },
  payAllButtonText: { fontSize: fontSize.buttonTextLg, fontWeight: fontWeight.semibold, color: colors.white },
  payAllHint: { fontSize: fontSize.cardMeta, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  filterButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.pill, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterButtonText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  filterButtonTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  duesList: { gap: spacing.md },
  dueCard: { backgroundColor: colors.background, borderRadius: borderRadius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  dueCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  dueCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dueCardIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  dueCardInfo: { flex: 1 },
  dueCardMonth: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  dueCardDate: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  dueCardRight: { alignItems: 'flex-end' },
  dueCardAmount: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
  dueCardStatus: { paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: borderRadius.pill },
  dueCardStatusText: { fontSize: fontSize.cardMeta, fontWeight: fontWeight.semibold },
  payButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: borderRadius.button, alignItems: 'center' },
  payButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  downloadButton: { 
    backgroundColor: colors.gray100, 
    paddingVertical: spacing.md, 
    borderRadius: borderRadius.button, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  downloadButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg, padding: spacing.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalBody: { paddingBottom: spacing.xl },
  modalSection: { marginBottom: spacing.xl },
  modalLabel: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.md },
  modalTabs: { flexDirection: 'row', gap: spacing.sm },
  modalTab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.pill, backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.border },
  modalTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modalTabText: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, fontWeight: fontWeight.medium },
  modalTabTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refreshButtonText: { fontSize: fontSize.cardMeta, color: colors.primary, fontWeight: fontWeight.medium },
  currencyGrid: { flexDirection: 'row', gap: spacing.sm },
  currencyButton: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  currencyButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 2 },
  currencySymbol: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 2 },
  currencySymbolActive: { color: colors.primary },
  currencyRate: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  installmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  installmentButton: { width: '31%', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  installmentButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 2 },
  installmentLabel: { fontSize: fontSize.cardSubtitle, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 2 },
  installmentLabelActive: { color: colors.primary },
  installmentCommission: { fontSize: fontSize.cardMeta, color: colors.textSecondary },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  paymentMethodActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 2 },
  paymentMethodIcon: { width: 40, height: 40, borderRadius: borderRadius.icon, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  paymentMethodInfo: { flex: 1 },
  paymentMethodTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: 2 },
  paymentMethodSubtitle: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  paymentMethodRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background },
  paymentMethodRadioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: fontWeight.medium },
  input: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, fontSize: fontSize.cardTitle, color: colors.textPrimary },
  inputError: { borderColor: colors.error, borderWidth: 2 },
  errorText: { fontSize: fontSize.cardMeta, color: colors.error, marginTop: 4, marginLeft: 4 },
  inputRow: { flexDirection: 'row', gap: spacing.md },
  transferInfoButton: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.button, alignItems: 'center' },
  transferInfoButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  securityMessage: { backgroundColor: colors.successLight, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  securityMessageText: { fontSize: fontSize.cardSubtitle, color: colors.successDark, textAlign: 'center', fontWeight: fontWeight.medium },
  paymentSummaryTitle: { fontSize: fontSize.cardTitle, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  paymentSummaryLabel: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary },
  paymentSummaryValue: { fontSize: fontSize.cardSubtitle, color: colors.textPrimary, fontWeight: fontWeight.medium },
  summaryLabelBold: { fontSize: fontSize.cardTitle, color: colors.textPrimary, fontWeight: fontWeight.bold },
  summaryValueBold: { fontSize: fontSize.cardTitle, color: colors.primary, fontWeight: fontWeight.bold },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  installmentInfoBox: { backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: borderRadius.sm, marginTop: spacing.sm },
  installmentInfoText: { fontSize: fontSize.cardMeta, color: colors.primary, textAlign: 'center', fontWeight: fontWeight.medium },
  lastUpdateText: { fontSize: fontSize.cardMeta, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, fontStyle: 'italic' },
  contractCheckbox: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.background, marginRight: spacing.sm, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  contractText: { flex: 1, fontSize: fontSize.cardSubtitle, color: colors.textSecondary, lineHeight: 20 },
  contractLink: { color: colors.primary, fontWeight: fontWeight.semibold, textDecorationLine: 'underline' },
  modalFooter: { flexDirection: 'row', gap: spacing.md },
  modalCancelButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.gray100, alignItems: 'center' },
  modalCancelButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  modalPayButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: borderRadius.button, backgroundColor: colors.primary, alignItems: 'center' },
  modalPayButtonDisabled: { backgroundColor: colors.gray400, opacity: 0.6 },
  modalPayButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  transferModal: { backgroundColor: colors.background, borderRadius: borderRadius.cardLg, padding: spacing.xl, margin: spacing.xl },
  transferInfo: { marginVertical: spacing.lg },
  transferInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  transferInfoLabel: { fontSize: fontSize.cardSubtitle, color: colors.textSecondary, fontWeight: fontWeight.medium },
  transferInfoValue: { fontSize: fontSize.cardSubtitle, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  transferModalButton: { backgroundColor: colors.primary, paddingVertical: spacing.lg, borderRadius: borderRadius.button, alignItems: 'center' },
  transferModalButtonText: { fontSize: fontSize.buttonText, fontWeight: fontWeight.semibold, color: colors.white },
  
  // Owner exemption styles
  ownerExemptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  ownerExemptionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.icon,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  ownerExemptionContent: {
    flex: 1,
  },
  ownerExemptionTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: '#92400e',
    marginBottom: 2,
  },
  ownerExemptionSubtitle: {
    fontSize: fontSize.cardSubtitle,
    color: '#78350f',
  },
  ownerRestrictionInfo: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.button,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  ownerRestrictionText: {
    color: '#92400e',
    fontSize: fontSize.cardSubtitle,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
});

export default ResidentDues;


