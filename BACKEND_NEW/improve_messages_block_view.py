#!/usr/bin/env python3
"""Improve messages block view - add resident badges like in AdminResidents screen"""

import re

file_path = 'SiteYonetimApp/src/screens/messages/MessagesScreen.tsx'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the apartment card rendering in renderBlockView
old_apartment_card = '''            {filteredApts.map((apartment) => {
              const lastMsg = getLastMessage(undefined, apartment.id);
              const unreadCount = getUnreadCount(undefined, apartment.id);
              
              return (
                <Pressable
                  key={apartment.id}
                  style={styles.chatCard}
                  onPress={() => {
                    setSelectedApartment(apartment);
                    setChatView('apartment-chat');
                  }}
                >
                  <View style={styles.chatCardRow}>
                    <View style={styles.chatIconApartment}>
                      <Text style={styles.apartmentIconText}>{apartment.number || '?'}</Text>
                    </View>
                    <View style={styles.chatInfo}>
                      <Text style={styles.chatTitle}>Daire {apartment.number || '?'}</Text>
                      <Text style={styles.chatSubtitle}>{apartment.residentName || 'İsimsiz Sakin'}</Text>
                      {lastMsg && (
                        <Text style={styles.chatLastMessage} numberOfLines={1}>
                          {lastMsg.senderId === userId ? 'Sen: ' : ''}{lastMsg.body || ''}
                        </Text>
                      )}
                    </View>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}'''

new_apartment_card = '''            {filteredApts.map((apartment) => {
              const lastMsg = getLastMessage(undefined, apartment.id);
              const unreadCount = getUnreadCount(undefined, apartment.id);
              
              // Daire sakinlerini belirle (residents array'den)
              const residentCount = apartment.residents?.length || 0;
              const hasOwner = apartment.residents?.some((r: any) => r.residentType === 'owner');
              const hasTenant = apartment.residents?.some((r: any) => r.residentType === 'tenant');
              
              return (
                <Pressable
                  key={apartment.id}
                  style={styles.chatCard}
                  onPress={() => {
                    setSelectedApartment(apartment);
                    setChatView('apartment-chat');
                  }}
                >
                  <View style={styles.chatCardRow}>
                    <View style={styles.chatIconApartment}>
                      <Text style={styles.apartmentIconText}>{apartment.number || '?'}</Text>
                    </View>
                    <View style={styles.chatInfo}>
                      <View style={styles.apartmentTitleRow}>
                        <Text style={styles.chatTitle}>Daire {apartment.number || '?'}</Text>
                        <View style={styles.apartmentBadges}>
                          {residentCount > 0 && (
                            <View style={styles.apartmentBadge}>
                              <Text style={styles.apartmentBadgeText}>{residentCount} sakin</Text>
                            </View>
                          )}
                          {hasOwner && (
                            <View style={[styles.apartmentBadge, styles.apartmentBadgeOwner]}>
                              <Text style={styles.apartmentBadgeText}>Malik</Text>
                            </View>
                          )}
                          {hasTenant && (
                            <View style={[styles.apartmentBadge, styles.apartmentBadgeTenant]}>
                              <Text style={styles.apartmentBadgeText}>Kiracı</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={styles.chatSubtitle}>{apartment.residentName || 'İsimsiz Sakin'}</Text>
                      {lastMsg && (
                        <Text style={styles.chatLastMessage} numberOfLines={1}>
                          {lastMsg.senderId === userId ? 'Sen: ' : ''}{lastMsg.body || ''}
                        </Text>
                      )}
                    </View>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}'''

# Replace
if old_apartment_card in content:
    content = content.replace(old_apartment_card, new_apartment_card)
    print("✓ Updated apartment cards in renderBlockView")
else:
    print("⚠ Could not find apartment card code to replace")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Messages block view improved")
