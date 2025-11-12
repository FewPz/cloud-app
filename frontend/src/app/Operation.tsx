'use client'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinWSGame, useWSClient, useWSMessage, useWSSend } from '@/lib/ws'
import { LogInIcon } from 'lucide-react'
import Link from 'next/link'
import { FC, useState } from 'react'
import { joinGame } from './actions'
import { toast } from 'sonner'
import { useGameRoomId, useGameState } from '@/lib/gameplay'
import { useRouter } from 'next/navigation'
import { joinRoom as joinRoomAction } from './actions'

const Operation: FC = () => {
  const router = useRouter()

  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [, setMessage] = useWSMessage()
  const [, setWS] = useWSClient()
  const [, setGameState] = useGameState()
  const [, setGameId] = useGameRoomId()

  const joinRoom = async () => {
    try {
      const { status, data } = await joinRoomAction(roomCode)

      console.log("Join room response:", { status, data })

      if (status !== 200) {
        if (status === 401) {
          toast.error("กรุณาเข้าสู่ระบบก่อนเข้าร่วมห้อง")
          router.push('/signin')
          return
        }
        if (status === 404) {
          toast.error("ไม่พบห้อง กรุณาตรวจสอบโค้ดอีกครั้ง")
          return
        }
        console.error("Failed to join room:", data)
        toast.error(data?.message || "ไม่สามารถเข้าร่วมห้องได้")
        return
      }

      if (!data?.roomId) {
        console.error("No room ID returned:", data)
        toast.error("ข้อมูลตอบกลับจากเซิร์ฟเวอร์ไม่ถูกต้อง")
        return
      }

      // Redirect to the room page
      router.push(`/room/${data.roomId}`)
    } catch (error) {
      console.error("Failed to join room:", error)
      toast.error("ไม่สามารถเข้าร่วมห้องได้")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {joinRoomOpen && (
        <>
          <Input
            placeholder="กรอกโค้ดห้อง"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className='text-center'
            inputMode='text'
          />
          <Button onClick={joinRoom}>
            <LogInIcon />
            เข้าร่วมห้อง
          </Button>
        </>
      )}

      {!joinRoomOpen && (
        <Button onClick={() => setJoinRoomOpen(true)}>
          เข้าร่วมห้อง
        </Button>
      )}

      <Link
        href="/create-room"
        className={buttonVariants({
          variant: 'outline',
        })}
      >
        สร้างห้องใหม่
      </Link>
    </div>
  )
}

export default Operation
