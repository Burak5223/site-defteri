#!/usr/bin/env python3
"""Fix apartment picker bug - apartments not showing and all getting selected"""

file_path = 'SiteYonetimApp/src/screens/residents/AdminResidents.tsx'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Old buggy code
old_code = '''                              {/* Apartment list */}
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
                                                </Text>'''

# Fixed code with proper field names and string comparison
new_code = '''                              {/* Apartment list */}
                              <ScrollView style={styles.apartmentPickerList} nestedScrollEnabled>
                                {apartments
                                  .filter((apt) => 
                                    !apartmentSearchQuery || 
                                    String(apt.unitNumber || apt.apartmentNumber || '').includes(apartmentSearchQuery)
                                  )
                                  .map((apt) => {
                                    const aptNumber = apt.unitNumber || apt.apartmentNumber;
                                    const residentCount = apt.residents?.length || 0;
                                    const hasOwner = apt.residents?.some((r: any) => r.residentType === 'owner');
                                    const hasTenant = apt.residents?.some((r: any) => r.residentType === 'tenant');
                                    const isSelected = String(formData.apartmentNumber) === String(aptNumber);
                                    
                                    return (
                                      <Pressable
                                        key={apt.id}
                                        style={[
                                          styles.apartmentPickerItem,
                                          isSelected && styles.apartmentPickerItemSelected
                                        ]}
                                        onPress={() => {
                                          setFormData({ ...formData, apartmentNumber: String(aptNumber) });
                                          setShowApartmentPicker(false);
                                          setApartmentSearchQuery('');
                                        }}
                                      >
                                        <View style={styles.apartmentPickerItemLeft}>
                                          <Text style={[
                                            styles.apartmentPickerItemNumber,
                                            isSelected && styles.apartmentPickerItemNumberSelected
                                          ]}>
                                            {aptNumber}
                                          </Text>
                                          <View style={styles.apartmentPickerBadges}>
                                            {residentCount > 0 && (
                                              <View style={styles.apartmentPickerBadge}>
                                                <Text style={styles.apartmentPickerBadgeText}>
                                                  {residentCount} sakin
                                                </Text>'''

# Replace all occurrences
count = content.count(old_code)
content = content.replace(old_code, new_code)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ Fixed apartment picker bug ({count} instances)")
