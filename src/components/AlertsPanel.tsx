import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Alert } from '../lib/analytics'

export default function AlertsPanel({ alerts }: { alerts: Alert[] }){
  if(alerts.length === 0) return null

  return (
    <div className="mb-4 space-y-2">
      <AnimatePresence>
        {alerts.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-3 rounded-lg border text-sm ${
              a.severity === 'high'
                ? 'bg-red-950/50 border-red-800 text-red-200'
                : 'bg-yellow-950/40 border-yellow-800 text-yellow-200'
            }`}
          >
            {a.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
