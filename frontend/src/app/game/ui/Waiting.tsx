"use client"

import { FC } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const Waiting: FC = () => {
  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex items-start justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Waiting Head Select sth.</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">รอหัวหน้าห้องเลือกโจทย์/เกม</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Waiting

