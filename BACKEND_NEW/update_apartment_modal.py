#!/usr/bin/env python3
"""Update apartment selection modal to show badges instead of Dolu/Boş"""

file_path = 'SiteYonetimApp/src/screens/residents/AdminResidents.tsx'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Old code to replace
old_code = '''                            {apartments.map((apt) => (
                              <Pressable
                                key={apt.id}
                                style={[
                                  styles.apartmentItem,
                                  formData.apartmentNumber === apt.apartmentNumber && styles.apartmentItemSelected
                                ]}
                                onPress={() => setFormData({ ...formData, apartmentNumber: apt.apartmentNumber })}
                              >
                                <Text style={[
                                  styles.apartmentItemText,
                                  formData.apartmentNumber === apt.apartmentNumber && styles.apartmentItemTextSelected
                                ]}>
                                  Daire {apt.apartmentNumber} - {apt.status === 'bos' ? 'Boş' : 'Dolu'}
                                </Text>
                              </Pressable>
                            ))}'''

# New code with badges
new_code = '''                            {apartments.map((apt) => {
                              const residentCount = apt.residents?.length || 0;
                              const hasOwner = apt.residents?.some((r: any) => r.residentType === 'owner');
                              const hasTenant = apt.residents?.some((r: any) => r.residentType === 'tenant');
                              
                              return (
                                <Pressable
                                  key={apt.id}
                                  style={[
                                    styles.apartmentItem,
                                    formData.apartmentNumber === apt.apartmentNumber && styles.apartmentItemSelected
                                  ]}
                                  onPress={() => setFormData({ ...formData, apartmentNumber: apt.apartmentNumber })}
                                >
                                  <View style={styles.apartmentItemContent}>
                                    <Text style={[
                                      styles.apartmentItemText,
                                      formData.apartmentNumber === apt.apartmentNumber && styles.apartmentItemTextSelected
                                    ]}>
                                      Daire {apt.apartmentNumber}
                                    </Text>
                                    <View style={styles.apartmentItemBadges}>
                                      {residentCount > 0 && (
                                        <View style={styles.apartmentBadge}>
                                          <Text style={styles.apartmentBadgeText}>{residentCount} sakin</Text>
                                        </View>
                                      )}
                                      {hasOwner && (
                                        <View style={[styles.apartmentBadge, styles.apartmentBadgeOwner]}>
                                          <Text style={[styles.apartmentBadgeText, styles.apartmentBadgeTextLight]}>Malik</Text>
                                        </View>
                                      )}
                                      {hasTenant && (
                                        <View style={[styles.apartmentBadge, styles.apartmentBadgeTenant]}>
                                          <Text style={[styles.apartmentBadgeText, styles.apartmentBadgeTextLight]}>Kiracı</Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                </Pressable>
                              );
                            })}'''

# Replace all occurrences
content = content.replace(old_code, new_code)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Updated apartment selection modal (both instances)")
