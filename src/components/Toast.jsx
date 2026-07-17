import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)

  const showToast = useCallback((text) => {
    setMsg(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMsg(null), 2200)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </ToastContext.Provider>
  )
}
