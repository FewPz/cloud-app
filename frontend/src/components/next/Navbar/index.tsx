'use client'

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/user";
import { logout } from "@/lib/user/actions";
import { avataaarsNeutral } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { ChevronDown, Coins } from "lucide-react";
import Link from "next/link";
import { FC, useMemo } from "react";

const Navbar: FC = () => {
  const [user] = useUser()

  const avatar = useMemo(() => {
    return createAvatar(avataaarsNeutral, {
      size: 128,
    }).toDataUri();
  }, []);

  return (
    <div className="h-14 w-full rounded-full p-2 flex items-center justify-between">
      {user && (
        <>
          <Link href='/topup' className="flex"><Coins className="mr-1" />{user.money}</Link>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex gap-1 items-center">
                <Avatar className="shadow bg-white">
                  <AvatarImage src={avatar} />
                </Avatar>
                <ChevronDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <span className="text-xs text-muted-foreground">Logged in as </span>
                  <span className="font-medium">{user.username}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">Balance: </span>
                  <span className="font-medium">{user.money}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">Log Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  )
}

export default Navbar