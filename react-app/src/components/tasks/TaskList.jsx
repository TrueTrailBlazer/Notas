import Icon from '../ui/Icon'
import TaskItem from './TaskItem'

export default function TaskList({ title, tasks, collapsed, onToggleCollapse, onToggleTask, onEditTask }) {
  return (
    <div>
      <div
        onClick={onToggleCollapse}
        className="flex items-center gap-1 cursor-pointer group mb-3 select-none w-max"
      >
        <Icon
          name="expand_less"
          size={18}
          className={`text-on-surface-variant group-hover:text-primary transition-transform duration-200 ${
            collapsed ? 'rotate-180' : ''
          }`}
        />
        <h3 className="font-display text-xs text-on-surface-variant group-hover:text-primary uppercase tracking-wider transition-colors font-medium">
          {title}
        </h3>
      </div>
      <ul
        className={`flex flex-col gap-2 transition-all duration-300 ${
          collapsed ? 'h-0 overflow-hidden opacity-0' : ''
        }`}
      >
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onEdit={onEditTask}
          />
        ))}
      </ul>
    </div>
  )
}
