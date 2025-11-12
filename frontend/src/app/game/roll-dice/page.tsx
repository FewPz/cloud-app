"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/next/BackButton'

interface Player {
  id: string
  name: string
  prediction: number | null
  betAmount: number
}

interface GameResult {
  diceResult: number
  winners: Player[]
  winAmount: number
}

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export default function RollDiceGamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomId = searchParams.get('roomId')
  const gameId = searchParams.get('gameId')
  
  const [user, setUser] = useState<any>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameStatus, setGameStatus] = useState<'waiting' | 'rolling' | 'finished'>('waiting')
  const [diceValue, setDiceValue] = useState<number>(1)
  const [isRolling, setIsRolling] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [totalPrizePool, setTotalPrizePool] = useState<number>(0)

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

    const websocket = new WebSocket(`ws://localhost:4000/game/roll-dice/${gameId}`, ['token', token])
    
    websocket.onopen = () => {
      console.log('Connected to Roll Dice game')
      setWs(websocket)
      // ขอข้อมูลเกม
      websocket.send(JSON.stringify({ type: 'get_game_status' }))
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received Roll Dice message:', data)
      
      if (data.type === 'game_status') {
        setPlayers(data.players)
        setTotalPrizePool(data.totalPrizePool)
        setGameStatus(data.gameStatus)
      }
      
      if (data.type === 'dice_rolling') {
        setIsRolling(true)
        setGameStatus('rolling')
        
        // Animation แบบจำลอง
        let rollCount = 0
        const rollInterval = setInterval(() => {
          setDiceValue(Math.floor(Math.random() * 6) + 1)
          rollCount++
          
          if (rollCount >= 20) {
            clearInterval(rollInterval)
            setDiceValue(data.result)
            setIsRolling(false)
            
            // รอแป๊บเดียวแล้วแสดงผล
            setTimeout(() => {
              setGameResult({
                diceResult: data.result,
                winners: data.winners,
                winAmount: data.winAmount
              })
              setGameStatus('finished')
            }, 1000)
          }
        }, 100)
      }
      
      if (data.type === 'game_finished') {
        setGameResult({
          diceResult: data.diceResult,
          winners: data.winners,
          winAmount: data.winAmount
        })
        setGameStatus('finished')
        
        // อัปเดตเงินผู้เล่น
        if (data.winners.some((w: Player) => w.id === user.id)) {
          const updatedUser = { ...user, money: user.money + data.winAmount }
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
      }
    }

    websocket.onclose = () => {
      console.log('Disconnected from Roll Dice game')
      setWs(null)
    }

    return () => {
      websocket.close()
    }
  }, [user, gameId])

  const rollDice = () => {
    if (!ws || gameStatus !== 'waiting') return
    
    ws.send(JSON.stringify({ type: 'start_roll' }))
  }

  const playAgain = () => {
    router.push(`/game/select?roomId=${roomId}`)
  }

  const goToRoom = () => {
    router.push(`/room/${roomId}`)
  }

  if (!user || !roomId || !gameId) return <div>กำลังโหลด...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 p-4">
      <BackButton />
      
      <div className="max-w-4xl mx-auto pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎲 Roll Dice Game
          </h1>
          <p className="text-white/80">
            รอการทอยลูกเต๋า! ใครทายถูกจะได้เงินรางวัล
          </p>
        </div>

        {/* Prize Pool */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">
              🏆 เงินรางวัลรวม
            </h2>
            <div className="text-4xl font-bold text-white">
              {totalPrizePool} บาท
            </div>
          </CardContent>
        </Card>

        {/* Dice Display */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className={`text-8xl mb-4 ${isRolling ? 'animate-spin' : ''}`}>
                {DICE_FACES[diceValue - 1]}
              </div>
              <div className="text-2xl font-bold text-white">
                {isRolling ? 'กำลังทอย...' : `ผลลัพธ์: ${diceValue}`}
              </div>
            </div>
            
            {gameStatus === 'waiting' && (
              <Button 
                onClick={rollDice}
                className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3"
                disabled={!ws}
              >
                🎲 ทอยลูกเต๋า
              </Button>
            )}
            
            {isRolling && (
              <div className="text-yellow-400 text-lg">
                ⚡ กำลังทอยลูกเต๋า...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players Status */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-xl text-center">
              ผู้เล่นและการทาย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player, index) => (
                <div key={player.id} className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between items-center text-white">
                    <div>
                      <div className="font-semibold">
                        {player.id === user.id ? 'คุณ' : `ผู้เล่น ${index + 1}`}
                      </div>
                      <div className="text-sm text-white/70">
                        แทง: {player.betAmount} บาท
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {player.prediction}
                      </div>
                      <div className="text-sm text-white/70">
                        ทาย
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Game Result */}
        {gameResult && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-xl text-center">
                🎉 ผลการแข่งขัน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">
                  {DICE_FACES[gameResult.diceResult - 1]}
                </div>
                <div className="text-2xl font-bold text-white mb-4">
                  ผลลัพธ์: {gameResult.diceResult}
                </div>
                
                {gameResult.winners.length > 0 ? (
                  <div>
                    <h3 className="text-xl font-bold text-green-400 mb-4">
                      🏆 ผู้ชนะ
                    </h3>
                    <div className="space-y-2">
                      {gameResult.winners.map((winner, index) => (
                        <div key={winner.id} className="bg-green-500/20 p-3 rounded-lg">
                          <div className="text-white font-semibold">
                            {winner.id === user.id ? 'คุณ' : `ผู้เล่น ${index + 1}`}
                          </div>
                          <div className="text-green-400">
                            ได้เงิน: {gameResult.winAmount} บาท
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-500/20 p-4 rounded-lg">
                    <div className="text-red-400 font-semibold">
                      😢 ไม่มีผู้ชนะ
                    </div>
                    <div className="text-white/70">
                      ไม่มีใครทายถูก
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={playAgain}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🎮 เล่นเกมอื่น
                </Button>
                <Button 
                  onClick={goToRoom}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  🏠 กลับห้อง
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Money Display */}
        <div className="text-center">
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