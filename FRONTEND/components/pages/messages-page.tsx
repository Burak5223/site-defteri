"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Shield, Users, ChevronLeft, Search, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { UserRole, Site } from "@/lib/types"
import { cn } from "@/lib/utils"
import { communicationService, type Message } from "@/lib/services/communication.service"
import { useToast } from "@/hooks/use-toast"

interface MessagesPageProps {
  role: UserRole
  userId: string
  currentSite: Site
}

type ChatView = "list" | "group" | "security-chat"

export function MessagesPage({ role, userId, currentSite }: MessagesPageProps) {
  const [chatView, setChatView] = useState<ChatView>("list")
  const [messageText, setMessageText] = useState("")
  const [groupMessages, setGroupMessages] = useState<Message[]>([])
  const [securityMessages, setSecurityMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatView, groupMessages.length, securityMessages.length])

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      const [group, security] = await Promise.all([
        communicationService.getGroupMessages(currentSite.id),
        communicationService.getMySecurityMessages(currentSite.id)
      ])
      setGroupMessages(group)
      setSecurityMessages(security)
    } catch (error) {
      console.error("Failed to load messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (chatType: string, receiverId?: string) => {
    if (!messageText.trim()) return

    try {
      await communicationService.sendMessage({
        siteId: currentSite.id,
        receiverId,
        chatType,
        body: messageText.trim()
      })
      setMessageText("")
      loadMessages()
      toast({
        title: "Başarılı",
        description: "Mesaj gönderildi"
      })
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi",
        variant: "destructive"
      })
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Bugün"
    if (diffDays === 1) return "Dün"
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
  }

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const getRoleColor = (r: string) => {
    switch (r) {
      case "admin":
        return "bg-primary text-primary-foreground"
      case "security":
        return "bg-amber-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const renderChatList = () => (
    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
      <div className="p-4 space-y-3">
        <h2 className="font-semibold text-lg">Mesajlar</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Site Group Chat */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setChatView("group")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{currentSite.name}</h3>
                <p className="text-sm text-muted-foreground">Grup Sohbeti</p>
                {groupMessages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {groupMessages[groupMessages.length - 1].senderName}: {groupMessages[groupMessages.length - 1].body}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Chat */}
        <div className="flex items-center gap-2 pt-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-muted-foreground uppercase">Güvenlik Sohbeti</span>
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setChatView("security-chat")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Güvenlik</h3>
                <p className="text-sm text-muted-foreground">Paket/Ziyaretçi Bildirimleri</p>
                {securityMessages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {securityMessages[securityMessages.length - 1].body}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )

  const renderGroupChat = () => (
    <motion.div key="group" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setChatView("list")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{currentSite.name}</h2>
          <p className="text-xs text-muted-foreground">Grup Sohbeti</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages.map((message, index) => {
          const isOwn = message.senderId === userId
          const showDate = index === 0 || formatDate(message.createdAt) !== formatDate(groupMessages[index - 1].createdAt)
          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}
              <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                {!isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={getRoleColor(message.senderRole)}>
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-[75%]", isOwn && "items-end")}>
                  {!isOwn && <p className="text-xs text-muted-foreground mb-1 ml-1">{message.senderName}</p>}
                  <div className={cn("px-3 py-2 rounded-2xl", isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                  </div>
                  <p className={cn("text-[10px] text-muted-foreground mt-1", isOwn ? "text-right mr-1" : "ml-1")}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Mesaj yazın..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage("group")}
          />
          <Button size="icon" onClick={() => sendMessage("group")} disabled={!messageText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )

  const renderSecurityChat = () => (
    <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setChatView("list")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">Güvenlik</h2>
          <p className="text-xs text-muted-foreground">Özel Sohbet</p>
        </div>
      </div>

      <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
        <p className="text-xs text-amber-600">Bu sohbet sadece sizinle güvenlik arasındadır</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {securityMessages.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Henüz mesaj yok</p>
          </div>
        ) : (
          securityMessages.map((message, index) => {
            const isOwn = message.senderId === userId
            const showDate = index === 0 || formatDate(message.createdAt) !== formatDate(securityMessages[index - 1].createdAt)
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                )}
                <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                  {!isOwn && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={getRoleColor(message.senderRole)}>
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[75%]", isOwn && "items-end")}>
                    {!isOwn && <p className="text-xs text-muted-foreground mb-1 ml-1">{message.senderName}</p>}
                    <div className={cn("px-3 py-2 rounded-2xl", isOwn ? "bg-amber-500 text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    </div>
                    <p className={cn("text-[10px] text-muted-foreground mt-1", isOwn ? "text-right mr-1" : "ml-1")}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Paket/ziyaretçi bildirin..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage("security", "1")}
          />
          <Button size="icon" className="bg-amber-500 hover:bg-amber-600" onClick={() => sendMessage("security", "1")} disabled={!messageText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="flex-1 flex flex-col h-full">
      <AnimatePresence mode="wait">
        {chatView === "list" && renderChatList()}
        {chatView === "group" && renderGroupChat()}
        {chatView === "security-chat" && renderSecurityChat()}
      </AnimatePresence>
    </div>
  )
}

