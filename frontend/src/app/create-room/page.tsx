"use client"

import { NextPage } from "next"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import BackButton from "@/components/next/BackButton"

const CreateRoomPage: NextPage = () => {
  const [title, setTitle] = useState("")
  const [rounds, setRounds] = useState(3)
  const [type, setType] = useState<"matchfixing" | "spinthewheel">("matchfixing")
  const router = useRouter()

  const handleCreate = async () => {
    // Backend create endpoint not defined yet; stub for now.
    // You can wire to API here when available.
    console.info("Create room:", { title, rounds, type })
    router.push("/")
  }

  return (
    <div className="self-stretch w-full h-full flex flex-col items-center p-4 sm:p-6 gap-3">
      <div className="w-full max-w-md">
        <BackButton />
      </div>
      <Card className="w-full max-w-md border shadow-md">
        <CardHeader>
          <CardTitle>Create room</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday Night" />
          </div>
          <div>
            <Label>Game Type</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <Button
                variant={type === 'matchfixing' ? 'default' : 'outline'}
                onClick={() => setType('matchfixing')}
              >
                Match Fixing
              </Button>
              <Button
                variant={type === 'spinthewheel' ? 'default' : 'outline'}
                onClick={() => setType('spinthewheel')}
              >
                Spin the Wheel
              </Button>
            </div>
          </div>
          <div>
            <Label>Rounds</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1,2,3].map((n) => (
                <Button key={n} variant={rounds===n?"default":"outline"} onClick={() => setRounds(n)}>{n}</Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCreate}>Create</Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CreateRoomPage
