import { useLayoutStore } from '../../stores/useLayoutStore'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children, selectedDate, onSelectDate }) {
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth)

  return (
    <div className="flex h-screen overflow-hidden relative transition-colors duration-300">
      <Sidebar />

      <main
        className="flex-1 flex flex-col h-full bg-background relative transition-all duration-75 md:ml-0"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {/* On mobile, no margin since sidebar is overlay */}
        <style>{`
          @media (max-width: 767px) {
            main { margin-left: 0 !important; }
          }
        `}</style>

        <Header selectedDate={selectedDate} onSelectDate={onSelectDate} />

        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 pb-12">
          {children}
        </div>
      </main>
    </div>
  )
}
