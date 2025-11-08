import { FC, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useGameState, useGameRoomId } from '@/lib/gameplay'
import { getLobbyInfo } from './actions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'

const GameLobby: FC = () => {
  const [roomId] = useGameRoomId()
  const [, setGameState] = useGameState()
  const [loading, setLoading] = useState(false)
  const [lobby, setLobby] = useState<{
    id: string
    roomCode: string
    title?: string
    users: Array<{ id: string; username: string; profilePicture?: string; money?: number }>
    type?: string
  } | null>(null)

  useEffect(() => {
    let ignore = false
    if (!roomId) return
    setLoading(true)
    getLobbyInfo(roomId)
      .then((data) => {
        if (!ignore) setLobby(data)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    const interval = setInterval(() => {
      // simple polling to keep lobby fresh
      getLobbyInfo(roomId).then((data) => {
        if (!ignore) setLobby(data)
      }).catch(() => {})
    }, 3000)

    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [roomId])

  return (
    <div className="flex items-start justify-center w-full min-h-[calc(100vh-56px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Room {lobby?.roomCode ?? ''}</CardTitle>
          <CardAction>
            <Button onClick={() => setGameState('playing')} disabled={!lobby}>Start</Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-sm text-slate-500">{lobby?.type ?? 'Lobby'}</p>

          {/* Players */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(lobby?.users ?? new Array(4).fill(null)).slice(0, 4).map((u, idx) => (
              <div
                key={u ? u.id : `slot-${idx}`}
                className="flex items-center gap-3 rounded-xl border p-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{u ? u.username?.substring(0, 2)?.toUpperCase() : '...'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{u ? u.username : `Empty Slot`}</span>
                  {u && (
                    <span className="text-xs text-slate-500">{u.money ?? 0}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <p className="text-center text-sm text-slate-500">Loading lobby...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default GameLobby
