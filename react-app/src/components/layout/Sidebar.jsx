import { useState, useEffect, useCallback, useRef } from 'react'
import { useLayoutStore } from '../../stores/useLayoutStore'
import { useTasksStore } from '../../hooks/useTasks'
import { useConfirm } from '../ui/ConfirmProvider'
import TaskList from '../tasks/TaskList'
import TaskModal from '../tasks/TaskModal'
import AddTaskInput from '../tasks/AddTaskInput'
import Icon from '../ui/Icon'

const NAV_ITEMS = [
  { target: 'dashboard', icon: 'check_circle', label: 'Tarefas Diárias' },
  { target: 'pinned', icon: 'push_pin', label: 'Notas Fixadas' },
  { target: 'archives', icon: 'inventory_2', label: 'Arquivo' },
  { target: 'settings', icon: 'settings', label: 'Configurações' },
]

export default function Sidebar() {
  const {
    sidebarWidth,
    setSidebarWidth,
    sidebarOpen,
    closeSidebar,
    activeView,
    setActiveView,
    fixedCollapsed,
    newCollapsed,
    toggleFixedCollapsed,
    toggleNewCollapsed,
  } = useLayoutStore()

  const {
    fixed: fixedTasks,
    new: newTasks,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    clearNewTasks,
  } = useTasksStore()

  const confirm = useConfirm()
  const [editingTask, setEditingTask] = useState(null)
  const isResizingRef = useRef(false)

  // Sidebar resizer logic (desktop)
  const handleResizeStart = useCallback((e) => {
    e.preventDefault()
    isResizingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e) => {
      if (!isResizingRef.current) return
      let newWidth = e.clientX
      if (newWidth < 220) newWidth = 220
      if (newWidth > 600) newWidth = 600
      setSidebarWidth(newWidth)
    }

    const onMouseUp = () => {
      isResizingRef.current = false
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [setSidebarWidth])

  const handleNavClick = (target) => {
    setActiveView(target)
    closeSidebar() // Close on mobile
  }

  const handleClearNewTasks = async () => {
    const ok = await confirm('Limpar Tarefas', 'Tem certeza que deseja apagar todas as tarefas não-fixas?')
    if (ok) clearNewTasks()
  }

  const handleSaveTask = (id, text, isFixed) => {
    updateTask(id, text, isFixed)
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <nav
        className={`bg-surface-container-lowest shadow-sm h-full fixed left-0 top-0 z-40 flex flex-col py-8 px-4 flex-shrink-0 transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Title */}
        <div className="mb-8 px-2">
          <h1 className="font-display text-3xl font-extrabold text-primary tracking-tight">
            Notas Diárias
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Registros diários organizados
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-2 mb-8">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.target
            return (
              <button
                key={item.target}
                onClick={() => handleNavClick(item.target)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 ${
                  isActive
                    ? 'text-primary font-bold bg-surface-container-low'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Icon name={item.icon} fill={isActive} />
                <span className="font-display text-sm">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div className="h-px w-full bg-outline-variant mb-6" />

        {/* Task Lists */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 flex flex-col gap-6">
          <TaskList
            title="Tarefas Fixas"
            tasks={fixedTasks}
            collapsed={fixedCollapsed}
            onToggleCollapse={toggleFixedCollapsed}
            onToggleTask={toggleTask}
            onEditTask={setEditingTask}
          />
          <div>
            <div className="flex justify-between items-center mb-3">
              <div
                onClick={toggleNewCollapsed}
                className="flex items-center gap-1 cursor-pointer group select-none"
              >
                <Icon
                  name="expand_less"
                  size={18}
                  className={`text-on-surface-variant group-hover:text-primary transition-transform duration-200 ${
                    newCollapsed ? 'rotate-180' : ''
                  }`}
                />
                <h3 className="font-display text-xs text-on-surface-variant group-hover:text-primary uppercase tracking-wider transition-colors font-medium">
                  Novas Tarefas
                </h3>
              </div>
              <button
                onClick={handleClearNewTasks}
                className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error-container flex items-center justify-center"
                title="Limpar tarefas"
              >
                <Icon name="delete_sweep" size={18} />
              </button>
            </div>
            <ul
              className={`flex flex-col gap-2 transition-all duration-300 ${
                newCollapsed ? 'h-0 overflow-hidden opacity-0' : ''
              }`}
            >
              {newTasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3 group relative bg-transparent hover:bg-surface-container-low p-2 rounded-lg transition-colors border border-transparent hover:border-outline-variant">
                  <div className="mt-0.5 flex-shrink-0">
                    <input
                      className="sleek-checkbox"
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                    />
                  </div>
                  <label
                    className={`font-body text-sm text-on-surface cursor-pointer flex-1 transition-colors duration-200 line-clamp-3 break-words leading-snug ${
                      task.completed ? 'line-through opacity-50' : ''
                    }`}
                    onClick={() => toggleTask(task.id)}
                    title={task.text}
                  >
                    {task.text}
                  </label>
                  <button
                    className="flex-shrink-0 ml-auto text-on-surface-variant hover:text-primary p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditingTask(task)}
                    title="Gerenciar"
                  >
                    <Icon name="edit_note" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Add Task Input */}
        <div className="mt-4 px-2">
          <AddTaskInput onAdd={addTask} />
        </div>

        {/* Resizer (desktop only) */}
        <div
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 transition-colors z-50 hidden md:block"
          onMouseDown={handleResizeStart}
        />
      </nav>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={deleteTask}
        />
      )}
    </>
  )
}
