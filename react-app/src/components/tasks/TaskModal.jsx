import { useState, useEffect } from 'react'
import { useConfirm } from '../ui/ConfirmProvider'
import Icon from '../ui/Icon'

export default function TaskModal({ task, onClose, onSave, onDelete }) {
  const confirm = useConfirm()
  const [text, setText] = useState(task?.text || '')
  const [isFixed, setIsFixed] = useState(task?.is_fixed || false)

  useEffect(() => {
    if (task) {
      setText(task.text)
      setIsFixed(task.is_fixed)
    }
  }, [task])

  if (!task) return null

  const handleSave = () => {
    if (!text.trim()) return
    onSave(task.id, text.trim(), isFixed)
    onClose()
  }

  const handleDelete = async () => {
    const ok = await confirm('Deletar Tarefa', 'Tem certeza que deseja apagar esta tarefa?')
    if (ok) {
      onDelete(task.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-semibold mb-4 text-on-background">
          Gerenciar Tarefa
        </h3>

        <label className="block font-display text-xs text-on-surface-variant mb-1">
          Nome da Tarefa
        </label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 outline-none mb-6 text-on-surface focus:border-primary transition-colors"
          autoFocus
        />

        <label className="flex items-center gap-3 cursor-pointer mb-8 group bg-surface-container-low p-3 rounded-lg border border-transparent hover:border-outline-variant transition-all">
          <input
            type="checkbox"
            className="sleek-checkbox"
            checked={isFixed}
            onChange={(e) => setIsFixed(e.target.checked)}
          />
          <div className="flex flex-col">
            <span className="text-on-surface font-medium">Tarefa Fixa</span>
            <span className="text-on-surface-variant text-xs">Reseta todos os dias.</span>
          </div>
        </label>

        <div className="flex justify-between items-center">
          <button
            onClick={handleDelete}
            className="p-2 text-error hover:bg-error-container rounded-lg transition-colors flex items-center justify-center"
            title="Deletar"
          >
            <Icon name="delete" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-primary hover:bg-surface-container rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-secondary transition-colors shadow-sm"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
