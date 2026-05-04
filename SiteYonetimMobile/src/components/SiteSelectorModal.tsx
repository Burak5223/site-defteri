import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, Plus, Building2 } from 'lucide-react-native';
import type { Site } from '../types';
import type { Language } from '../config/i18n';
import { getTranslation } from '../config/i18n';

interface SiteSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  currentSite: Site;
  sites: Site[];
  onSiteChange: (site: Site) => void;
  onAddSite?: () => void;
  lang?: Language;
}

export function SiteSelectorModal({
  visible,
  onClose,
  currentSite,
  sites,
  onSiteChange,
  onAddSite,
  lang = 'tr',
}: SiteSelectorModalProps) {
  const t = (key: any) => getTranslation(lang, key);

  const handleSiteSelect = (site: Site) => {
    onSiteChange(site);
    onClose();
  };

  const getApartmentsText = () => {
    switch (lang) {
      case 'en': return 'apartments';
      case 'ru': return 'квартир';
      case 'ar': return 'شقة';
      default: return 'daire';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('sites_switch')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Site List */}
          <ScrollView style={styles.content}>
            {sites.map((site) => {
              const isSelected = currentSite.id === site.id;
              
              return (
                <TouchableOpacity
                  key={site.id}
                  onPress={() => handleSiteSelect(site)}
                  style={[
                    styles.siteItem,
                    isSelected && styles.siteItemActive,
                  ]}
                >
                  <View style={[
                    styles.siteIcon,
                    isSelected && styles.siteIconActive,
                  ]}>
                    <Building2 
                      size={20} 
                      color={isSelected ? '#fff' : '#6366f1'} 
                    />
                  </View>
                  <View style={styles.siteInfo}>
                    <Text style={[
                      styles.siteName,
                      isSelected && styles.siteNameActive,
                    ]}>
                      {site.name}
                    </Text>
                    <Text style={[
                      styles.siteDetails,
                      isSelected && styles.siteDetailsActive,
                    ]}>
                      {site.city} • {site.totalApartments} {getApartmentsText()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Add Site Button */}
          {onAddSite && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onAddSite();
                }}
                style={styles.addButton}
              >
                <Plus size={20} color="#6366f1" />
                <Text style={styles.addButtonText}>{t('sites_add')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
    padding: 8,
  },
  siteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  siteItemActive: {
    backgroundColor: '#6366f1',
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  siteNameActive: {
    color: '#fff',
  },
  siteDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  siteDetailsActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
});
