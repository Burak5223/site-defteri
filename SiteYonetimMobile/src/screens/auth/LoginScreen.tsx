import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
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
import { spacing } from '../../theme';

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Lütfen e-posta ve şifre girin');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password: password.trim() });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Building2 size={40} color="#0f766e" />
            </View>
            <Text style={styles.title}>Site Yönetim Paneli</Text>
            <Text style={styles.subtitle}>
              Giriş yaparak sitenizi yönetin
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>E-posta</Text>
              <View style={styles.inputWrapper}>
                <Mail
                  size={20}
                  color="#6b7280"
                  style={[styles.inputIcon, styles.iconLeft]}
                />
                <TextInput
                  style={[styles.input, styles.inputLtrWithIcon]}
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
                  style={[styles.inputIcon, styles.iconLeft]}
                />
                <TextInput
                  style={[styles.input, styles.inputLtrPassword]}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={[styles.eyeButton, styles.iconRight]}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </Pressable>
              </View>
            </View>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

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
              <Pressable onPress={() => {}}>
                <Text style={styles.forgotText}>Şifremi unuttum</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 Site Yönetim</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  container: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(15,118,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#020617',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    marginTop: 8,
    rowGap: 14,
  },
  fieldGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#020617',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#020617',
    backgroundColor: '#ffffff',
    height: 48,
  },
  inputIcon: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
  },
  iconLeft: {
    left: 12,
  },
  iconRight: {
    right: 12,
  },
  inputLtrWithIcon: {
    paddingLeft: 40,
  },
  inputLtrPassword: {
    paddingLeft: 40,
    paddingRight: 40,
  },
  eyeButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0f766e',
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
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  forgotWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 13,
    color: '#0f766e',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#6b7280',
  },
});

export default LoginScreen;
