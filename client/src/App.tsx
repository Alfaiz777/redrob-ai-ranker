import { useState } from 'react'
import Navbar from './components/layout/Navbar'
import SideNav from './components/layout/SideNav'
import Dashboard from './pages/Dashboard'
import Rankings from './pages/Rankings'
import CandidateDetail from './pages/CandidateDetail'
import Analytics from './pages/Analytics'
import JDUpload from './pages/JDUpload'

type Page = 'dashboard' | 'rankings' | 'candidate-detail' | 'analytics' | 'jd-upload'

const PAGES_WITH_SIDEBAR: Page[] = ['dashboard', 'rankings', 'candidate-detail', 'analytics']

export default function App() {
  const [page, setPage] = useState<Page>('jd-upload')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())

  const hasSidebar = PAGES_WITH_SIDEBAR.includes(page)

  function viewCandidate(id: string) {
    setSelectedCandidateId(id)
    setPage('candidate-detail')
  }

  function backToRankings() {
    setPage('rankings')
    setSelectedCandidateId(null)
  }

  function toggleShortlist(id: string) {
    setShortlistedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="h-screen flex flex-col bg-surface font-body overflow-hidden">
      <Navbar
        currentPage={page}
        onNavigate={(p) => setPage(p as Page)}
      />

      <div className="flex flex-1 overflow-hidden">
        {hasSidebar && (
          <SideNav currentPage={page} onNavigate={(p) => setPage(p as Page)} onNewJD={() => setPage('jd-upload')} />
        )}

        <main className="flex-1 overflow-hidden">
          {page === 'dashboard' && (
            <div className="h-full overflow-y-auto">
              <Dashboard
                onViewCandidate={viewCandidate}
                onNavigateToRankings={() => setPage('rankings')}
              />
            </div>
          )}

          {page === 'rankings' && (
            <Rankings
              onViewCandidate={viewCandidate}
              shortlistedIds={shortlistedIds}
              onToggleShortlist={toggleShortlist}
            />
          )}

          {page === 'candidate-detail' && selectedCandidateId && (
            <CandidateDetail
              candidateId={selectedCandidateId}
              onBack={backToRankings}
              onAddToShortlist={toggleShortlist}
              isShortlisted={shortlistedIds.has(selectedCandidateId)}
            />
          )}

          {page === 'jd-upload' && (
            <div className="h-full overflow-y-auto">
              <JDUpload onRankingComplete={() => setPage('rankings')} />
            </div>
          )}

          {page === 'analytics' && <Analytics />}

        </main>
      </div>
    </div>
  )
}
