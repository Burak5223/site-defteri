#!/usr/bin/env python3
"""Improve apartment selector in edit modal - make it cleaner and more user-friendly"""

file_path = 'SiteYonetimApp/src/screens/residents/AdminResidents.tsx'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Old apartment selector code
old_code = '''                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Daire No</Text>
                      {showEditModal && apartments.length > 0 ? (
                        <View>
                          <Text style={styles.helperText}>Mevcut: {selectedResident?.apartmentNumber || 'Yok'}</Text>
                          <ScrollView style={styles.apartmentList} nestedScrollEnabled>
                            {apartments.map((apt) => {
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
                            })}
                          </ScrollView>
                        </View>
                      ) : (
                        <TextInput
                          style={styles.input}
                          placeholder="Örn: 12"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                          value={formData.apartmentNumber}
                          onChangeText={(text) => setFormData({ ...formData, apartmentNumber: text })}
                        />
                      )}
                    </View>'''

# New improved apartment selector with search and better layout
new_code = '''                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Daire No</Text>
                      {showEditModal && apartments.length > 0 ? (
                        <View>
                          <Text style={styles.helperText}>
                            Mevcut: {selectedResident?.apartmentNumber || 'Yok'}
                          </Text>
                          
                          {/* Selected apartment display */}
                          <Pressable 
                            style={styles.apartmentSelector}
                            onPress={() => setShowApartmentPicker(!showApartmentPicker)}
                          >
                            <Text style={styles.apartmentSelectorText}>
                              {formData.apartmentNumber ? `Daire ${formData.apartmentNumber}` : 'Daire seçin...'}
                            </Text>
                            <ChevronDown size={20} color={colors.textSecondary} />
                          </Pressable>

                          {/* Apartment picker modal */}
                          {showApartmentPicker && (
                            <View style={styles.apartmentPickerContainer}>
                              {/* Search input */}
                              <View style={styles.apartmentSearchContainer}>
                                <Search size={16} color={colors.textSecondary} />
                                <TextInput
                                  style={styles.apartmentSearchInput}
                                  placeholder="Daire ara..."
                                  placeholderTextColor={colors.textSecondary}
                                  value={apartmentSearchQuery}
                                  onChangeText={setApartmentSearchQuery}
                                />
                              </View>

                              {/* Apartment list */}
                              <ScrollView style={styles.apartmentPickerList} nestedScrollEnabled>
                                {apartments
                                  .filter((apt) => 
                                    !apartmentSearchQuery || 
                                    apt.apartmentNumber?.toString().includes(apartmentSearchQuery)
                                  )
                                  .map((apt) => {
                                    const residentCount = apt.residents?.length || 0;
                                    const hasOwner = apt.residents?.some((r: any) => r.residentType === 'owner');
                                    const hasTenant = apt.residents?.some((r: any) => r.residentType === 'tenant');
                                    const isSelected = formData.apartmentNumber === apt.apartmentNumber;
                                    
                                    return (
                                      <Pressable
                                        key={apt.id}
                                        style={[
                                          styles.apartmentPickerItem,
                                          isSelected && styles.apartmentPickerItemSelected
                                        ]}
                                        onPress={() => {
                                          setFormData({ ...formData, apartmentNumber: apt.apartmentNumber });
                                          setShowApartmentPicker(false);
                                          setApartmentSearchQuery('');
                                        }}
                                      >
                                        <View style={styles.apartmentPickerItemLeft}>
                                          <Text style={[
                                            styles.apartmentPickerItemNumber,
                                            isSelected && styles.apartmentPickerItemNumberSelected
                                          ]}>
                                            {apt.apartmentNumber}
                                          </Text>
                                          <View style={styles.apartmentPickerBadges}>
                                            {residentCount > 0 && (
                                              <View style={styles.apartmentPickerBadge}>
                                                <Text style={styles.apartmentPickerBadgeText}>
                                                  {residentCount} sakin
                                                </Text>
                                              </View>
                                            )}
                                            {hasOwner && (
                                              <View style={[styles.apartmentPickerBadge, styles.apartmentPickerBadgeOwner]}>
                                                <Text style={styles.apartmentPickerBadgeText}>Malik</Text>
                                              </View>
                                            )}
                                            {hasTenant && (
                                              <View style={[styles.apartmentPickerBadge, styles.apartmentPickerBadgeTenant]}>
                                                <Text style={styles.apartmentPickerBadgeText}>Kiracı</Text>
                                              </View>
                                            )}
                                          </View>
                                        </View>
                                        {isSelected && (
                                          <View style={styles.apartmentPickerCheck}>
                                            <Text style={styles.apartmentPickerCheckText}>✓</Text>
                                          </View>
                                        )}
                                      </Pressable>
                                    );
                                  })}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      ) : (
                        <TextInput
                          style={styles.input}
                          placeholder="Örn: 12"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                          value={formData.apartmentNumber}
                          onChangeText={(text) => setFormData({ ...formData, apartmentNumber: text })}
                        />
                      )}
                    </View>'''

# Replace all occurrences
content = content.replace(old_code, new_code)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Improved apartment selector (both instances)")
