"use client"

import { FC, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SpinWheel, { WheelItem } from "@/components/next/SpinWheel"
import Link from "next/link"

type Phase = "setup" | "ready" | "spinning" | "voting" | "results" | "leaderboard"

type WheelOption = WheelItem<string>

const defaultItems: WheelOption[] = [
  { id: "5", label: "+5" },
  { id: "8", label: "+8" },
  { id: "10", label: "+10" },
  { id: "-10", label: "-10" },
  { id: "??", label: "???" },
]

const GamePlaying: FC = () => {
  const [phase, setPhase] = useState<Phase>("setup")
  const [items, setItems] = useState<WheelOption[]>(defaultItems)
  const [newItem, setNewItem] = useState("")
  const [round, setRound] = useState(1)
  const maxRounds = 3
  const [lastResult, setLastResult] = useState<WheelOption | null>(null)
  const [bet, setBet] = useState("วันนี้พี่ช้างจะมีหมูกรอบไหม?")
  const [vote, setVote] = useState<"มี" | "ไม่มี" | null>(null)

  const addItem = () => {
    const label = newItem.trim()
    if (!label) return
    setItems((prev) => [...prev, { id: `${label}-${Date.now()}`, label }])
    setNewItem("")
  }

  const getResult = async () => {
    // For now, choose a random item to mirror demo
    const idx = Math.floor(Math.random() * items.length)
    return items[idx].id
  }

  const onSpinFinished = (item: WheelOption) => {
    setLastResult(item)
    setPhase("voting")
  }

  const goNextRound = () => {
    if (round >= maxRounds) {
      setPhase("leaderboard")
      return
    }
    setRound((r) => r + 1)
    setPhase("ready")
  }

  // make wheel responsive to viewport width
  const [wheelSize, setWheelSize] = useState(320)
  useEffect(() => {
    const set = () => {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
      // leave side paddings; clamp to [220, 360]
      const ideal = Math.floor(vw * 0.7)
      setWheelSize(Math.max(220, Math.min(360, ideal)))
    }
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Left Panel: main stage visuals */}
        <Card className="w-full">
          <CardContent className="p-4 sm:p-6 min-h-[24rem] sm:min-h-[28rem] flex items-center justify-center">
          {phase === "setup" && (
            <div className="w-full">
              <h3 className="text-xl font-bold mb-4">Match Fixing Setup</h3>
              <div className="mb-4">
                <Label htmlFor="bet">Bet question</Label>
                <Input id="bet" value={bet} onChange={(e) => setBet(e.target.value)} placeholder="วันนี้พี่ช้างจะมีหมูกรอบไหม?" />
              </div>
              <div className="flex gap-2 items-end mb-4">
                <div className="flex-1">
                  <Label htmlFor="wheel-item">Add item</Label>
                  <Input id="wheel-item" placeholder="e.g. +5" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                </div>
                <Button onClick={addItem}>Add</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                {items.map((w) => (
                  <div key={w.id} className="px-3 py-2 rounded-lg border text-center text-sm">
                    {w.label}
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setPhase("ready")} disabled={!bet.trim()}>Finish Setup</Button>
            </div>
          )}

          {phase === "ready" && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <h3 className="text-xl font-bold">Ready to play</h3>
                <p className="text-slate-500">Round {round} of {maxRounds}</p>
                <p className="mt-2 font-medium">{bet}</p>
              </div>
              <Button onClick={() => setPhase("spinning")}>Start</Button>
            </div>
          )}

          {phase === "spinning" && (
            <div className="flex flex-col items-center">
              <SpinWheel
                items={items}
                getResult={getResult}
                onFinished={onSpinFinished}
                size={wheelSize}
              />
            </div>
          )}

          {phase === "voting" && (
            <div className="w-full flex flex-col gap-4">
              <h3 className="text-xl font-bold">โหวตผลจริง</h3>
              <p className="text-slate-600">{bet}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant={vote === 'มี' ? 'default' : 'outline'} className="h-20" onClick={() => setVote('มี')}>มีหมูกรอบ</Button>
                <Button variant={vote === 'ไม่มี' ? 'default' : 'outline'} className="h-20" onClick={() => setVote('ไม่มี')}>ไม่มีหมูกรอบ</Button>
              </div>
              <Button onClick={() => setPhase("results")} disabled={!vote}>Submit Vote</Button>
            </div>
          )}

          {phase === "results" && (
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">ผลลัพธ์</h3>
              <p className="mb-2">คำถาม: <span className="font-semibold">{bet}</span></p>
              <p className="mb-6">Wheel landed on: <span className="font-semibold">{lastResult?.label}</span></p>
              <Button onClick={goNextRound}>Next</Button>
            </div>
          )}

          {phase === "leaderboard" && (
            <div className="w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">ว่ายไอ้มีแพ้ (Leaderboard)</h3>
              <div className="flex flex-col gap-2">
                {["Rank #1", "Rank #2", "Rank #3", "Rank #4"].map((r) => (
                  <div key={r} className="rounded-lg border px-4 py-3">{r}</div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/" className="inline-block"><Button>Leave</Button></Link>
              </div>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Right Panel: settings / secondary boxes matching diagram shapes */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 min-h-[24rem] sm:min-h-[28rem]">
            {phase === "setup" && (
              <div className="flex flex-col gap-3">
                <div>
                  <Label>Rounds</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[1,2,3].map((n) => (
                      <Button key={n} variant={n===maxRounds?"default":"outline"}>{n}</Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {phase !== "setup" && (
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-semibold">Status</h3>
                <div className="rounded-lg border p-3">
                  <p>Phase: <span className="font-medium">{phase}</span></p>
                  <p>Round: <span className="font-medium">{round}/{maxRounds}</span></p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-slate-600">Bet</p>
                  <p className="font-medium">{bet}</p>
                </div>
                {lastResult && (
                  <div className="rounded-lg border p-3">
                    Last Result: <span className="font-semibold">{lastResult.label}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default GamePlaying
