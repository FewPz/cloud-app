"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BackButton from '@/components/next/BackButton'
import SpinWheel from '@/components/next/SpinWheel'
import { buildWsProtocols, buildWsUrl } from '@/lib/config'

interface Player {
  id: string
  name: string
  betAmount: number
}

interface GameResult {
  winnerId: string
  winnerName: string
  totalWinAmount: number
}

const WHEEL_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'] as const

export default function SpinWheelGamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomId = searchParams.get('roomId')
  const gameId = searchParams.get('gameId')
  
  const [user, setUser] = useState<any>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameStatus, setGameStatus] = useState<'waiting' | 'spinning' | 'finished'>('waiting')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [isWheelSpinning, setIsWheelSpinning] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [totalPrizePool, setTotalPrizePool] = useState<number>(0)
  const [wheelTrigger, setWheelTrigger] = useState<{ id: string; nonce: number } | null>(null)

  const wheelItems = useMemo(() => players.map((player, index) => ({
    id: player.id,
    label: player.id === user?.id ? 'คุณ' : `ผู้เล่น ${index + 1}`,
    color: WHEEL_COLORS[index % WHEEL_COLORS.length],
  })), [players, user?.id])

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/signin')
    }

    if (!roomId || !gameId) {
      router.push('/')
      return
    }
  }, [router, roomId, gameId])

  useEffect(() => {
    if (!user || !gameId) return

    const token = localStorage.getItem('token')
    if (!token) return

    const websocket = new WebSocket(buildWsUrl(`/game/spin-wheel/ws/${gameId}`), buildWsProtocols(token))
    
    websocket.onopen = () => {
      console.log('Connected to Spin Wheel game')
      setWs(websocket)
      // ขอข้อมูลเกม
      websocket.send(JSON.stringify({ type: 'get_game_status' }))
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received Spin Wheel message:', data)
      
      if (data.type === 'game_status') {
        setPlayers(data.players)
        setTotalPrizePool(data.totalPrizePool)
        setGameStatus(data.gameStatus)
      }
      
      if (data.type === 'wheel_spinning') {
        setGameStatus('spinning')
        setIsWheelSpinning(true)
        setSelectedPlayer(data.winnerId)
        setWheelTrigger({ id: data.winnerId, nonce: Date.now() })
      }
      
      if (data.type === 'game_finished') {
        setGameResult({
          winnerId: data.winnerId,
          winnerName: data.winnerName,
          totalWinAmount: data.totalWinAmount
        })
        setGameStatus('finished')
        setIsWheelSpinning(false)
        
        // อัปเดตเงินผู้เล่นถ้าเป็นผู้ชนะ
        if (data.winnerId === user.id) {
          const updatedUser = { ...user, money: user.money + data.totalWinAmount }
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
      }
    }

    websocket.onclose = () => {
      console.log('Disconnected from Spin Wheel game')
      setWs(null)
    }

    return () => {
      websocket.close()
    }
  }, [user, gameId])

  const spinWheel = () => {
    if (!ws || gameStatus !== 'waiting' || isWheelSpinning) return
    
    ws.send(JSON.stringify({ type: 'start_spin' }))
  }

  const playAgain = () => {
    router.push(`/room/${roomId}`)
  }

  const goToRoom = () => {
    router.push(`/room/${roomId}`)
  }

  if (!user || !roomId || !gameId) return <div>กำลังโหลด...</div>

  const statusLabel = {
    waiting: 'รอเริ่มหมุน',
    spinning: 'กำลังหมุนอยู่',
    finished: 'เกมจบแล้ว'
  }[gameStatus]

  return (
    <div className="min-h-screen p-4 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Room</span>
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wide">
              {roomId}
            </Badge>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Game Center</p>
          <h1 className="text-3xl font-semibold tracking-wide">🎯 Spin Wheel Game</h1>
          <p className="text-slate-500 text-sm">หมุนล้อรับเงินกองกลาง ใครได้ก็รับไปทั้งหมด</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border shadow-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-lg text-slate-800">ล้อสุ่มผู้ชนะ</CardTitle>
              <CardDescription className="text-sm text-slate-500">สถานะ: {statusLabel}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <SpinWheel
                className="w-full"
                items={wheelItems}
                trigger={wheelTrigger}
                showButton={false}
                size={360}
                onFinished={(item) => {
                  setSelectedPlayer(item.id as string)
                  setIsWheelSpinning(false)
                }}
              />

              {gameStatus === 'waiting' && (
                <Button
                  onClick={spinWheel}
                  className="w-full bg-rose-600 hover:bg-rose-600/90 text-white text-base"
                  disabled={!ws || players.length === 0 || isWheelSpinning}
                >
                  🎯 หมุนล้อ
                </Button>
              )}

              {isWheelSpinning && (
                <div className="rounded-full border border-amber-200 px-4 py-1 text-sm text-amber-600">
                  🌀 กำลังหมุนล้อ...
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg text-slate-800">🏆 เงินรางวัลรวม</CardTitle>
                <CardDescription className="text-sm text-slate-500">รับทั้งหมดเมื่อชนะ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-4xl font-bold text-slate-900">{totalPrizePool} บาท</p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  ผู้เข้าร่วม {players.length} คน
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-base text-slate-800">ผู้เข้าร่วมการแข่งขัน</CardTitle>
                <CardDescription className="text-xs text-slate-500">ติดตามสถานะผู้ชนะ</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {players.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                    ยังไม่มีผู้เล่นเข้าร่วม
                  </div>
                )}

                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      selectedPlayer === player.id ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span
                          className="inline-flex h-4 w-4 rounded-full"
                          style={{ backgroundColor: WHEEL_COLORS[index % WHEEL_COLORS.length] }}
                        />
                        {player.id === user.id ? 'คุณ' : `ผู้เล่น ${index + 1}`}
                      </div>
                      {selectedPlayer === player.id && (
                        <Badge className="bg-amber-400 text-[11px] text-black hover:bg-amber-400">👑 ผู้ชนะ</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">แทง {player.betAmount} บาท</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {gameResult && (
          <Card className="border shadow-md">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-lg text-slate-800">🎉 ผลการแข่งขัน</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                ผู้ชนะ: {gameResult.winnerId === user.id ? 'คุณ' : gameResult.winnerName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="text-6xl">🏆</div>
              <p className="text-base text-slate-700">
                รับเงินไปทั้งหมด <span className="font-semibold text-slate-900">{gameResult.totalWinAmount} บาท</span>
              </p>

              {gameResult.winnerId === user.id ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  🎊 ยินดีด้วย! คุณชนะแล้ว!
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  😊 รอบหน้าลุ้นใหม่กันอีก
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={playAgain} className="bg-slate-900 hover:bg-slate-900/90">
                  🎮 กลับไปเลือกเกม
                </Button>
                <Button onClick={goToRoom} variant="outline">
                  🏠 กลับห้อง
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Card className="border shadow-sm">
            <CardContent className="p-4 text-center text-sm text-slate-600">
              💰 เงินของคุณ:
              <span className="ml-2 font-semibold text-slate-900">{user.money} บาท</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
