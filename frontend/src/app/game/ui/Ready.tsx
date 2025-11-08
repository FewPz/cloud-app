"use client"

import { FC } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const Ready: FC = () => {
  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-start justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ready to play</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">ผู้เล่นพร้อมแล้ว เริ่มเลยไหม?</p>
          </div>
          <Button>Start</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Ready

