"use client"

import { FC } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const Results: FC = () => {
  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ผลลัพธ์</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p>Wheel landed on: <span className="font-semibold">???</span></p>
          <Button>Next</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Results

