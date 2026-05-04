import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, lightTheme } from '../../theme';
import { authService } from '../../services/auth.service';

const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Validation
    if (!fullName || !phoneNumber || !email || !password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Backend'e kayıt isteği gönder
      // Telefon ve ad soyad ile doğrulama yapılacak
      const response = await authService.register({
        fullName,
        phoneNumber,
        email,
        password,
      });

      // Check if OTP verification is required
      if (response.requiresOtp) {
        if (response.telegramBotLink) {
          Alert.alert(
            'Telegram Doğrulama',
            'Kayıt bilgileriniz alındı. Sizi Telegram botuna yönlendiriyoruz. Lütfen Telegram üzerinden bildirimlere izin verip kodu alınız.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  try {
                    Linking.openURL(response.telegramBotLink!);
                  } catch (e) {
                    console.log('Error opening telegram link', e);
                  }
                  navigation.navigate('OtpVerification', { phoneNumber });
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Telegram Doğrulama',
            'Kayıt bilgileriniz alındı. Lütfen Telegram\'dan gelen 6 haneli kodu giriniz.',
            [
              {
                text: 'Tamam',
                onPress: () => navigation.navigate('OtpVerification', { phoneNumber }),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Başarılı',
          'Kayıt işleminiz tamamlandı. Şimdi giriş yapabilirsiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }
    } catch (err: any) {
      setError(err.message || 'Kayıt yapılamadı. Bilgilerinizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.textPrimary} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Building2 size={40} color={lightTheme.colors.primary} />
          </View>
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ahmet Yılmaz"
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+90 555 123 4567"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
            <Text style={styles.helperText}>
              Yöneticinizin kaydettiği telefon numaranızı giriniz
            </Text>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ornek@site.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Şifre Tekrar</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <View style={styles.submitContent}>
                <CheckCircle size={20} color="#ffffff" />
                <Text style={styles.submitText}>Kayıt Ol</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.loginWrapper}>
            <Text style={styles.loginPrompt}>Zaten hesabınız var mı?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Site Yönetimi</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  },
  form: {
    marginTop: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.labelText,
    color: colors.textPrimary,
    marginBottom: 4,
    fontWeight: fontWeight.medium,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.cardSm,
    paddingVertical: spacing.inputPaddingVertical,
    paddingHorizontal: spacing.inputPaddingHorizontal,
    paddingLeft: 40,
    fontSize: fontSize.inputText,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    height: 48,
  },
  inputIcon: {
    position: 'absolute',
    left: spacing.inputPaddingHorizontal,
    top: '50%',
    marginTop: -10,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.inputPaddingHorizontal,
    top: '50%',
    marginTop: -12,
  },
  helperText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: borderRadius.cardSm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  loginWrapper: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  loginPrompt: {
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: fontSize.cardTitle,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
});
