'use client'

import { useGameState } from "@/lib/gameplay"
import { NextPage } from "next"
import GameLobby from "./ui/Lobby"
import GamePlaying from "./ui/Playing"
import Waiting from "./ui/Waiting"
import Select from "./ui/Select"
import Ready from "./ui/Ready"
import Wheel from "./ui/Wheel"
import Voting from "./ui/Voting"
import Results from "./ui/Results"
import Leaderboard from "./ui/Leaderboard"

const GamePage: NextPage = () => {
  const [state] = useGameState()

  if (state === "lobby") {
    return <GameLobby />
  }

  if (state === "playing") {
    return <GamePlaying />
  }

  if (state === "waiting") return <Waiting />
  if (state === "select") return <Select />
  if (state === "ready") return <Ready />
  if (state === "wheel") return <Wheel />
  if (state === "voting") return <Voting />
  if (state === "results") return <Results />
  if (state === "leaderboard") return <Leaderboard />
}

export default GamePage
