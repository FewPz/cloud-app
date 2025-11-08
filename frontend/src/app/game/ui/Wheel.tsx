"use client"

import { FC } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SpinWheel, WheelItem } from "@/components/next/SpinWheel"

const ITEMS: WheelItem<string>[] = ["+5","+8","+10","-10","???"].map((l, i) => ({ id: `${i}-${l}`, label: l }))

const Wheel: FC = () => {
  const getResult = async () => {
    const idx = Math.floor(Math.random() * ITEMS.length)
    return ITEMS[idx].id
  }
  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Spin Wheel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <SpinWheel items={ITEMS} getResult={getResult} />
        </CardContent>
      </Card>
    </div>
  )
}

export default Wheel

