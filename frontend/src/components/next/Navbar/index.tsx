'use client'

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useWS } from "@/lib/ws"
import { Wallet, WifiIcon, WifiOffIcon } from "lucide-react"
import Link from "next/link"
import { FC } from "react"
import * as motion from "framer-motion/client"

const onlineBadgeAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 },
}

const Navbar: FC = () => {
  const online = useWS((state) => state.ready)

  return (
    <div className="h-14 w-full rounded-full p-2 flex items-center justify-between">
      {online ? (
        <motion.div {...onlineBadgeAnimation}>
          <Badge className="bg-green-500"><WifiIcon />Online</Badge>
        </motion.div>
      ) : (
        <motion.div {...onlineBadgeAnimation}>
          <Badge className=" bg-red-500"><WifiOffIcon />Offline</Badge>
        </motion.div>
      )}

      <div className="flex gap-2 items-center">
        <Link href='/topup' className="flex"><Wallet className="mr-1" />50</Link>

        <Avatar className="shadow">
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}

export default Navbar