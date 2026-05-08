import Icon from '../ui/Icon'

export default function NewNoteButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-surface-container-low rounded-xl border border-dashed border-primary/50 hover:bg-surface hover:border-primary hover:shadow-sm transition-all duration-200 p-card-padding flex flex-col items-center justify-center min-h-[240px] group col-span-1 row-span-1"
    >
      <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
        <Icon name="add" size={24} />
      </div>
      <span className="font-display text-base font-medium text-primary">
        Criar Nova Nota
      </span>
    </button>
  )
}
