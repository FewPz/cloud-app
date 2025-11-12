"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/next/BackButton'
import { buildWsProtocols, buildWsUrl } from '@/lib/config'
import { AddChoicesPanel } from '@/components/match-fixing/AddChoicesPanel'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface Player {
  id: string
  name: string
  betAmount: number
  answers: number[]
}

interface GameResult {
  questions: Question[]
  winners: Player[]
  winAmount: number
}

export default function MatchFixingGamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const roomId = searchParams.get('roomId')
  const gameId = searchParams.get('gameId')
  
  const [user, setUser] = useState<any>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isHost, setIsHost] = useState(false)
  const [gameStatus, setGameStatus] = useState<'setup' | 'waiting' | 'answering' | 'finished'>('setup')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [playerAnswers, setPlayerAnswers] = useState<number[]>([])
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [totalPrizePool, setTotalPrizePool] = useState<number>(0)

  // Host setup states
  const [newOptions, setNewOptions] = useState<string[]>(['', ''])
  const [selectedResult, setSelectedResult] = useState(0)

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

    const websocket = new WebSocket(buildWsUrl(`/game/match-fixing/ws/${gameId}`), buildWsProtocols(token))
    
    websocket.onopen = () => {
      console.log('Connected to Match Fixing game')
      setWs(websocket)
      websocket.send(JSON.stringify({ type: 'get_game_status' }))
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received Match Fixing message:', data)
      
      if (data.type === 'game_status') {
        setPlayers(data.players)
        setTotalPrizePool(data.totalPrizePool)
        setGameStatus(data.gameStatus)
        setIsHost(data.hostId === user.id)
        if (data.questions) {
          setQuestions(data.questions)
          if (data.questions[0]?.correctAnswer >= 0) {
            setSelectedResult(data.questions[0].correctAnswer)
          }
        }
      }
      
      if (data.type === 'question_added') {
        setQuestions(data.questions)
        setNewOptions(['', ''])
        setSelectedResult(0)
      }
      
      if (data.type === 'game_started') {
        setGameStatus('answering')
        setCurrentQuestionIndex(0)
        setPlayerAnswers([])
      }
      
      if (data.type === 'next_question') {
        setCurrentQuestionIndex(data.questionIndex)
        setPlayerAnswers(prev => {
          const updated = [...prev]
          updated[data.questionIndex] = -1
          return updated
        })
      }
      
      if (data.type === 'game_finished') {
        setGameResult({
          questions: data.questions,
          winners: data.winners,
          winAmount: data.winAmount
        })
        setGameStatus('finished')
        
        // อัปเดตเงินผู้เล่นถ้าเป็นผู้ชนะ
        if (data.winners.some((w: Player) => w.id === user.id)) {
          const updatedUser = { ...user, money: user.money + data.winAmount }
          setUser(updatedUser)
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
      }
    }

    websocket.onclose = () => {
      console.log('Disconnected from Match Fixing game')
      setWs(null)
    }

    return () => {
      websocket.close()
    }
  }, [user, gameId])

  const addQuestion = () => {
    if (!ws || newOptions.some(opt => !opt.trim()) || newOptions.length < 2) return
    
    const questionPayload = {
      type: 'add_question',
      question: roomId ? `คำถามห้อง ${roomId}` : 'คำถามโฮสต์',
      options: newOptions,
    }

    // Optimistic update so host sees the change immediately
    const tempQuestion: Question = {
      id: Date.now().toString(),
      question: questionPayload.question,
      options: [...newOptions],
      correctAnswer: -1,
    }
    setQuestions([tempQuestion])
    setSelectedResult(0)
    setNewOptions(['', ''])

    ws.send(JSON.stringify(questionPayload))
  }

  const startGame = () => {
    if (!ws || questions.length === 0) return
    
    ws.send(JSON.stringify({ type: 'start_game' }))
  }

  const submitAnswer = (answerIndex: number) => {
    if (!ws || gameStatus !== 'answering') return
    
    const updatedAnswers = [...playerAnswers]
    updatedAnswers[currentQuestionIndex] = answerIndex
    setPlayerAnswers(updatedAnswers)
    
    ws.send(JSON.stringify({
      type: 'submit_answer',
      questionIndex: currentQuestionIndex,
      answerIndex
    }))
  }

  const nextQuestion = () => {
    if (!ws || !isHost) return
    
    ws.send(JSON.stringify({ type: 'next_question' }))
  }

  const finishGame = () => {
    if (!ws || !isHost || questions.length === 0) return

    ws.send(JSON.stringify({ type: 'finish_game', answerIndex: selectedResult }))
  }

  const playAgain = () => {
    router.push(`/room/${roomId}`)
  }

  const goToRoom = () => {
    router.push(`/room/${roomId}`)
  }

  if (!user || !roomId || !gameId) return <div>กำลังโหลด...</div>

  const statusCopy: Record<'setup' | 'waiting' | 'answering' | 'finished', string> = {
    setup: 'เตรียมคำถาม',
    waiting: 'รอเริ่มเล่น',
    answering: 'กำลังตอบคำถาม',
    finished: 'เกมจบแล้ว'
  }

  const currentQuestion = questions[currentQuestionIndex]
  const answeredIndex = playerAnswers[currentQuestionIndex]
  const hasAnswered = typeof answeredIndex === 'number' && answeredIndex >= 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const renderSetupContent = () => {
    if (!isHost) {
      return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-700">⏳ รอ Host ตั้งคำถาม</p>
          <p className="mt-1">Host กำลังเตรียมคำถามเพื่อให้ทุกคนตอบ</p>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <AddChoicesPanel
            choices={newOptions}
            onChangeChoices={setNewOptions}
            onSubmit={addQuestion}
            onStartGame={startGame}
            canStart={questions.length > 0}
            questionLabel={roomId ? `คำถามห้อง ${roomId}` : 'คำถามโฮสต์'}
            disabled={questions.length > 0}
          />
        </div>
      </div>
    )
  }

  const renderWaitingContent = () => (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
      <p className="font-semibold text-slate-700">🕓 กำลังเตรียมเกม</p>
      <p className="mt-1">ทุกคนกำลังเข้าห้องหรือรอสัญญาณเริ่มจาก Host</p>
    </div>
  )

  const renderAnsweringContent = () => (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">คำถามที่ {currentQuestionIndex + 1} / {questions.length}</p>
        <h2 className="text-2xl font-semibold text-slate-900">{currentQuestion?.question}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {currentQuestion?.options.map((option, index) => {
          const isActive = hasAnswered && answeredIndex === index
          return (
            <Button
              key={index}
              type="button"
              onClick={() => submitAnswer(index)}
              disabled={hasAnswered}
              variant={isActive ? 'default' : 'outline'}
              className="h-auto p-4 text-left"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500">ตัวเลือก {index + 1}</p>
                <p className="text-base font-medium text-slate-900">{option}</p>
              </div>
            </Button>
          )
        })}
      </div>

      {hasAnswered && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✅ ตอบแล้ว: ตัวเลือก {answeredIndex + 1}
        </div>
      )}

      {isHost && (
        <div className="flex flex-wrap justify-center gap-3">
          {!isLastQuestion ? (
            <Button onClick={nextQuestion} className="bg-blue-600 text-white hover:bg-blue-600/90">
              ➡️ คำถามถัดไป
            </Button>
          ) : (
            <Button onClick={finishGame} className="bg-rose-600 text-white hover:bg-rose-600/90">
              ⛔️ หยุดการตอบ
            </Button>
          )}
        </div>
      )}
    </div>
  )

  const renderFinishedContent = () => (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-700">
      🎉 เกมจบแล้ว! เลื่อนลงเพื่อดูผลการแข่งขัน
    </div>
  )

  const renderMainSection = () => {
    if (gameStatus === 'answering' && currentQuestion) return renderAnsweringContent()
    if (gameStatus === 'setup') return renderSetupContent()
    if (gameStatus === 'waiting') return renderWaitingContent()
    if (gameStatus === 'finished') return renderFinishedContent()

    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        🧩 กำลังเตรียมข้อมูลเกม...
      </div>
    )
  }

  const renderQuestionPreviewCard = () => {
    if (!(questions.length > 0 && gameStatus === 'setup')) return null

    return (
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">📝 คำถามทั้งหมด</CardTitle>
          <CardDescription className="text-xs text-slate-500">Host กำลังเตรียม {questions.length} ข้อ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, index) => (
            <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold text-slate-800">{index + 1}. {q.question}</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {q.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`rounded border px-2 py-1 text-sm ${optIndex === q.correctAnswer ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    {optIndex + 1}. {option}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const renderResultCard = () => {
    if (!gameResult) return null

    return (
      <Card className="border shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-lg text-slate-800">🎉 ผลการแข่งขัน</CardTitle>
          <CardDescription className="text-sm text-slate-500">{gameResult.winners.length > 0 ? 'ผู้ตอบถูกทุกข้อคว้าเงินรางวัล' : 'ไม่มีผู้ชนะในรอบนี้'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {gameResult.winners.length > 0 ? (
            <div className="space-y-3">
              {gameResult.winners.map((winner, index) => (
                <div key={winner.id} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="font-semibold text-slate-800">{winner.id === user.id ? 'คุณ' : `ผู้เล่น ${index + 1}`}</p>
                  <p className="text-sm text-emerald-700">ได้เงิน {gameResult.winAmount} บาท</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              😢 ไม่มีใครตอบถูกทุกข้อ
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={playAgain} className="bg-slate-900 text-white hover:bg-slate-900/90">🎮 กลับไปเลือกเกม</Button>
            <Button onClick={goToRoom} variant="outline">🏠 กลับห้อง</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full p-4 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Room</span>
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wide">{roomId}</Badge>
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Game Center</p>
          <h1 className="text-3xl font-semibold tracking-wide">🧠 Match Fixing Game</h1>
          <p className="text-sm text-slate-500">{isHost ? 'ตั้งคำถามและเฉลยให้เพื่อน ๆ ทาย' : 'ตอบคำถามให้ถูกทุกข้อเพื่อรับเงินกองกลาง'}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg text-slate-800">สถานะเกม</CardTitle>
              <CardDescription className="text-sm text-slate-500">{statusCopy[gameStatus]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderMainSection()}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <Card className="border shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg text-slate-800">🏆 เงินรางวัลรวม</CardTitle>
                <CardDescription className="text-sm text-slate-500">สะสมจากผู้แทงทั้งหมด</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-4xl font-bold text-slate-900">{totalPrizePool} บาท</p>
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>ผู้เข้าร่วม</span>
                    <span className="font-semibold text-slate-800">{players.length} คน</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>คำถามที่เตรียมแล้ว</span>
                    <span className="font-semibold text-slate-800">{questions.length} ข้อ</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-base text-slate-800">ผู้เข้าร่วมการแข่งขัน</CardTitle>
                <CardDescription className="text-xs text-slate-500">ติดตามว่าใครคือ Host และจำนวนเงินที่แทง</CardDescription>
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
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800">
                        {player.id === user.id ? 'คุณ' : `ผู้เล่น ${index + 1}`}
                        {player.id === user.id && isHost && ' (Host)'}
                      </div>
                      {player.id === user.id && (
                        <Badge variant="secondary" className="text-[11px] uppercase">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">แทง {player.betAmount} บาท</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {renderQuestionPreviewCard()}
        {renderResultCard()}
      </div>
    </div>
  )
}
