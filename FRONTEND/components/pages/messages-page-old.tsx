"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Package, Shield, Users, ChevronLeft, Search, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { UserRole, Site, Message } from "@/lib/types"
import type { Language } from "@/lib/i18n"
import { getTranslation, isRTL } from "@/lib/i18n"
import { mockMessages, mockResidents } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface MessagesPageProps {
  role: UserRole
  userId: string
  currentSite: Site
  lang?: Language
}

type ChatView = "list" | "group" | "security-chat"

interface SecurityConversation {
  recipientId: string
  recipientName: string
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

export function MessagesPage({ role, userId, currentSite, lang = "tr" }: MessagesPageProps) {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key)
  const rtl = isRTL(lang)

  const [chatView, setChatView] = useState<ChatView>("list")
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<SecurityConversation | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const siteMessages = mockMessages.filter((m) => m.siteId === currentSite.id)
  const groupMessages = siteMessages.filter((m) => m.chatType === "group")

  const getSecurityConversations = (): SecurityConversation[] => {
    const securityMsgs = siteMessages.filter((m) => m.chatType === "security")

    if (role === "security") {
      // Security sees individual conversations per resident
      const conversationMap = new Map<string, Message[]>()

      securityMsgs.forEach((msg) => {
        const partnerId = msg.senderRole === "security" ? msg.receiverId : msg.senderId
        if (partnerId) {
          const existing = conversationMap.get(partnerId) || []
          conversationMap.set(partnerId, [...existing, msg])
        }
      })

      return Array.from(conversationMap.entries()).map(([recipientId, messages]) => {
        const sortedMsgs = messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        const resident = mockResidents.find((r) => r.id === recipientId)
        return {
          recipientId,
          recipientName: resident?.fullName || (lang === "tr" ? "Bilinmeyen Sakin" : "Unknown Resident"),
          lastMessage: sortedMsgs[sortedMsgs.length - 1],
          unreadCount: sortedMsgs.filter((m) => !m.read && m.senderRole !== "security").length,
          messages: sortedMsgs,
        }
      })
    } else {
      // Resident sees only their conversation with security
      const myMsgs = securityMsgs.filter((m) => m.senderId === userId || m.receiverId === userId)
      if (myMsgs.length === 0) return []

      const sortedMsgs = myMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return [
        {
          recipientId: "security",
          recipientName: t("role_security"),
          lastMessage: sortedMsgs[sortedMsgs.length - 1],
          unreadCount: sortedMsgs.filter((m) => !m.read && m.senderRole === "security").length,
          messages: sortedMsgs,
        },
      ]
    }
  }

