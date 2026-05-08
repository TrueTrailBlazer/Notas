import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'

export default function Calendar({ selectedDate, onSelectDate }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const dropdownRef = useRef(null)
  const widgetRef = useRef(null)

  const isToday = (d) => {
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

  const toggleDropdown = () => {
    if (!open) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
    setOpen(!open)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        widgetRef.current &&
        !widgetRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate)
  const headerLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(selectedDate)

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const handlePrev = (e) => {
    e.stopPropagation()
    setViewDate(new Date(year, month - 1, 1))
  }
  const handleNext = (e) => {
    e.stopPropagation()
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day) => {
    onSelectDate(new Date(year, month, day))
    setOpen(false)
  }

  const showBackToday = !isToday(selectedDate)

  return (
    <div className="relative z-50 flex items-center gap-3 flex-shrink-0">
      <button
        ref={widgetRef}
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors duration-200 group cursor-pointer border ${
          showBackToday ? 'bg-primary-container text-on-primary-container border-primary-container' : 'border-transparent'
        }`}
      >
        <Icon name="calendar_today" className="text-primary group-hover:scale-110 transition-transform duration-200" />
        <span className="font-display text-sm font-bold capitalize">{headerLabel}</span>
        <Icon name="expand_more" size={16} className="opacity-60" />
      </button>

      {showBackToday && (
        <button
          onClick={() => onSelectDate(new Date())}
          className="px-3 py-1.5 bg-primary text-on-primary font-bold text-xs rounded-full hover:bg-secondary transition-colors shadow-sm cursor-pointer"
        >
          Voltar para Hoje
        </button>
      )}

      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 bg-surface border border-outline-variant rounded-xl shadow-xl p-4 w-64 z-[150] animate-in fade-in"
        >
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrev} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors">
              <Icon name="chevron_left" size={20} />
            </button>
            <h4 className="font-display text-sm font-bold text-on-background capitalize">{monthLabel}</h4>
            <button onClick={handleNext} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors">
              <Icon name="chevron_right" size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map((d, i) => (
              <div key={`dow-${i}`} className="text-center text-xs font-bold text-on-surface-variant mb-2">{d}</div>
            ))}
            {days.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />
              const dateObj = new Date(year, month, day)
              const selected = isSameDay(dateObj, selectedDate)
              const today = isToday(dateObj)

              let cls = 'hover:bg-surface-container-high text-on-surface'
              if (selected) cls = 'bg-primary text-on-primary font-bold shadow-sm'
              else if (today) cls = 'border border-primary text-primary font-bold'

              return (
                <div
                  key={`day-${day}`}
                  className={`text-center py-1 text-sm rounded-full cursor-pointer transition-colors ${cls}`}
                  onClick={(e) => { e.stopPropagation(); handleSelectDay(day) }}
                >
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
