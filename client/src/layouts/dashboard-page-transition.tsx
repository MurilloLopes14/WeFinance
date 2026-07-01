import { motion, useReducedMotion } from 'motion/react'
import { Outlet, useLocation } from 'react-router-dom'

export function DashboardPageTransition() {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      key={location.pathname}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <Outlet />
    </motion.div>
  )
}
