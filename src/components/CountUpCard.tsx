import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

export default function CountUpCard({ label, value, accent, suffix }: { label: string, value: number, accent?: 'red' | 'default', suffix?: string }){
  const count = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: 'easeOut' })
    const unsub = count.on('change', v => setDisplay(Math.round(v * 10) / 10))
    return () => { controls.stop(); unsub() }
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="p-4 rounded-xl bg-neutral-800/60 backdrop-blur border border-neutral-700"
    >
      <div className="text-sm text-neutral-400">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${accent === 'red' ? 'text-red-500' : 'text-white'}`}>
        {display}{suffix}
      </div>
    </motion.div>
  )
}
