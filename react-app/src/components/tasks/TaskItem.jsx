import Icon from '../ui/Icon'

export default function TaskItem({ task, onToggle, onEdit }) {
  return (
    <li className="flex items-start gap-3 group relative bg-transparent hover:bg-surface-container-low p-2 rounded-lg transition-colors border border-transparent hover:border-outline-variant">
      <div className="mt-0.5 flex-shrink-0">
        <input
          className="sleek-checkbox"
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
        />
      </div>
      <label
        className={`font-body text-sm text-on-surface cursor-pointer flex-1 transition-colors duration-200 line-clamp-3 break-words leading-snug ${
          task.completed ? 'line-through opacity-50' : ''
        }`}
        onClick={() => onToggle(task.id)}
        title={task.text}
      >
        {task.text}
      </label>
      <button
        className="flex-shrink-0 ml-auto text-on-surface-variant hover:text-primary p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onEdit(task)}
        title="Gerenciar"
      >
        <Icon name="edit_note" size={18} />
      </button>
    </li>
  )
}
