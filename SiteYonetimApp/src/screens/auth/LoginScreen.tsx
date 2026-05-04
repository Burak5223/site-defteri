import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, borderRadius, fontSize, fontWeight, iconSize, lightTheme } from '../../theme';

const LoginScreen = ({ navigation }: any) => {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
        setError(err.message || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Yönetici', email: 'admin@site.com', label: 'Yönetici', isHighlighted: true },
    { role: 'Genel Yönetici', email: 'superadmin@site.com', label: 'Genel Yönetici', isHighlighted: false },
    { role: 'Sakin', email: 'sakin@site.com', label: 'Sakin', isHighlighted: false },
    { role: 'Güvenlik', email: 'guvenlik@site.com', label: 'Güvenlik', isHighlighted: false },
    { role: 'Temizlik', email: 'temizlik@site.com', label: 'Temizlik Personeli', isHighlighted: false },
  ];

  const fillDemoAccount = (accEmail: string) => {
    setEmail(accEmail);
    const rolePrefix = accEmail.split('@')[0];
    setPassword(`${rolePrefix}123`); 
  };

  return (
    <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
            <View style={styles.logoWrapper}>
                <Building2 size={40} color={lightTheme.colors.primary} />
            </View>
            <Text style={styles.title}>Site Yönetimi</Text>
            <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
            </View>

            <View style={styles.form}>
            <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-posta</Text>
                <View style={styles.inputWrapper}>
                <Mail
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                />
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

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Şifre</Text>
                <View style={styles.inputWrapper}>
                <Lock
                    size={20}
                    color="#6b7280"
                    style={styles.inputIcon}
                />
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
            >
                {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                <View style={styles.submitContent}>
                    <Text style={styles.submitText}>Giriş Yap</Text>
                    <ArrowRight size={20} color="#ffffff" />
                </View>
                )}
            </Pressable>

            <View style={styles.forgotWrapper}>
                <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotText}>Şifremi Unuttum</Text>
                </Pressable>
            </View>

            {/* Register Button */}
            <View style={styles.registerWrapper}>
                <Text style={styles.registerPrompt}>Hesabınız yok mu?</Text>
                <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Kayıt Ol</Text>
                </Pressable>
            </View>
            </View>
            
            {/* Demo Accounts Section */}
            <View style={styles.demoContainer}>
                <Text style={styles.demoText}>Demo Hesaplar (Password: rol123)</Text>
                <View style={styles.demoGrid}>
                    {demoAccounts.map((acc, index) => (
                        <Pressable 
                            key={index} 
                            style={[
                                styles.demoButton,
                                acc.isHighlighted && styles.demoButtonHighlighted
                            ]}
                            onPress={() => fillDemoAccount(acc.email)}
                        >
                            <Text style={[
                                styles.demoButtonText,
                                acc.isHighlighted && styles.demoButtonTextHighlighted
                            ]}>{acc.label}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2026 Site Yönetimi</Text>
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: spacing.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: 40,
    paddingBottom: spacing.xl,
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
    marginBottom: spacing.rowGap,
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.iconMargin,
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
  },
  form: {
    marginTop: spacing.sm,
    rowGap: spacing.sectionGap,
  },
  fieldGroup: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.labelText,
    color: colors.textPrimary,
    marginBottom: 4,
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
  errorText: {
    fontSize: fontSize.cardSubtitle,
    color: colors.error,
    textAlign: 'center',
    marginTop: 4,
  },
  submitButton: {
    marginTop: spacing.sm,
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
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginRight: spacing.sm,
  },
  forgotWrapper: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: fontSize.cardTitle,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  registerWrapper: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  registerPrompt: {
    fontSize: fontSize.cardTitle,
    color: colors.textSecondary,
  },
  registerLink: {
    fontSize: fontSize.cardTitle,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  demoContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  demoText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  demoButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.iconMargin,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  demoButtonHighlighted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  demoButtonText: {
    fontSize: fontSize.cardMeta,
    color: colors.textPrimary,
  },
  demoButtonTextHighlighted: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.cardMeta,
    color: colors.textSecondary,
  },
});
