import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  Building2,
  Plus,
  MapPin,
  Users,
  Home,
  MoreVertical,
  ChevronRight,
} from "lucide-react-native";
import AddSiteModal from "../superadmin/AddSiteModal";

interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  country?: string;
  totalApartments: number;
  totalResidents: number;
}

const SitesScreen = ({ navigation }: any) => {
  // Mock data for now - in real app this would come from props or API
  const mockSites: Site[] = [
    {
      id: "1",
      name: "Yeşil Vadi Sitesi",
      address: "Ataşehir, İstanbul",
      city: "İstanbul",
      totalApartments: 120,
      totalResidents: 350,
    },
    {
      id: "2",
      name: "Gül Bahçesi Konutları",
      address: "Çankaya, Ankara",
      city: "Ankara",
      totalApartments: 80,
      totalResidents: 220,
    },
  ];

  const currentSite = mockSites[0]; // Mock current site
  const [showAddModal, setShowAddModal] = useState(false);

  const totalStats = {
    apartments: mockSites.reduce((a, b) => a + b.totalApartments, 0),
    residents: mockSites.reduce((a, b) => a + b.totalResidents, 0),
  };

  const handleSiteChange = (site: Site) => {
    // In real app, this would update the current site
    console.log("Switching to site:", site.name);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header Stats */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Site Yönetimi</Text>
          <Text style={styles.headerSubtitle}>
            {mockSites.length} site • {totalStats.apartments} daire •{" "}
            {totalStats.residents} sakin
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Building2 size={20} color="#3B82F6" />
            <Text style={styles.statNumber}>{mockSites.length}</Text>
            <Text style={styles.statLabel}>Site</Text>
          </View>
          <View style={styles.statCard}>
            <Home size={20} color="#10B981" />
            <Text style={styles.statNumber}>{totalStats.apartments}</Text>
            <Text style={styles.statLabel}>Daire</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color="#3B82F6" />
            <Text style={styles.statNumber}>{totalStats.residents}</Text>
            <Text style={styles.statLabel}>Sakin</Text>
          </View>
        </View>

        {/* Sites List */}
        <View style={styles.sitesList}>
          {mockSites.map((site) => (
            <View
              key={site.id}
              style={[
                styles.siteCard,
                currentSite.id === site.id && styles.activeSiteCard,
              ]}
            >
              <View style={styles.siteHeader}>
                <View style={styles.siteInfo}>
                  <View
                    style={[
                      styles.siteIcon,
                      currentSite.id === site.id && styles.activeSiteIcon,
                    ]}
                  >
                    <Building2
                      size={24}
                      color={currentSite.id === site.id ? "#fff" : "#3B82F6"}
                    />
                  </View>
                  <View style={styles.siteDetails}>
                    <View style={styles.siteTitleRow}>
                      <Text style={styles.siteName}>{site.name}</Text>
                      {currentSite.id === site.id && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Aktif</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.locationRow}>
                      <MapPin size={12} color="#6B7280" />
                      <Text style={styles.locationText}>{site.city}</Text>
                    </View>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Home size={12} color="#6B7280" />
                        <Text style={styles.statText}>
                          {site.totalApartments} daire
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Users size={12} color="#6B7280" />
                        <Text style={styles.statText}>
                          {site.totalResidents} sakin
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.menuButton}>
                  <MoreVertical size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {currentSite.id !== site.id && (
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => handleSiteChange(site)}
                >
                  <Text style={styles.switchButtonText}>Bu Siteye Geç</Text>
                  <ChevronRight size={16} color="#3B82F6" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Add Site Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#3B82F6" />
          <Text style={styles.addButtonText}>Yeni Site Ekle</Text>
        </TouchableOpacity>
      </ScrollView>
      <AddSiteModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => setShowAddModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  headerCard: {
    backgroundColor: "#EBF8FF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  sitesList: {
    gap: 12,
    marginBottom: 16,
  },
  siteCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeSiteCard: {
    backgroundColor: "#EBF8FF",
    borderColor: "#BFDBFE",
  },
  siteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  siteInfo: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  siteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EBF8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  activeSiteIcon: {
    backgroundColor: "#3B82F6",
  },
  siteDetails: {
    flex: 1,
  },
  siteTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  siteName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  activeBadge: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#6B7280",
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    gap: 4,
  },
  switchButtonText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "500",
  },
});

export default SitesScreen;
