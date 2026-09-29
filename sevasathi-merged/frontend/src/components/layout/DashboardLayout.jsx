import React, { useState } from 'react'
import DashSidebar from './DashSidebar.jsx'
import DashTopbar from './DashTopbar.jsx'
import '../../css/dashboard.css'

// Generalized version of the old single DashboardPage — takes the nav
// structure, page titles, and page components as props so every role
// dashboard (Beneficiary/Volunteer/NGO/Admin) can reuse the exact same
// sidebar/topbar/content shell instead of duplicating this shell 4 times.
export default function DashboardLayout({ navSections, pageTitles, pages, defaultPage }) {
  const [activePage, setActivePage] = useState(defaultPage)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const ActiveComponent = pages[activePage] || pages[defaultPage]

  return (
    <div className={`db-layout ${darkMode ? 'db-dark' : ''}`}>
      <DashSidebar
        navSections={navSections}
        active={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="db-main">
        <DashTopbar
          darkMode={darkMode}
          onDarkToggle={() => setDarkMode(!darkMode)}
          onMenuOpen={() => setSidebarOpen(true)}
          pageTitle={pageTitles[activePage]}
        />
        <main className="db-content">
          <ActiveComponent key={activePage} />
        </main>
      </div>
    </div>
  )
}
