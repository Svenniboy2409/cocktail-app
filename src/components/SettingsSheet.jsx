import { useRef, useState } from 'react'
import { useDismissableSheet, useFolderView, useSectionOrder } from '../lib/hooks'
import { exportAll, importAll, setFolderView, setSectionOrder } from '../lib/storage'
import { LANGUAGES, setLang, useI18n } from '../lib/i18n'
import { IconDownload, IconUpload, IconGridView, IconListView, IconDrag } from './icons'
import ReorderableGrid from './ReorderableGrid'
import { useToast } from './Toast'

const LABELS = { folders: 'Folders', recipes: 'My recipes', saved: 'Saved' }

// Everything that is about the app rather than about a drink: which language
// the interface speaks, how the library runs, and getting your data in and out
// of this browser.
export default function SettingsSheet({ onClose }) {
  const { lang, t } = useI18n()
  const folderView = useFolderView()
  const saved = useSectionOrder()
  const showToast = useToast()
  const fileRef = useRef(null)

  // The running order is held here while the sheet is open and only written
  // when it closes, so the library behind stays still until you are done — and
  // then slides into its new shape in one go.
  const [order, setOrder] = useState(saved)
  const finish = () => {
    if (order.join() !== saved.join()) setSectionOrder(order)
    onClose()
  }

  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(() => finish())

  const SECTION_NAMES = order.map((key) => ({ key, label: LABELS[key] }))

  const handleExport = async () => {
    const json = await exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mixly-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(t('Library exported'))
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const res = await importAll(await file.text())
      showToast(
        t(res.recipes === 1 ? 'Imported {n} recipe' : 'Imported {n} recipes', { n: res.recipes }),
      )
    } catch (err) {
      showToast(err.message || t('Import failed'))
    }
  }

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={finish} />
      <div
        className="sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Settings')}
        style={sheetStyle}
      >
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{t('Settings')}</h2>
            <button className="sheet-close" onClick={finish} onPointerDown={(e) => e.stopPropagation()}>
              {t('Done')}
            </button>
          </div>
        </div>

        <div className="sheet-body">
          <div className="field">
            <label>{t('Language')}</label>
            <div className="lang-options">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={'lang-option' + (lang === l.code ? ' on' : '')}
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                >
                  <span className="lang-flag">{l.flag}</span>
                  <span className="lang-name">{l.name}</span>
                  {lang === l.code && <span className="lang-tick">✓</span>}
                </button>
              ))}
            </div>
            <p className="muted" style={{ margin: '10px 2px 0', fontSize: 13 }}>
              {t('Interface and recipes. Drink names stay as they are.')}
            </p>
          </div>

          <div className="field">
            <label>{t('Library order')}</label>
            <ReorderableGrid
              items={SECTION_NAMES.map(({ key, label }) => ({ id: key, label: t(label) }))}
              className="order-rows"
              renderItem={(row) => (
                <div className="order-row">
                  <span className="order-row-name">{row.label}</span>
                  <IconDrag />
                </div>
              )}
              onReorder={setOrder}
            />
            <p className="muted" style={{ margin: '10px 2px 0', fontSize: 13 }}>
              {t('Drag to set which part of your library comes first.')}
            </p>
          </div>

          <div className="field">
            <label>{t('Folders')}</label>
            <div className="seg">
              {[
                { key: 'grid', label: 'Tiles', Icon: IconGridView },
                { key: 'list', label: 'List', Icon: IconListView },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={'seg-option' + (folderView === key ? ' on' : '')}
                  onClick={() => setFolderView(key)}
                  aria-pressed={folderView === key}
                >
                  <Icon width="18" height="18" />
                  {t(label)}
                </button>
              ))}
            </div>
            <p className="muted" style={{ margin: '10px 2px 0', fontSize: 13 }}>
              {t('How your folders look in the Library.')}
            </p>
          </div>

          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('Backup')}</label>
            <p className="muted" style={{ margin: '0 2px 12px', fontSize: 13 }}>
              {t(
                'Your data lives in this browser only. Export a file to back it up or move it to another device.',
              )}
            </p>
            <div className="detail-actions" style={{ margin: 0 }}>
              <button className="btn" style={{ flex: 1 }} onClick={handleExport}>
                <IconDownload /> {t('Export')}
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
                <IconUpload /> {t('Import')}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden-file"
                onChange={handleImportFile}
              />
            </div>
          </div>
        </div>

        <div className="sheet-footer">
          <button className="btn btn-primary btn-block" onClick={finish}>
            {t('Done')}
          </button>
        </div>
      </div>
    </>
  )
}
