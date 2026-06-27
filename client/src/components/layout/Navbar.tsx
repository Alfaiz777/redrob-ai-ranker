import logo from '../../assets/logo.png'

interface NavbarProps {
  currentPage?: string
  onNavigate?: (page: string) => void
}

const NAV_LINKS = [
  { label: 'New Ranking', page: 'jd-upload' },
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Candidates', page: 'rankings' },
  { label: 'Analytics', page: 'analytics' },
]

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-outline-variant shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => onNavigate?.('jd-upload')}>
          <img src={logo} alt="Redrob AI" className="w-8 h-8 object-contain" />
          <span className="font-display font-semibold text-[15px] text-on-surface tracking-tight">
            EvidentHire <span className="text-primary">AI</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => onNavigate?.(page)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                currentPage === page
                  ? 'bg-primary-container text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />
      </div>
    </nav>
  )
}
