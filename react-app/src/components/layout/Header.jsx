import { useLayoutStore } from '../../stores/useLayoutStore'
import { useThemeStore } from '../../stores/useThemeStore'
import { useNotesStore } from '../../hooks/useNotes'
import Calendar from '../ui/Calendar'
import Icon from '../ui/Icon'
import { useState } from 'react'

const SIZE_OPTIONS = [
  { size: 'small', icon: 'apps', title: 'Cards Pequenos' },
  { size: 'medium', icon: 'grid_view', title: 'Cards Médios' },
  { size: 'large', icon: 'view_stream', title: 'Cards Grandes' },
]

export default function Header({ selectedDate, onSelectDate }) {
  const { gridSize, setGridSize, toggleSidebar } = useLayoutStore()
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const { searchQuery, setSearchQuery } = useNotesStore()

  return (
    <header className="bg-background flex justify-between items-center w-full px-4 md:px-8 lg:px-12 py-4 h-20 flex-shrink-0 z-30 gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors"
        aria-label="Abrir menu"
      >
        <Icon name="menu" />
      </button>

      {/* Calendar / Date */}
      <Calendar selectedDate={selectedDate} onSelectDate={onSelectDate} />

      {/* Search */}
      <div className="flex-1 max-w-2xl relative hidden sm:block">
        <div className="flex items-center bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2 focus-within:border-primary focus-within:bg-surface transition-colors shadow-sm">
          <Icon name="search" className="text-on-surface-variant mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-on-surface outline-none placeholder-on-surface-variant text-sm"
            placeholder="Pesquisar nas notas..."
            id="search-notes"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Grid Size + Theme */}
      <div className="flex items-center gap-2 text-on-surface-variant flex-shrink-0">
        <div className="hidden sm:flex bg-surface-container-low rounded-lg p-1 border border-outline-variant mr-2 md:mr-4">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.size}
              onClick={() => setGridSize(opt.size)}
              className={`p-1.5 rounded transition-colors flex items-center ${
                gridSize === opt.size
                  ? 'bg-surface shadow-sm text-primary'
                  : 'hover:bg-surface-container text-on-surface-variant'
              }`}
              title={opt.title}
            >
              <Icon name={opt.icon} size={20} />
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors flex items-center justify-center cursor-pointer text-primary"
          title={isDark ? 'Modo Claro' : 'Modo Escuro'}
        >
          <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
        </button>
      </div>
    </header>
  )
}
