import { useState } from 'react'
import { useDismissableSheet, useFolders } from '../lib/hooks'
import { createFolder, updateFolder, deleteFolder, toggleInFolder } from '../lib/storage'
import { fileToCompressedDataURL } from '../lib/image'
import { IconImage, IconFolderPlus, IconTrash } from './icons'
import FolderCover from './FolderCover'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

// One sheet, three jobs, because they run into each other: picking the folders
// a drink belongs to, making a new folder, and editing an existing one. Asking
// for a new folder from the picker keeps you in the same sheet and drops the
// drink into the folder the moment it exists.
//
//   mode 'pick'   + cocktailId — tick the folders this drink belongs to
//   mode 'create'              — just make a folder
//   mode 'edit'   + folder     — rename it, re-cover it, delete it
export default function FolderSheet({ mode = 'pick', cocktailId, folder, onClose, onDeleted }) {
  const { folders, loading } = useFolders()
  const { t } = useI18n()
  const showToast = useToast()
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)

  const [view, setView] = useState(mode === 'pick' ? 'pick' : 'form')
  const [name, setName] = useState(folder?.name || '')
  const [image, setImage] = useState(folder?.image || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const empty = folders.length === 0

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setImage(await fileToCompressedDataURL(file, { maxSize: 700 }))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggle = async (id) => {
    const added = await toggleInFolder(id, cocktailId)
    const f = folders.find((x) => x.id === id)
    showToast(t(added ? 'Added to {folder}' : 'Removed from {folder}', { folder: f?.name || '' }))
  }

  const handleSubmit = async () => {
    if (!name.trim()) return setError(t('Give your folder a name.'))
    setBusy(true)
    try {
      if (mode === 'edit') {
        await updateFolder(folder.id, { name: name.trim(), image })
        showToast(t('Folder updated'))
        onClose()
      } else {
        // A folder made from a drink's page starts with that drink in it.
        const made = await createFolder({ name, image, ids: cocktailId ? [cocktailId] : [] })
        showToast(
          cocktailId
            ? t('Added to {folder}', { folder: made.name })
            : t('Folder created'),
        )
        if (mode === 'pick') {
          setName('')
          setImage('')
          setView('pick')
          setBusy(false)
        } else {
          onClose()
        }
      }
    } catch {
      setError(t('Something went wrong while saving.'))
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(t('Delete “{name}”? The cocktails in it stay in your library.', { name: folder.name })))
      return
    await deleteFolder(folder.id)
    showToast(t('Folder deleted'))
    // The page behind this sheet may be the folder itself, so let it leave.
    if (onDeleted) onDeleted()
    else onClose()
  }

  const title =
    view === 'form'
      ? mode === 'edit'
        ? t('Edit folder')
        : t('New folder')
      : t('Save to folder')

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
      <div
        className="sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={sheetStyle}
      >
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{title}</h2>
            <button
              className="sheet-close"
              onClick={view === 'form' && mode === 'pick' ? () => setView('pick') : onClose}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {view === 'form' && mode === 'pick' ? t('Back') : t('Done')}
            </button>
          </div>
        </div>

        {view === 'pick' ? (
          <div className="sheet-body">
            {loading ? (
              <div style={{ minHeight: 120 }} />
            ) : empty ? (
              <div className="empty" style={{ padding: '18px 0 8px' }}>
                <div className="icon">📁</div>
                <h3>{t('No folders yet')}</h3>
                <p>{t('Folders let you group the drinks you save. Make your first one and this cocktail goes straight in.')}</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => setView('form')}
                >
                  <IconFolderPlus /> {t('New folder')}
                </button>
              </div>
            ) : (
              <>
                <div className="folder-picks">
                  {folders.map((f) => {
                    const on = f.ids?.includes(cocktailId)
                    return (
                      <button
                        key={f.id}
                        className={'folder-pick' + (on ? ' on' : '')}
                        onClick={() => handleToggle(f.id)}
                        aria-pressed={on}
                      >
                        <FolderCover folder={f} className="sm" />
                        <span className="folder-pick-text">
                          <span className="folder-pick-name">{f.name}</span>
                          <span className="folder-pick-count">
                            {t(f.ids?.length === 1 ? '{n} cocktail' : '{n} cocktails', {
                              n: f.ids?.length || 0,
                            })}
                          </span>
                        </span>
                        <span className="tick">{on ? '✓' : '+'}</span>
                      </button>
                    )
                  })}
                </div>
                <button className="add-row" onClick={() => setView('form')}>
                  + {t('New folder')}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="sheet-body">
            <div className="field">
              <label htmlFor="folder-name">{t('Name')}</label>
              <input
                id="folder-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('e.g. Summer evenings')}
                autoComplete="off"
              />
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label>
                {t('Cover')} <span className="hint">{t('(optional)')}</span>
              </label>
              <label className="image-upload" style={{ aspectRatio: '16 / 9' }}>
                {image ? (
                  <>
                    <img src={image} alt="" />
                    <span className="replace">{t('Replace')}</span>
                  </>
                ) : (
                  <span className="up-inner">
                    <IconImage />
                    <span style={{ display: 'block', marginTop: 8, fontSize: 13 }}>
                      {t('Without a cover we’ll build one from the drinks inside.')}
                    </span>
                  </span>
                )}
                <input type="file" accept="image/*" onChange={handleImage} />
              </label>
              {image && (
                <button className="link-btn" onClick={() => setImage('')}>
                  {t('Use a collage instead')}
                </button>
              )}
            </div>

            {mode === 'edit' && (
              <button className="btn btn-danger btn-block" style={{ marginTop: 22 }} onClick={handleDelete}>
                <IconTrash /> {t('Delete folder')}
              </button>
            )}

            {error && <div className="field-error">{error}</div>}
          </div>
        )}

        <div className="sheet-footer">
          {view === 'form' ? (
            <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={busy}>
              {mode === 'edit' ? t('Save changes') : t('Create folder')}
            </button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={onClose}>
              {t('Done')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
