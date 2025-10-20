'use client'

import { useWSMessage } from "@/lib/ws"
import { NextPage } from "next"

const LobbyPage: NextPage = () => {
  const [message] = useWSMessage()
  return (
    <div>{JSON.stringify(message)}</div>
  )
}

export default LobbyPage