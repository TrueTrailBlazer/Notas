import { useRef, useCallback, useEffect } from 'react'

/**
 * Hook that returns a debounced save function.
 * Every call resets the timer. On unmount, any pending save is flushed.
 */
export function useAutosave(saveFn, delay = 800) {
  const timerRef = useRef(null)
  const saveFnRef = useRef(saveFn)

  // Keep the ref fresh so we always call the latest closure
  useEffect(() => {
    saveFnRef.current = saveFn
  }, [saveFn])

  const trigger = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveFnRef.current()
    }, delay)
  }, [delay])

  // Flush on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return trigger
}
