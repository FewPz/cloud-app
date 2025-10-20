'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWS, useWSMessage, useWSSend } from '@/lib/ws'
import { LogInIcon } from 'lucide-react'
import Link from 'next/link'
import { FC, useState } from 'react'

const Operation: FC = () => {
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const send = useWSSend()
  const [message] = useWSMessage()

  const joinRoom = () => {
    send({ type: 'join', payload: { roomCode } })
    console.log(message)
  }

  return (
    <div className="flex flex-col gap-2">
      {joinRoomOpen && (
        <>
          <Input
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className='text-center'
            inputMode='text'
          />
          <Button onClick={joinRoom}>
            <LogInIcon />
            Join Room
          </Button>
        </>
      )}

      {!joinRoomOpen && (
        <Button onClick={() => setJoinRoomOpen(true)}>
          Join Room
        </Button>
      )}

      {!joinRoomOpen && (
        <Link
          href="/create-room"
          className={buttonVariants({
            variant: 'outline',
          })}
        >
          Create Room
        </Link>
      )}

      <Link
        href="/lobby"
        className={buttonVariants({
          variant: 'outline',
        })}
      >
        Lobby
      </Link>
    </div>
  )
}

export default Operation