"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Send, 
  User,
  Search,
  ArrowLeft,
  Building2
} from "lucide-react"

interface Admin {
  id: string
  name: string
  email: string
  sitesCount: number
  unreadCount: number
}

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
  isMe: boolean
}

const mockAdmins: Admin[] = [
  { id: "admin-1", name: "Ahmet Yılmaz", email: "ahmet@site.com", sitesCount: 2, unreadCount: 3 },
  { id: "admin-2", name: "Cevat Kaya", email: "cevat@site.com", sitesCount: 3, unreadCount: 0 },
  { id: "admin-3", name: "Ayşe Demir", email: "ayse@site.com", sitesCount: 1, unreadCount: 1 },
]

const mockMessages: Record<string, Message[]> = {
  "admin-1": [
    { id: "1", senderId: "admin-1", senderName: "Ahmet Yılmaz", text: "Merhaba, Yeşil Vadi Sitesi'nde bir sorun var", timestamp: "10:30", isMe: false },
    { id: "2", senderId: "super", senderName: "Ben", text: "Merhaba Ahmet Bey, ne gibi bir sorun?", timestamp: "10:32", isMe: true },
    { id: "3", senderId: "admin-1", senderName: "Ahmet Yılmaz", text: "Asansör bakımı için onay bekliyoruz", timestamp: "10:35", isMe: false },
  ],
  "admin-2": [
    { id: "1", senderId: "admin-2", senderName: "Cevat Kaya", text: "Günaydın, raporları gönderdim", timestamp: "09:15", isMe: false },
    { id: "2", senderId: "super", senderName: "Ben", text: "Teşekkürler, inceleyeceğim", timestamp: "09:20", isMe: true },
  ],
  "admin-3": [
    { id: "1", senderId: "admin-3", senderName: "Ayşe Demir", text: "Yeni sakin kaydı için yardım lazım", timestamp: "14:20", isMe: false },
  ],
}

export function SuperAdminMessagesPage() {
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageText, setMessageText] = useState("")
  const [messages, setMessages] = useState<Message[]>([])

  const filteredAdmins = mockAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectAdmin = (admin: Admin) => {
    setSelectedAdmin(admin)
    setMessages(mockMessages[admin.id] || [])
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedAdmin) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "super",
      senderName: "Ben",
      text: messageText,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      isMe: true
    }

    setMessages([...messages, newMessage])
    setMessageText("")
  }

  // Chat view
  if (selectedAdmin) {
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedAdmin(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{selectedAdmin.name}</p>
              <p className="text-xs text-muted-foreground">{selectedAdmin.sitesCount} site yöneticisi</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${message.isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder="Mesaj yazın..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Admin list view
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Mesajlar</h1>
        <p className="text-sm text-muted-foreground">Site yöneticileriyle mesajlaşın</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Yönetici ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Admin List */}
      <div className="space-y-2">
        {filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Yönetici bulunamadı</p>
          </div>
        ) : (
          filteredAdmins.map((admin) => (
            <Card
              key={admin.id}
              className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleSelectAdmin(admin)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{admin.name}</p>
                      {admin.unreadCount > 0 && (
                        <Badge variant="default" className="ml-2">
                          {admin.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{admin.sitesCount} site</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

