"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/next/BackButton'

const GAME_TYPES = [
  { 
    id: 'roll-dice', 
    name: '🎲 Roll Dice', 
    description: 'ทายลูกเต๋า 6 หน้า - ทายถูกได้เงินรางวัล!',
    color: 'from-red-500 to-pink-500'
  },
  { 
    id: 'spin-wheel', 
    name: '🎯 Spin Wheel', 
    description: 'สุ่มผู้โชคดี - ใครได้จะได้เงินทั้งหมด!',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'match-fixing', 
    name: '🧠 Match Fixing', 
    description: 'ตอบคำถาม - ตอบถูกทุกข้อได้เงิน!',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    id: 'vote', 
    name: '🗳️ Vote', 
    description: 'โหวตตัวเลือก - ฝ่ายชนะได้เงิน!',
    color: 'from-purple-500 to-indigo-500'
  }
]

export default function GameSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get('roomId')
  
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/signin')
    }

    // Check if we have roomId
    if (!roomId) {
      router.push('/')
    }
  }, [router, roomId])

  const selectGame = (gameType: string) => {
    router.push(`/betting/${roomId}?gameType=${gameType}`)
  }

  if (!user || !roomId) return <div>กำลังโหลด...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <BackButton />
      
      <div className="max-w-4xl mx-auto pt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎮 เลือกเกมที่จะเล่น
          </h1>
          <p className="text-white/80 text-lg">
            เลือกเกมที่คุณต้องการเล่น แล้วไปแทงเงินกันเลย!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GAME_TYPES.map((game) => (
            <Card 
              key={game.id} 
              className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer"
              onClick={() => selectGame(game.id)}
            >
              <CardHeader>
                <CardTitle className="text-white text-2xl text-center">
                  {game.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${game.color} mx-auto mb-4 flex items-center justify-center text-3xl`}>
                  {game.name.split(' ')[0]}
                </div>
                
                <p className="text-white/90 mb-6">
                  {game.description}
                </p>
                
                <Button 
                  className="w-full bg-white/20 hover:bg-white/30 border-white/30"
                  onClick={(e) => {
                    e.stopPropagation()
                    selectGame(game.id)
                  }}
                >
                  เลือกเกมนี้
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 inline-block">
            <CardContent className="p-4">
              <div className="text-white">
                <p className="text-sm">
                  💰 เงินของคุณ: <span className="font-semibold text-green-400">{user.money} บาท</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}