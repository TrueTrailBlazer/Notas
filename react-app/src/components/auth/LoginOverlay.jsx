import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import Icon from '../ui/Icon'

export default function LoginOverlay() {
  const { login, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    clearError()
    await login(email.trim(), password.trim())
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center transition-opacity duration-300">
      <div className="bg-surface border border-outline-variant rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-extrabold text-primary tracking-tight">
            Notas Diárias
          </h1>
          <p className="text-on-surface-variant mt-2">Acesse seu espaço</p>
        </div>
        <div className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 outline-none text-on-surface focus:border-primary transition-colors"
            placeholder="Email"
            id="auth-email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 outline-none text-on-surface focus:border-primary transition-colors"
            placeholder="Senha"
            id="auth-password"
          />
          {error && (
            <div className="text-error text-sm bg-error-container p-2 rounded" id="auth-error">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg mt-2 hover:bg-secondary transition-colors h-12 flex items-center justify-center disabled:opacity-60"
            id="btn-login"
          >
            {loading ? (
              <Icon name="progress_activity" className="animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
