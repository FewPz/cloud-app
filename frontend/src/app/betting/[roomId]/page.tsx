"use client"

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BackButton from '@/components/next/BackButton'

const GAME_TYPES = [
  { id: 'roll-dice', name: 'Roll Dice', description: 'ทายลูกเต๋า 6 หน้า' },
  { id: 'spin-wheel', name: 'Spin Wheel', description: 'สุ่มผู้โชคดี' },
  { id: 'match-fixing', name: 'Match Fixing', description: 'ตอบคำถาม' },
  { id: 'vote', name: 'Vote', description: 'โหวตตัวเลือก' }
]

interface User {
  id: string
  name: string
  money: number
}

interface GameSession {
  id: string
  roomId: string
  gameType: string
  status: string
  totalPrizePool: number
  bets: Array<{
    id: string
    playerId: string
    amount: number
    prediction?: any
  }>
}

export default function BettingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomId = params.roomId as string
  const gameType = searchParams.get('gameType') as string
  
  const [user, setUser] = useState<User | null>(null)
  const [betAmount, setBetAmount] = useState<number>(10)
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [ws, setWs] = useState<WebSocket | null>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } else {
      router.push('/signin')
    }
  }, [router])

  useEffect(() => {
    if (!gameType || !roomId) {
      router.push(`/room/${roomId}`)
      return
    }

    // เชื่อมต่อ WebSocket สำหรับอัปเดตการแทงเงิน
    const token = localStorage.getItem('token')
    if (!token) return

    const websocket = new WebSocket(`ws://localhost:4000/game/${roomId}`, ['token', token])
    
    websocket.onopen = () => {
      console.log('Connected to betting websocket')
      setWs(websocket)
      // ขอข้อมูล game session ปัจจุบัน
      websocket.send(JSON.stringify({ type: 'get_game_session', gameType }))
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'game_session_update') {
        setGameSession(data.gameSession)
      }
      
      if (data.type === 'bet_placed') {
        // อัปเดตข้อมูลเมื่อมีคนแทง
        setGameSession(prev => prev ? { ...prev, ...data.gameSession } : null)
      }
      
      if (data.type === 'all_bets_placed') {
        // เมื่อทุกคนแทงครบแล้วให้ไปหน้าเกม
        let gameUrl = `/game/play?roomId=${roomId}&gameId=${data.gameId}&gameType=${gameType}`
        
        if (gameType === 'roll-dice') {
          gameUrl = `/game/roll-dice?roomId=${roomId}&gameId=${data.gameId}`
        } else if (gameType === 'spin-wheel') {
          gameUrl = `/game/spin-wheel?roomId=${roomId}&gameId=${data.gameId}`
        } else if (gameType === 'match-fixing') {
          gameUrl = `/game/match-fixing?roomId=${roomId}&gameId=${data.gameId}`
        } else if (gameType === 'vote') {
          gameUrl = `/game/vote?roomId=${roomId}&gameId=${data.gameId}`
        }
        
        router.push(gameUrl)
      }
    }

    websocket.onclose = () => {
      console.log('Disconnected from betting websocket')
      setWs(null)
    }

    return () => {
      websocket.close()
    }
  }, [gameType, roomId, router])

  const handlePlaceBet = async () => {
    if (!user || !gameSession || !ws) return
    
    if (betAmount > user.money) {
      alert('เงินไม่เพียงพอ!')
      return
    }

    // ตรวจสอบว่าต้องมีการทายหรือไม่
    if ((gameType === 'roll-dice' && !prediction) || 
        (gameType === 'match-fixing' && !prediction) || 
        (gameType === 'vote' && !prediction)) {
      alert('กรุณาใส่การทายผล!')
      return
    }

    setLoading(true)
    
    try {
      ws.send(JSON.stringify({
        type: 'place_bet',
        gameSessionId: gameSession.id,
        amount: betAmount,
        prediction: prediction
      }))
      
      // อัปเดตเงินผู้เล่น
      const updatedUser = { ...user, money: user.money - betAmount }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
    } catch (error) {
      console.error('Error placing bet:', error)
      alert('เกิดข้อผิดพลาดในการแทง!')
    } finally {
      setLoading(false)
    }
  }

  const renderPredictionInput = () => {
    switch (gameType) {
      case 'roll-dice':
        return (
          <div className="space-y-2">
            <Label>ทายลูกเต๋า (1-6)</Label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <Button
                  key={num}
                  variant={prediction === num ? "default" : "outline"}
                  onClick={() => setPrediction(num)}
                  className="aspect-square"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
        )
      
      case 'spin-wheel':
        return (
          <div className="space-y-2">
            <Label>Spin Wheel (ไม่ต้องทาย)</Label>
            <p className="text-sm text-muted-foreground">เกมนี้จะสุ่มผู้ชนะ ไม่ต้องทายผล</p>
          </div>
        )
      
      case 'match-fixing':
        return (
          <div className="space-y-2">
            <Label>Match Fixing</Label>
            <p className="text-sm text-muted-foreground">รอ Host ตั้งคำถาม</p>
          </div>
        )
      
      case 'vote':
        return (
          <div className="space-y-2">
            <Label>Vote</Label>
            <p className="text-sm text-muted-foreground">รอ Host ตั้งตัวเลือก</p>
          </div>
        )
      
      default:
        return null
    }
  }

  const getCurrentGameType = () => {
    return GAME_TYPES.find(type => type.id === gameType)
  }

  const hasUserBet = gameSession?.bets.some(bet => bet.playerId === user?.id)

  if (!user) return <div>กำลังโหลด...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <BackButton />
      
      <div className="max-w-2xl mx-auto pt-16">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">
              {getCurrentGameType()?.name} - การแทงเงิน
            </CardTitle>
            <p className="text-white/80 text-center">
              {getCurrentGameType()?.description}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* ข้อมูลผู้เล่น */}
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-white">
                <p>ผู้เล่น: <span className="font-semibold">{user.name}</span></p>
                <p>เงินคงเหลือ: <span className="font-semibold text-green-400">{user.money} บาท</span></p>
              </div>
            </div>

            {/* สถานะเกม */}
            {gameSession && (
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-white">
                  <p>เงินรางวัลรวม: <span className="font-semibold text-yellow-400">{gameSession.totalPrizePool} บาท</span></p>
                  <p>จำนวนผู้แทง: <span className="font-semibold">{gameSession.bets.length} คน</span></p>
                </div>
              </div>
            )}

            {/* ฟอร์มแทงเงิน */}
            {!hasUserBet ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">จำนวนเงินที่แทง</Label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="1"
                    max={user.money}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                {renderPredictionInput()}

                <Button 
                  onClick={handlePlaceBet}
                  disabled={loading || betAmount <= 0 || betAmount > user.money}
                  className="w-full"
                >
                  {loading ? 'กำลังแทง...' : `แทงเงิน ${betAmount} บาท`}
                </Button>
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="text-white">
                  <h3 className="text-lg font-semibold mb-2">✅ แทงเงินเรียบร้อยแล้ว</h3>
                  <p>รอผู้เล่นคนอื่นแทงเงิน...</p>
                </div>
              </div>
            )}

            {/* รายการผู้แทง */}
            {gameSession && gameSession.bets.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white">ผู้เล่นที่แทงแล้ว:</Label>
                <div className="space-y-1">
                  {gameSession.bets.map(bet => (
                    <div key={bet.id} className="bg-white/5 p-2 rounded text-white text-sm">
                      ผู้เล่น {bet.playerId.slice(0, 8)}... แทง {bet.amount} บาท
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}