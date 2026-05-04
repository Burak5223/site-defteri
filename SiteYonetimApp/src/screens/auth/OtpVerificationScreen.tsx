import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  Building2,
  ArrowLeft,
  CheckCircle,
  MessageCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, lightTheme } from '../../theme';
import { authService } from '../../services/auth.service';

const OtpVerificationScreen = ({ navigation, route }: any) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs for each input
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Lütfen 6 haneli kodu giriniz.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authService.verifyOtp({
        phoneNumber,
        otpCode,
      });

      Alert.alert(
        'Başarılı',
        'Doğrulama tamamlandı! Şimdi giriş yapabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err: any) {
      setError(err.message || 'Doğrulama başarısız. Lütfen kodu kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTelegram = () => {
    Linking.openURL('https://t.me/SiteYonetimBot').catch(() => {
      Alert.alert('Hata', 'Telegram açılamadı. Lütfen Telegram uygulamasını yükleyiniz.');
    });
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={colors.textPrimary} />
        <Text style={styles.backText}>Geri</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <MessageCircle size={40} color={lightTheme.colors.primary} />
          </View>
          <Text style={styles.title}>Telegram Doğrulama</Text>
          <Text style={styles.subtitle}>
            Telegram'dan gelen 6 haneli kodu giriniz
          </Text>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>Nasıl kod alırım?</Text>
          <Text style={styles.instructionText}>
            1. Telegram uygulamasını açın{'\n'}
            2. @SiteYonetimBot botunu bulun{'\n'}
            3. /start yazın ve telefon numaranızı paylaşın{'\n'}
            4. Size gönderilen 6 haneli kodu buraya girin
          </Text>
          <Pressable style={styles.telegramButton} onPress={handleOpenTelegram}>
            <MessageCircle size={20} color="#ffffff" />
            <Text style={styles.telegramButtonText}>Telegram'ı Aç</Text>
          </Pressable>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={styles.verifyContent}>
              <CheckCircle size={20} color="#ffffff" />
              <Text style={styles.verifyText}>Doğrula</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.phoneInfo}>
          <Text style={styles.phoneInfoText}>
            Kod gönderilen numara: {phoneNumber}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default OtpVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  backText: {
    fontSize: fontSize.cardTitle,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  instructionBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.cardSm,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  instructionTitle: {
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0088cc',
    borderRadius: borderRadius.cardSm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  telegramButtonText: {
    color: '#ffffff',
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.cardSm,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  errorText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  verifyButton: {
    height: 48,
    borderRadius: borderRadius.cardSm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  verifyButtonDisabled: {
    opacity: 0.8,
  },
  verifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  verifyText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  phoneInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  phoneInfoText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
