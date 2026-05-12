import Link from 'next/link'
import React from 'react'

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-0 group">
      {/* "Tech" wala part - Purple/Indigo Color */}
      <span className="text-2xl font-black tracking-tighter text-indigo-600 transition-colors group-hover:text-indigo-500">
        Tech
      </span>
      {/* "Pulse" wala part - White ya Dark Gray (background ke hisaab se) */}
      <span className="text-2xl font-black tracking-tighter text-white transition-transform group-hover:scale-105">
        Pulse
      </span>
      {/* Ek chota sa dot futuristic look ke liye */}
      <span className="h-2 w-2 rounded-full bg-indigo-600 ml-0.5 animate-pulse"></span>
    </Link>
  )
}

export default Logo