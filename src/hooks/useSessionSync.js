import { useEffect, useRef } from 'react'
import { saveSession } from '../db/session'

export default function useSessionSync(key, state) {
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return undefined
    }
    const id = setTimeout(() => saveSession(key, state), 400)
    return () => clearTimeout(id)
  }, [key, state])
}
