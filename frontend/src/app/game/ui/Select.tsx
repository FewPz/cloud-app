"use client"

import { FC, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const Select: FC = () => {
  const [bet, setBet] = useState("วันนี้พี่ช้างจะมีหมูกรอบไหม?")
  const [options, setOptions] = useState(["มีหมูกรอบ", "ไม่มีหมูกรอบ"]) // simple example

  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-start justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Head Select</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label htmlFor="bet">Bet question</Label>
            <Input id="bet" value={bet} onChange={(e) => setBet(e.target.value)} />
          </div>
          <div>
            <Label>Vote options</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {options.map((o, i) => (
                <Input key={i} value={o} onChange={(e) => setOptions(prev => prev.map((v, idx) => idx===i? e.target.value : v))} />
              ))}
            </div>
          </div>
          <Button>Submit</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Select

