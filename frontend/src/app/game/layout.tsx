'use client'

import { useGameState } from "@/lib/gameplay"
import { redirect } from "next/navigation"
import { FC } from "react"

interface Props {
  children: React.ReactNode
}

const GameLayout: FC<Props> = ({ children }) => {
  const [state] = useGameState()

  if (state === "none") {
    return redirect("/")
  }

  return (
    <div className="w-[100vw] -mx-8 sm:-mx-20 -mb-20 min-h-[calc(100vh-56px)] -mt-8 sm:-mt-10">
      {children}
    </div>
  )
}

export default GameLayout
