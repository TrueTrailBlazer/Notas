import { useAuthStore } from '../stores/useAuthStore'
import Icon from '../components/ui/Icon'

export default function Settings() {
  const { logout } = useAuthStore()

  const handleClearLocal = () => {
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold">Configurações</h2>
      </div>

      <div className="bg-surface rounded-xl border border-outline-variant p-6 max-w-xl flex flex-col gap-6">
        <div>
          <h3 className="font-display text-sm font-medium text-on-surface-variant mb-3">Conta</h3>
          <button
            onClick={logout}
            className="px-4 py-2 bg-error text-on-error rounded-lg hover:opacity-90 transition-colors font-medium flex items-center gap-2"
          >
            <Icon name="logout" size={18} />
            Sair da Conta
          </button>
        </div>

        <div className="h-px bg-outline-variant" />

        <div>
          <h3 className="font-display text-sm font-medium text-on-surface-variant mb-3">Dados Locais</h3>
          <button
            onClick={handleClearLocal}
            className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-high transition-colors font-medium flex items-center gap-2"
          >
            <Icon name="delete_forever" size={18} />
            Limpar Cache Local
          </button>
          <p className="text-on-surface-variant text-xs mt-2">
            Remove preferências salvas (tema, tamanho da sidebar, etc). Os dados do Supabase não são afetados.
          </p>
        </div>
      </div>
    </div>
  )
}
