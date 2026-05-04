import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Camera, Upload, Save, X, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { packageService, CargoFormData, ValidationResult } from '../../services/package.service';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export function AICargoRegistration() {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [formData, setFormData] = useState<CargoFormData>({
    fullName: '',
    trackingNumber: '',
    date: '',
    cargoCompany: '',
    apartmentNumber: '',
    notes: '',
    aiExtracted: false,
  });
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    fieldErrors: {},
  });
  const [aiExtractionLogId, setAiExtractionLogId] = useState<number | undefined>();

  const pickImage = async (useCamera: boolean) => {
    try {
      const { status } = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '⚠️ İzin Gerekli',
          useCamera
            ? 'Fotoğraf çekmek için kamera izni gereklidir'
            : 'Fotoğraf seçmek için galeri izni gereklidir',
          [{ text: 'Tamam' }]
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        await processPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(
        '❌ Fotoğraf Hatası',
        'Fotoğraf seçilemedi, lütfen tekrar deneyin',
        [{ text: 'Tamam' }]
      );
    }
  };

  const processPhoto = async (uri: string) => {
    setAiProcessing(true);
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get file extension
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
      
      // Create base64 data URI
      const photoBase64 = `data:${mimeType};base64,${base64}`;
      
      console.log('Uploading photo as base64, size:', base64.length, 'bytes');

      const response = await packageService.uploadCargoPhoto({
        photoBase64,
        siteId: user?.siteId || '1',
        securityUserId: user?.userId || '5',
      });

      if (response.success && response.extractedData) {
        // Auto-fill form with AI extracted data
        setFormData({
          ...response.extractedData,
          aiExtracted: true,
        });
        setAiExtractionLogId(response.aiExtractionLogId);
        
        if (response.validation) {
          setValidation(response.validation);
        }

        Alert.alert(
          '✅ AI İşleme Başarılı',
          `Kargo bilgileri otomatik olarak dolduruldu (${response.responseTimeMs}ms)`,
          [{ text: 'Tamam' }]
        );
      } else {
        // AI failed, allow manual entry
        const errorMsg = response.errorMessage || 'AI servisi şu anda kullanılamıyor, manuel giriş yapabilirsiniz';
        Alert.alert(
          '⚠️ AI Servisi Kullanılamıyor',
          errorMsg,
          [{ text: 'Manuel Giriş Yap', style: 'default' }]
        );
        setFormData({
          fullName: '',
          trackingNumber: '',
          date: '',
          cargoCompany: '',
          apartmentNumber: '',
          notes: '',
          aiExtracted: false,
        });
      }
    } catch (error: any) {
      console.error('AI processing error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Detailed error messages
      let errorMessage = 'AI servisi şu anda kullanılamıyor, manuel giriş yapabilirsiniz';
      
      if (error.message?.includes('Network')) {
        errorMessage = 'Bağlantı hatası, lütfen internet bağlantınızı kontrol edin';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'İşlem zaman aşımına uğradı, lütfen tekrar deneyin';
      } else if (error.message?.includes('File too large')) {
        errorMessage = 'Fotoğraf boyutu çok büyük (maksimum 10MB)';
      } else if (error.message?.includes('Unsupported format')) {
        errorMessage = 'Desteklenmeyen dosya formatı (JPEG, PNG, HEIC desteklenir)';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin';
      } else if (error.message?.includes('Invalid base64')) {
        errorMessage = 'Fotoğraf formatı hatası. Lütfen tekrar deneyin';
      }
      
      Alert.alert(
        '❌ Fotoğraf Yüklenemedi',
        errorMessage,
        [{ text: 'Manuel Giriş Yap', style: 'default' }]
      );
      setFormData({
        fullName: '',
        trackingNumber: '',
        date: '',
        cargoCompany: '',
        apartmentNumber: '',
        notes: '',
        aiExtracted: false,
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const validateField = (field: keyof CargoFormData, value: string): string | null => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Ad Soyad gereklidir';
        if (!/^[A-Za-zçğıöşüÇĞİÖŞÜ ]+$/.test(value)) return 'Sadece harf ve boşluk kullanılabilir';
        return null;
      case 'trackingNumber':
        if (!value.trim()) return 'Takip numarası gereklidir';
        if (!/^\d+$/.test(value)) return 'Sadece rakam kullanılabilir';
        return null;
      case 'date':
        if (!value.trim()) return 'Tarih gereklidir';
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value) && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return 'Geçerli tarih formatı: GG/AA/YYYY veya YYYY-AA-GG';
        }
        return null;
      default:
        return null;
    }
  };

  const handleFieldChange = (field: keyof CargoFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Real-time validation
    const error = validateField(field, value);
    setValidation({
      ...validation,
      fieldErrors: {
        ...validation.fieldErrors,
        [field]: error || '',
      },
    });
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    const fullNameError = validateField('fullName', formData.fullName);
    if (fullNameError) errors.fullName = fullNameError;
    
    const trackingError = validateField('trackingNumber', formData.trackingNumber);
    if (trackingError) errors.trackingNumber = trackingError;
    
    const dateError = validateField('date', formData.date);
    if (dateError) errors.date = dateError;

    setValidation({
      valid: Object.keys(errors).length === 0,
      fieldErrors: errors,
    });

    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(
        '⚠️ Validasyon Hatası',
        'Lütfen tüm gerekli alanları doğru şekilde doldurun',
        [{ text: 'Tamam' }]
      );
      return;
    }

    setLoading(true);
    try {
      const response = await packageService.saveCargo({
        siteId: user?.siteId || '1',
        fullName: formData.fullName,
        trackingNumber: formData.trackingNumber,
        date: formData.date,
        cargoCompany: formData.cargoCompany,
        apartmentNumber: formData.apartmentNumber,
        notes: formData.notes,
        aiExtracted: formData.aiExtracted,
        aiExtractionLogId,
        securityUserId: user?.userId,
      });

      if (response.success) {
        let matchMsg = '';
        let matchDetails = '';
        
        if (response.matchingResult?.matched) {
          matchMsg = '✅ Kargo Eşleştirildi!';
          matchDetails = `Sakin: ${response.matchingResult.message}\nDaire: ${formData.apartmentNumber || 'Bilinmiyor'}\n\n📱 QR kod otomatik tanımlandı\nSakin QR okutarak teslim alabilir`;
        } else {
          matchMsg = '✅ Kargo Kaydedildi';
          matchDetails = 'Eşleşme bulunamadı. Paket manuel olarak teslim edilecek.';
        }

        Alert.alert(matchMsg, matchDetails, [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        const errorMsg = response.errorMessage || 'Kargo kaydedilemedi, lütfen tekrar deneyin';
        Alert.alert('❌ Kayıt Hatası', errorMsg, [{ text: 'Tamam' }]);
      }
    } catch (error: any) {
      console.error('Save cargo error:', error);
      
      // Detailed error messages
      let errorMessage = 'Kargo kaydedilemedi, lütfen tekrar deneyin';
      
      if (error.message?.includes('Network')) {
        errorMessage = 'Bağlantı hatası, lütfen internet bağlantınızı kontrol edin';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'İşlem zaman aşımına uğradı, lütfen tekrar deneyin';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Kargo bulunamadı, güvenlik ile iletişime geçin';
      }
      
      Alert.alert('❌ Kayıt Hatası', errorMessage, [{ text: 'Tamam' }]);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.trackingNumber.trim() !== '' &&
      formData.date.trim() !== '' &&
      Object.values(validation.fieldErrors).every(error => !error)
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Kargo Kaydı</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kargo Fişi Fotoğrafı</Text>
          
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => {
                  setPhotoUri(null);
                  setFormData({
                    fullName: '',
                    trackingNumber: '',
                    date: '',
                    cargoCompany: '',
                    apartmentNumber: '',
                    notes: '',
                    aiExtracted: false,
                  });
                  setAiExtractionLogId(undefined);
                }}
              >
                <X size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage(true)}
                disabled={aiProcessing}
              >
                <Camera size={24} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Fotoğraf Çek</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage(false)}
                disabled={aiProcessing}
              >
                <Upload size={24} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Galeriden Seç</Text>
              </TouchableOpacity>
            </View>
          )}

          {aiProcessing && (
            <View style={styles.aiProcessing}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.aiProcessingText}>AI işleniyor...</Text>
            </View>
          )}

          {formData.aiExtracted && (
            <View style={styles.aiBadge}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={styles.aiBadgeText}>AI ile kaydedildi</Text>
            </View>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kargo Bilgileri</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Ad Soyad <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                validation.fieldErrors.fullName && styles.inputError,
              ]}
              value={formData.fullName}
              onChangeText={(value) => handleFieldChange('fullName', value)}
              placeholder="Örn: Ahmet Yılmaz"
              placeholderTextColor={colors.textSecondary}
            />
            {validation.fieldErrors.fullName && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} />
                <Text style={styles.errorText}>{validation.fieldErrors.fullName}</Text>
              </View>
            )}
          </View>

          {/* Tracking Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Takip Numarası <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                validation.fieldErrors.trackingNumber && styles.inputError,
              ]}
              value={formData.trackingNumber}
              onChangeText={(value) => handleFieldChange('trackingNumber', value)}
              placeholder="Örn: 1234567890"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            {validation.fieldErrors.trackingNumber && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} />
                <Text style={styles.errorText}>{validation.fieldErrors.trackingNumber}</Text>
              </View>
            )}
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Tarih <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                validation.fieldErrors.date && styles.inputError,
              ]}
              value={formData.date}
              onChangeText={(value) => handleFieldChange('date', value)}
              placeholder="GG/AA/YYYY veya YYYY-AA-GG"
              placeholderTextColor={colors.textSecondary}
            />
            {validation.fieldErrors.date && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.error} />
                <Text style={styles.errorText}>{validation.fieldErrors.date}</Text>
              </View>
            )}
          </View>

          {/* Cargo Company */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kargo Şirketi</Text>
            <TextInput
              style={styles.input}
              value={formData.cargoCompany}
              onChangeText={(value) => handleFieldChange('cargoCompany', value)}
              placeholder="Örn: Yurtiçi Kargo"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Apartment Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daire Numarası</Text>
            <TextInput
              style={styles.input}
              value={formData.apartmentNumber}
              onChangeText={(value) => handleFieldChange('apartmentNumber', value)}
              placeholder="Örn: A-101"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notlar</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => handleFieldChange('notes', value)}
              placeholder="Ek notlar..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid() || loading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Save size={20} color={colors.white} />
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  photoContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  aiProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.info + '20',
    borderRadius: borderRadius.md,
  },
  aiProcessingText: {
    fontSize: fontSize.md,
    color: colors.info,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
