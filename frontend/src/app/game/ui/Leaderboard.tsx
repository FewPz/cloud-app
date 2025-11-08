"use client"

import { FC } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const Leaderboard: FC = () => {
  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-start justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ว่ายไอ้มีแพ้</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {["Rank #1","Rank #2","Rank #3","Rank #4"].map((r) => (
            <div key={r} className="rounded-lg border px-4 py-3">{r}</div>
          ))}
          <div className="pt-2">
            <Link href="/"><Button>Leave</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Leaderboard