  const securityConversations = getSecurityConversations()
  const totalSecurityUnread = securityConversations.reduce((acc, c) => acc + c.unreadCount, 0)
  const unreadGroupCount = groupMessages.filter((m) => !m.read).length

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatView, groupMessages.length, selectedConversation])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString(
      lang === "ar" ? "ar-SA" : lang === "de" ? "de-DE" : lang === "en" ? "en-US" : "tr-TR",
      { hour: "2-digit", minute: "2-digit" },
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return t("today")
    if (diffDays === 1) return t("yesterday")
    return date.toLocaleDateString(
      lang === "ar" ? "ar-SA" : lang === "de" ? "de-DE" : lang === "en" ? "en-US" : "tr-TR",
      { day: "numeric", month: "short" },
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (r: UserRole) => {
    switch (r) {
      case "admin":
        return "bg-primary text-primary-foreground"
      case "security":
        return "bg-amber-500 text-white"
      case "cleaner":
        return "bg-emerald-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const openSecurityChat = (conversation: SecurityConversation) => {
    setSelectedConversation(conversation)
    setChatView("security-chat")
  }

  const renderChatList = () => (
    <motion.div
      key="list"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col"
    >
      <div className="p-4 space-y-3">
        <h2 className="font-semibold text-lg">{t("messages_title")}</h2>
        <div className="relative">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
              rtl ? "right-3" : "left-3",
            )}
          />
          <Input
            placeholder={`${t("search")}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={rtl ? "pr-9" : "pl-9"}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Site Group Chat */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
          onClick={() => setChatView("group")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{currentSite.name}</h3>
                  {unreadGroupCount > 0 && <Badge className="h-5 px-2 text-[10px]">{unreadGroupCount}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{t("messages_group_chat")}</p>
                {groupMessages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {groupMessages[groupMessages.length - 1].senderName}: {groupMessages[groupMessages.length - 1].body}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Conversations - Shown separately per person */}
        {(role === "resident" || role === "security" || role === "admin") && (
          <>
            <div className="flex items-center gap-2 pt-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {role === "security" ? t("messages_resident_messages") : t("messages_security_chat")}
              </span>
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>

            {role === "security" ? (
              securityConversations.length > 0 ? (
                securityConversations.map((conv) => (
                  <Card
                    key={conv.recipientId}
                    className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                    onClick={() => openSecurityChat(conv)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 shrink-0">
                          <AvatarFallback className="bg-muted text-foreground">
                            {getInitials(conv.recipientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{conv.recipientName}</h3>
                            {conv.unreadCount > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-2 text-[10px] bg-amber-500/10 text-amber-600"
                              >
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDate(conv.lastMessage.createdAt)}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{conv.lastMessage.body}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="p-4 text-center">
                    <Shield className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t("messages_no_messages")}</p>
                  </CardContent>
                </Card>
              )
            ) : (
              // Resident sees single security chat entry
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                onClick={() => {
                  if (securityConversations.length > 0) {
                    openSecurityChat(securityConversations[0])
                  } else {
                    setSelectedConversation({
                      recipientId: "security",
                      recipientName: t("role_security"),
                      lastMessage: {} as Message,
                      unreadCount: 0,
                      messages: [],
                    })
                    setChatView("security-chat")
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{t("role_security")}</h3>
                        {totalSecurityUnread > 0 && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px] bg-amber-500/10 text-amber-600">
                            {totalSecurityUnread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{t("messages_package_notification")}</p>
                      {securityConversations[0]?.lastMessage?.body && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {securityConversations[0].lastMessage.body}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </motion.div>
  )

  const renderGroupChat = () => (
    <motion.div
      key="group"
      initial={{ opacity: 0, x: rtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: rtl ? 20 : -20 }}
      className="flex-1 flex flex-col"
    >
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setChatView("list")}>
          <ChevronLeft className={cn("w-5 h-5", rtl && "rotate-180")} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{currentSite.name}</h2>
          <p className="text-xs text-muted-foreground">
            {currentSite.totalResidents} {lang === "tr" ? "kişi" : "people"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages.map((message, index) => {
          const isOwn = message.senderId === userId
          const showDate =
            index === 0 || formatDate(message.createdAt) !== formatDate(groupMessages[index - 1].createdAt)
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
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className={cn("text-xs", getRoleColor(message.senderRole))}>
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-[75%]", isOwn && "items-end")}>
                  {!isOwn && <p className="text-xs text-muted-foreground mb-1 ml-1">{message.senderName}</p>}
                  <div
                    className={cn(
                      "px-3 py-2 rounded-2xl",
                      isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm",
                    )}
                  >
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

      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            placeholder={`${t("messages_type_message")}`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && messageText.trim() && setMessageText("")}
          />
          <Button size="icon" disabled={!messageText.trim()}>
            <Send className={cn("w-4 h-4", rtl && "rotate-180")} />
          </Button>
        </div>
      </div>
    </motion.div>
  )

  const renderSecurityChat = () => {
    if (!selectedConversation) return null

    return (
      <motion.div
        key="security-chat"
        initial={{ opacity: 0, x: rtl ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: rtl ? 20 : -20 }}
        className="flex-1 flex flex-col"
      >
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setChatView("list")
              setSelectedConversation(null)
            }}
          >
            <ChevronLeft className={cn("w-5 h-5", rtl && "rotate-180")} />
          </Button>
          {role === "security" ? (
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-muted text-foreground">
                {getInitials(selectedConversation.recipientName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{selectedConversation.recipientName}</h2>
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {role === "security" ? t("messages_private") : t("messages_package_notification")}
            </p>
          </div>
        </div>

        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-600">
            <Package className="w-4 h-4" />
            <p className="text-xs">
              {lang === "tr"
                ? `Bu sohbet sadece sizinle ${role === "security" ? "sakin" : "güvenlik"} arasındadır`
                : "This chat is private"}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedConversation.messages.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("messages_no_messages")}</p>
            </div>
          ) : (
            selectedConversation.messages.map((message, index) => {
              const isOwn = message.senderId === userId || (role === "security" && message.senderRole === "security")
              const showDate =
                index === 0 ||
                formatDate(message.createdAt) !== formatDate(selectedConversation.messages[index - 1].createdAt)
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
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className={cn("text-xs", getRoleColor(message.senderRole))}>
                          {getInitials(message.senderName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[75%]", isOwn && "items-end")}>
                      {!isOwn && <p className="text-xs text-muted-foreground mb-1 ml-1">{message.senderName}</p>}
                      <div
                        className={cn(
                          "px-3 py-2 rounded-2xl",
                          isOwn ? "bg-amber-500 text-white rounded-tr-sm" : "bg-muted rounded-tl-sm",
                        )}
                      >
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

        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              placeholder={
                role === "security"
                  ? lang === "tr"
                    ? "Yanıt yazın..."
                    : "Reply..."
                  : lang === "tr"
                    ? "Paket/ziyaretçi bildirin..."
                    : "Report package/visitor..."
              }
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && messageText.trim() && setMessageText("")}
            />
            <Button size="icon" className="bg-amber-500 hover:bg-amber-600" disabled={!messageText.trim()}>
              <Send className={cn("w-4 h-4", rtl && "rotate-180")} />
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className={cn("flex-1 flex flex-col h-full", rtl && "rtl")}>
      <AnimatePresence mode="wait">
        {chatView === "list" && renderChatList()}
        {chatView === "group" && renderGroupChat()}
        {chatView === "security-chat" && renderSecurityChat()}
      </AnimatePresence>
    </div>
  )
}

