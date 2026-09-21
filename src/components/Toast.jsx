import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

const SHOWN = 2200 // how long it reads for
const FADE = 260 // must match the toast-out animation in the stylesheet

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef([])

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  // A toast that simply disappeared looked like a glitch, so it fades: the
  // class goes on first, and the element is only dropped once it has faded.
  const showToast = useCallback((text) => {
    clear()
    setMsg(text)
    setLeaving(false)
    timers.current = [
      setTimeout(() => setLeaving(true), SHOWN),
      setTimeout(() => setMsg(null), SHOWN + FADE),
    ]
  }, [])

  useEffect(() => clear, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {msg && <div className={'toast' + (leaving ? ' leaving' : '')}>{msg}</div>}
    </ToastContext.Provider>
  )
}
