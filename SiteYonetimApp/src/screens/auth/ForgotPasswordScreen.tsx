import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ArrowLeft, ArrowRight, Lock, User, Phone, Shield } from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/apiClient';

type Step = 'username' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('username');
  const [loading, setLoading] = useState(false);

  // Step 1: Username & Phone
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Step 2: OTP
  const [otpCode, setOtpCode] = useState('');

  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOTP = async () => {
    if (!username.trim() || !phoneNumber.trim()) {
      Alert.alert('Hata', 'Lütfen kullanıcı adı ve telefon numaranızı girin');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        phoneNumber: string;
        telegramBotLink?: string;
      }>('/auth/forgot-password/send-otp', {
        username: username.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      // Backend returns VerificationResponse with success field
      if (response.success) {
        Alert.alert('Başarılı', response.message || 'Doğrulama kodu Telegram\'a gönderildi');
        setStep('otp');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Alert.alert(
        'Hata',
        error.message || 'Kullanıcı adı ve telefon numarası eşleşmiyor'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<{
        message: string;
        success: string;
      }>('/auth/forgot-password/verify-otp', {
        phoneNumber: phoneNumber.trim(),
        otpCode: otpCode.trim(),
      });

      // Backend returns { message, success }
      if (response.success) {
        Alert.alert('Başarılı', 'Kod doğrulandı. Yeni şifrenizi belirleyin');
        setStep('newPassword');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      Alert.alert('Hata', error.message || 'Geçersiz doğrulama kodu');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Hata', 'Lütfen her iki şifre alanını da doldurun');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<{
        message: string;
        success: boolean;
      }>('/auth/forgot-password/reset', {
        phoneNumber: phoneNumber.trim(),
        otpCode: otpCode.trim(),
        newPassword: newPassword.trim(),
      });

      // Backend returns { message, success }
      if (response.success) {
        Alert.alert(
          'Başarılı',
          'Şifreniz değiştirildi. Giriş yapabilirsiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Hata', error.message || 'Şifre değiştirilemedi');
    } finally {
      setLoading(false);
    }
  };

  const renderUsernameStep = () => (
    <>
      <View style={styles.iconContainer}>
        <User size={48} color={colors.primary} />
      </View>

      <Text style={styles.title}>Şifremi Unuttum</Text>
      <Text style={styles.subtitle}>
        Kullanıcı adınız ve telefon numaranızı girin
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <User size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı Adı"
            placeholderTextColor={colors.textTertiary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Phone size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Telefon Numarası"
            placeholderTextColor={colors.textTertiary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Kod Gönder</Text>
            <ArrowRight size={20} color={colors.white} />
          </View>
        )}
      </Pressable>
    </>
  );

  const renderOTPStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Shield size={48} color={colors.primary} />
      </View>

      <Text style={styles.title}>Doğrulama Kodu</Text>
      <Text style={styles.subtitle}>
        Telegram'a gönderilen 6 haneli kodu girin
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Shield size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="6 Haneli Kod"
            placeholderTextColor={colors.textTertiary}
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />
        </View>
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Kodu Doğrula</Text>
            <ArrowRight size={20} color={colors.white} />
          </View>
        )}
      </Pressable>

      <Pressable
        style={styles.resendButton}
        onPress={handleSendOTP}
        disabled={loading}
      >
        <Text style={styles.resendText}>Kodu Tekrar Gönder</Text>
      </Pressable>
    </>
  );

  const renderNewPasswordStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Lock size={48} color={colors.primary} />
      </View>

      <Text style={styles.title}>Yeni Şifre</Text>
      <Text style={styles.subtitle}>
        Yeni şifrenizi belirleyin
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Yeni Şifre"
            placeholderTextColor={colors.textTertiary}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Yeni Şifre (Tekrar)"
            placeholderTextColor={colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>
      </View>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Şifreyi Değiştir</Text>
            <ArrowRight size={20} color={colors.white} />
          </View>
        )}
      </Pressable>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.content}>
          {step === 'username' && renderUsernameStep()}
          {step === 'otp' && renderOTPStep()}
          {step === 'newPassword' && renderNewPasswordStep()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.screenPaddingHorizontal,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  inputGroup: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: fontSize.buttonText,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  resendText: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
