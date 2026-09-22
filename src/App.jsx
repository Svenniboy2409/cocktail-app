import { useState, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Discover from './pages/Discover'
import Library from './pages/Library'
import CocktailDetail from './pages/CocktailDetail'
import FolderDetail from './pages/FolderDetail'
import CreateRecipe from './pages/CreateRecipe'
import BottomNav from './components/BottomNav'
import ScrollManager from './components/ScrollManager'
import { ToastProvider } from './components/Toast'

export default function App() {
  const location = useLocation()
  const [sheet, setSheet] = useState(null) // null | { editing?: recipe }

  const openCreate = useCallback(() => setSheet({}), [])
  const openEdit = useCallback((recipe) => setSheet({ editing: recipe }), [])
  const closeSheet = useCallback(() => setSheet(null), [])

  const isDetail = location.pathname.startsWith('/cocktail/')

  return (
    <ToastProvider>
      <div className="app">
        <ScrollManager />
        {/* The only thing that scrolls. See lib/scroller.js for why. */}
        <div className="app-scroll" id="app-scroll">
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/library" element={<Library onCreate={openCreate} />} />
            <Route path="/cocktail/:id" element={<CocktailDetail onEdit={openEdit} />} />
            <Route path="/folder/:id" element={<FolderDetail />} />
            <Route path="*" element={<Discover />} />
          </Routes>
        </div>

        {!isDetail && <BottomNav onCreate={openCreate} />}

        {sheet && <CreateRecipe editing={sheet.editing} onClose={closeSheet} />}
      </div>
    </ToastProvider>
  )
}
