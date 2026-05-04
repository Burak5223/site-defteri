"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, CheckCircle2, Clock, Users } from "lucide-react"
import { mockVotingTopics } from "@/lib/mock-data"
import { governanceService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { UserRole } from "@/lib/types"

interface VotingPageProps {
  role: UserRole
}

export function VotingPage({ role }: VotingPageProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [votings, setVotings] = useState(mockVotingTopics)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadVotings()
  }, [])

  const loadVotings = async () => {
    setIsLoading(true)
    try {
      const data = await governanceService.getVotings()
      setVotings(data.map(v => ({
        id: v.id,
        title: v.title,
        status: v.status === 'AKTIF' ? 'active' : 'ended',
        endDate: v.endDate,
        totalVotes: v.totalVotes || 0,
        hasVoted: v.hasVoted || false,
        options: v.options?.map((opt: string, idx: number) => ({
          id: `opt-${idx}`,
          label: opt,
          votes: 0,
        })) || [],
      })))
    } catch (error) {
      // Silently fallback to mock data
      console.log('Using mock data for votings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (votingId: string, optionId: string) => {
    try {
      await governanceService.castVote(votingId, { selectedOption: optionId })
      toast({
        title: "Başarılı",
        description: "Oyunuz kaydedildi",
      })
      loadVotings()
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Oy kullanılamadı",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4 space-y-4 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">E-Oylama</h2>
          <p className="text-xs text-muted-foreground">
            {votings.filter((v) => v.status === "active").length} aktif oylama
          </p>
        </div>
        {role === "admin" && (
          <Button size="sm" className="h-9 rounded-xl">
            <Plus className="w-4 h-4 mr-1" />
            Oylama Oluştur
          </Button>
        )}
      </div>

      {/* Voting Topics */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          </div>
        ) : (
          votings.map((topic) => (
          <div key={topic.id} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-medium text-foreground">{topic.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={topic.status === "active" ? "default" : "secondary"}>
                    {topic.status === "active" ? "Devam Ediyor" : "Sona Erdi"}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {topic.totalVotes} oy
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(topic.endDate).toLocaleDateString("tr-TR")}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 mt-4">
              {topic.options.map((option) => {
                const percentage = topic.totalVotes > 0 ? Math.round((option.votes / topic.totalVotes) * 100) : 0
                const isSelected = selectedOption === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => !topic.hasVoted && setSelectedOption(option.id)}
                    disabled={topic.hasVoted || topic.status === "ended"}
                    className={`w-full p-3 rounded-xl border transition-all text-left ${
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
                    } ${topic.hasVoted || topic.status === "ended" ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{option.votes} oy</p>
                  </button>
                )
              })}
            </div>

            {/* Vote Button */}
            {topic.status === "active" && !topic.hasVoted && (
              <Button 
                className="w-full mt-4 h-10 rounded-xl" 
                disabled={!selectedOption}
                onClick={() => selectedOption && handleVote(topic.id, selectedOption)}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Oy Ver
              </Button>
            )}

            {topic.hasVoted && (
              <div className="mt-4 p-3 rounded-xl bg-success/10 text-success text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Oyunuz kaydedildi
              </div>
            )}
          </div>
        ))
        )}
      </div>
    </div>
  )
}

