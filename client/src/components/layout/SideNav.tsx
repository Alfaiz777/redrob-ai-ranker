import logo from '../../assets/logo.png'

interface SideNavProps {
  currentPage: string
  onNavigate: (page: string) => void
  onNewJD?: () => void
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'rankings',  label: 'Candidates', icon: 'group' },
  { id: 'analytics', label: 'Analytics',  icon: 'insights' },
]

export default function SideNav({ currentPage, onNavigate, onNewJD }: SideNavProps) {
  return (
    <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-surface-low border-r border-outline-variant h-full">
      {/* Brand section */}
      <div className="p-4 mb-2 border-b border-outline-variant">
        <div className="flex items-center gap-3 p-2">
          <img src={logo} alt="Redrob AI" className="w-8 h-8 object-contain flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-on-surface">EvidentHire <span className="text-primary">AI</span></p>
            <p className="text-[11px] text-outline">Enterprise Recruitment</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                active
                  ? 'bg-primary-container text-primary translate-x-0.5 shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-icons-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* New Requisition CTA */}
      <div className="px-3 mb-3">
        <button
          onClick={onNewJD}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-xl font-semibold text-sm shadow-md hover:bg-primary-dark active:scale-95 transition-all"
        >
          <span className="material-icons-outlined text-[18px]">add</span>
          New Requisition
        </button>
      </div>

    </aside>
  )
}
