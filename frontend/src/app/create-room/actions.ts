'use server'

import { redirect } from 'next/navigation'

export async function createRoom(minPlayer: number, gameType: string, token: string, title?: string) {
  try {
    if (!token) {
      redirect('/signin')
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

    const payload: Record<string, unknown> = {
      minPlayer,
      gameType,
    }

    if (title && title.trim().length > 0) {
      payload.title = title.trim()
    }

    const response = await fetch(`${apiUrl}/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to create room:', response.status, errorText)
      throw new Error(`Failed to create room: ${response.status}`)
    }

    const room = await response.json()
    console.log('Room created:', room)
    
    // Redirect to the room page
    redirect(`/room/${room.id}`)
  } catch (error) {
    console.error('Error creating room:', error)
    throw error
  }
}
