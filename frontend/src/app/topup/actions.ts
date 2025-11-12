'use client'

import axios from "axios"

export const topup = async () => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("ยังไม่ได้เข้าสู่ระบบ")
  }

  const result = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/wallet/topup`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (result.status !== 200) {
    throw new Error("เติมเงินไม่สำเร็จ");
  }

  return result.data as { message: string; newBalance: number, got: number };
}
