import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import {
  Building,
  CreditCard,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { colors, lightTheme, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  accountHolder: string;
  isActive: boolean;
}

const SiteSettingsScreen = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  // Mock data
  const currentSiteName = 'Yeşil Vadi Sitesi'; 

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: 'Ziraat Bankası',
      iban: 'TR12 3456 7890 1234 5678 9012 34',
      accountHolder: 'Yeşil Vadi Sitesi Yönetimi',
      isActive: true,
    },
  ]);

  const [newAccount, setNewAccount] = useState({
    bankName: '',
    iban: '',
    accountHolder: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddAccount = () => {
    if (newAccount.bankName && newAccount.iban && newAccount.accountHolder) {
      setBankAccounts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ...newAccount,
          isActive: false,
        },
      ]);
      setNewAccount({
        bankName: '',
        iban: '',
        accountHolder: '',
      });
      setShowAddForm(false);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, isActive: !acc.isActive } : acc))
    );
  };

  const formatIBAN = (iban: string) =>
    iban
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim();

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Building size={22} color="#0f766e" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('siteSettings.title')}</Text>
            <Text style={styles.headerSubtitle}>{currentSiteName}</Text>
          </View>
        </View>

        {/* Bank accounts section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <View style={styles.sectionTitleRow}>
              <CreditCard size={16} color="#111827" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>{t('siteSettings.bankAccounts')}</Text>
            </View>
            <Text style={styles.sectionSubtitle}>{t('siteSettings.bankAccountsSubtitle')}</Text>
          </View>
          {!showAddForm && (
            <Pressable style={styles.primaryButton} onPress={() => setShowAddForm(true)}>
              <Plus size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.primaryButtonText}>{t('common.add')}</Text>
            </Pressable>
          )}
        </View>

        {/* Add form */}
        {showAddForm && (
          <View style={styles.cardHighlight}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('siteSettings.bankName')}</Text>
              <TextInput
                placeholder={t('siteSettings.bankNamePlaceholder')}
                placeholderTextColor="#9ca3af"
                style={styles.input}
                value={newAccount.bankName}
                onChangeText={(text) => setNewAccount((prev) => ({ ...prev, bankName: text }))}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('siteSettings.iban')}</Text>
              <TextInput
                placeholder={t('siteSettings.ibanPlaceholder')}
                placeholderTextColor="#9ca3af"
                style={[styles.input, styles.ibanInput]}
                value={newAccount.iban}
                onChangeText={(text) => setNewAccount((prev) => ({ ...prev, iban: formatIBAN(text) }))}
                maxLength={32}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('siteSettings.accountHolder')}</Text>
              <TextInput
                placeholder={t('siteSettings.accountHolderPlaceholder')}
                placeholderTextColor="#9ca3af"
                style={styles.input}
                value={newAccount.accountHolder}
                onChangeText={(text) => setNewAccount((prev) => ({ ...prev, accountHolder: text }))}
              />
            </View>
            <View style={styles.actionsRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setShowAddForm(false);
                  setNewAccount({
                    bankName: '',
                    iban: '',
                    accountHolder: '',
                  });
                }}
              >
                <Text style={styles.secondaryButtonText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton,
                  styles.flexButton,
                  (!newAccount.bankName || !newAccount.iban || !newAccount.accountHolder) && {
                    opacity: 0.6,
                  },
                ]}
                disabled={!newAccount.bankName || !newAccount.iban || !newAccount.accountHolder}
                onPress={handleAddAccount}
              >
                <Save size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* List */}
        {bankAccounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <CreditCard size={40} color="rgba(148,163,184,0.8)" />
            <Text style={styles.emptyText}>{t('siteSettings.noBankAccounts')}</Text>
          </View>
        ) : (
          <View style={styles.listSpace}>
            {bankAccounts.map((account) => (
              <View
                key={account.id}
                style={[styles.accountCard, account.isActive && styles.accountCardActive]}
              >
                <View style={styles.accountHeaderRow}>
                  <View style={styles.accountTitleCol}>
                    <View style={styles.accountTitleRow}>
                      <Text style={styles.accountBank}>{account.bankName}</Text>
                      {account.isActive && (
                        <View style={styles.activeBadge}>
                          <CheckCircle2 size={12} color="#ffffff" style={{ marginRight: 4 }} />
                          <Text style={styles.activeBadgeText}>{t('adminSites.active')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountHolder}>{account.accountHolder}</Text>
                  </View>
                  <Pressable
                    style={styles.trashButton}
                    onPress={() => handleDeleteAccount(account.id)}
                  >
                    <Trash2 size={18} color="#dc2626" />
                  </Pressable>
                </View>
                <View style={styles.ibanBox}>
                  <Text style={styles.ibanLabel}>{t('siteSettings.iban')}</Text>
                  <Text style={styles.ibanValue}>{account.iban}</Text>
                </View>
                <View style={styles.accountFooterRow}>
                  <Text style={styles.footerLabel}>{t('siteSettings.showInPayments')}</Text>
                  <Pressable
                    style={[styles.switchOuter, account.isActive && styles.switchOuterOn]}
                    onPress={() => handleToggleActive(account.id)}
                  >
                    <View
                      style={[styles.switchInner, account.isActive && styles.switchInnerOn]}
                    />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrapper}>
            <AlertCircle size={16} color="#f97316" />
          </View>
          <Text style={styles.infoText}>
            {t('siteSettings.ibanInfo')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SiteSettingsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(15,118,110,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020617',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020617',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0f766e',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardHighlight: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.4)',
    backgroundColor: 'rgba(15,118,110,0.04)',
    padding: 10,
  },
  fieldGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    backgroundColor: colors.background,
  },
  ibanInput: {
    fontFamily: 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    color: '#374151',
  },
  flexButton: {
    flex: 1,
  },
  listSpace: {
    gap: 10,
    marginTop: 8,
  },
  emptyCard: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  accountCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: colors.background,
    padding: 10,
  },
  accountCardActive: {
    borderColor: 'rgba(16,185,129,0.6)',
    backgroundColor: 'rgba(16,185,129,0.04)',
  },
  accountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  accountTitleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  accountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountBank: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginRight: 6,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#16a34a',
  },
  activeBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  accountHolder: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  trashButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ibanBox: {
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  ibanLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  ibanValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#111827',
  },
  accountFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  footerLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  switchOuter: {
    width: 42,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  switchOuterOn: {
    backgroundColor: '#0f766e',
  },
  switchInner: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
  },
  switchInnerOn: {
    alignSelf: 'flex-end',
  },
  infoCard: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(254,249,195,1)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#92400e',
  },
});

