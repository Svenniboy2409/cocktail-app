import { useState, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Discover from './pages/Discover'
import Library from './pages/Library'
import CocktailDetail from './pages/CocktailDetail'
import CreateRecipe from './pages/CreateRecipe'
import BottomNav from './components/BottomNav'
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
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/library" element={<Library onCreate={openCreate} />} />
          <Route path="/cocktail/:id" element={<CocktailDetail onEdit={openEdit} />} />
          <Route path="*" element={<Discover />} />
        </Routes>

        {!isDetail && <BottomNav onCreate={openCreate} />}

        {sheet && <CreateRecipe editing={sheet.editing} onClose={closeSheet} />}
      </div>
    </ToastProvider>
  )
}
