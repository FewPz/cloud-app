"use client"

import { FC, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const Voting: FC = () => {
  const [vote, setVote] = useState<"มี" | "ไม่มี" | null>(null)

  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-start justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>โหวตผลจริง</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant={vote === 'มี' ? 'default' : 'outline'} onClick={() => setVote('มี')}>มีหมูกรอบ</Button>
            <Button variant={vote === 'ไม่มี' ? 'default' : 'outline'} onClick={() => setVote('ไม่มี')}>ไม่มีหมูกรอบ</Button>
          </div>
          <Button disabled={!vote}>Submit Vote</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Voting

