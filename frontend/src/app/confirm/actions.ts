'use client'

import axios from "axios";

export const confirmSignUp = async (username: string, confirmationCode: string) => {
  try {
    const result = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/confirm`, {
      username,
      confirmationCode,
    });

    return { 
      success: true, 
      message: result.data.message || "ยืนยันอีเมลสำเร็จ!" 
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const { response } = error;
      return { 
        success: false, 
        message: response?.data?.message || "ยืนยันไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" 
      };
    }

    return { 
      success: false, 
      message: "ยืนยันไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" 
    };
  }
}

export const resendConfirmationCode = async (username: string) => {
  try {
    const result = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/resend-code`, {
      username,
    });

    return { 
      success: true, 
      message: result.data.message || "ส่งรหัสยืนยันไปยังอีเมลของคุณแล้ว!" 
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const { response } = error;
      return { 
        success: false, 
        message: response?.data?.message || "ส่งรหัสซ้ำไม่สำเร็จ กรุณาลองอีกครั้ง" 
      };
    }

    return { 
      success: false, 
      message: "ส่งรหัสซ้ำไม่สำเร็จ กรุณาลองอีกครั้ง" 
    };
  }
}
