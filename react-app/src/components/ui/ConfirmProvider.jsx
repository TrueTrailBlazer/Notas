import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ConfirmContext = createContext(null)

export function useConfirm() {
  return useContext(ConfirmContext)
}

export default function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', message: '' })
  const resolveRef = useRef(null)

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({ open: true, title, message, animating: false })
      // Trigger animation in
      requestAnimationFrame(() => setState((s) => ({ ...s, animating: true })))
    })
  }, [])

  const handleClose = (result) => {
    setState((s) => ({ ...s, animating: false }))
    setTimeout(() => {
      setState({ open: false, title: '', message: '' })
      resolveRef.current?.(result)
    }, 300)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div
          className={`fixed inset-0 z-[800] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${
            state.animating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => handleClose(false)}
        >
          <div
            className={`bg-surface border border-outline-variant rounded-2xl p-6 max-w-sm w-full shadow-2xl transition-transform duration-300 ${
              state.animating ? 'scale-100' : 'scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold mb-2 text-on-background">
              {state.title}
            </h3>
            <p className="text-on-surface-variant mb-6 font-body">{state.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-primary hover:bg-surface-container rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleClose(true)}
                className="px-4 py-2 bg-error text-on-error rounded-lg font-medium hover:bg-error-container hover:text-on-error-container transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
