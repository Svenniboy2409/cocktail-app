import { useRef } from 'react'
import { useDismissableSheet } from '../lib/hooks'
import { exportAll, importAll } from '../lib/storage'
import { LANGUAGES, setLang, useI18n } from '../lib/i18n'
import { IconDownload, IconUpload } from './icons'
import { useToast } from './Toast'

// Everything that is about the app rather than about a drink: which language
// the interface speaks, and getting your data in and out of this browser.
export default function SettingsSheet({ onClose }) {
  const { lang, t } = useI18n()
  const showToast = useToast()
  const fileRef = useRef(null)
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)

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
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
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
            <button className="sheet-close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
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
              {t('The app’s interface. Recipes stay in English.')}
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
          <button className="btn btn-primary btn-block" onClick={onClose}>
            {t('Done')}
          </button>
        </div>
      </div>
    </>
  )
}
