import { useState, useRef, useEffect } from 'react'
import { TAGS } from '../data/cocktails'
import { fileToCompressedDataURL } from '../lib/image'
import { addRecipe, updateRecipe } from '../lib/storage'
import { useDismissableSheet } from '../lib/hooks'
import { IconImage } from '../components/icons'
import { useToast } from '../components/Toast'

const emptyForm = {
  name: '',
  image: '',
  category: '',
  tags: [],
  scenario: '',
  glass: '',
  garnish: '',
  ingredients: [{ name: '', amount: '' }],
  instructions: [''],
}

export default function CreateRecipe({ editing, onClose }) {
  const showToast = useToast()
  const fileRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(() => onClose(false))

  useEffect(() => {
    if (editing) {
      setForm({
        ...emptyForm,
        ...editing,
        tags: editing.tags || [],
        ingredients: editing.ingredients?.length ? editing.ingredients : [{ name: '', amount: '' }],
        instructions: editing.instructions?.length ? editing.instructions : [''],
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [editing])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const toggleTag = (t) =>
    set({ tags: form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t] })

  // ingredients
  const setIng = (i, key, val) =>
    set({ ingredients: form.ingredients.map((ing, idx) => (idx === i ? { ...ing, [key]: val } : ing)) })
  const addIng = () => set({ ingredients: [...form.ingredients, { name: '', amount: '' }] })
  const delIng = (i) =>
    set({ ingredients: form.ingredients.filter((_, idx) => idx !== i).length ? form.ingredients.filter((_, idx) => idx !== i) : [{ name: '', amount: '' }] })

  // steps
  const setStep = (i, val) => set({ instructions: form.instructions.map((s, idx) => (idx === i ? val : s)) })
  const addStep = () => set({ instructions: [...form.instructions, ''] })
  const delStep = (i) =>
    set({ instructions: form.instructions.filter((_, idx) => idx !== i).length ? form.instructions.filter((_, idx) => idx !== i) : [''] })

  const handleImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataURL(file)
      set({ image: dataUrl })
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSave = async () => {
    setError('')
    if (!form.name.trim()) return setError('Give your cocktail a name.')
    if (!form.image) return setError('Add a photo of your cocktail.')

    const cleaned = {
      name: form.name.trim(),
      image: form.image,
      category: form.category.trim() || 'My recipe',
      tags: form.tags,
      scenario: form.scenario.trim(),
      glass: form.glass.trim(),
      garnish: form.garnish.trim(),
      ingredients: form.ingredients.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), amount: i.amount.trim() })),
      instructions: form.instructions.map((s) => s.trim()).filter(Boolean),
    }

    if (cleaned.ingredients.length === 0) return setError('Add at least one ingredient.')
    if (cleaned.instructions.length === 0) return setError('Add at least one recipe step.')

    setBusy(true)
    try {
      if (editing) {
        await updateRecipe(editing.id, cleaned)
        showToast('Recipe updated')
      } else {
        await addRecipe(cleaned)
        showToast('Recipe added to your library')
      }
      onClose(true)
    } catch {
      setError('Something went wrong while saving.')
      setBusy(false)
    }
  }

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={() => onClose(false)} />
      <div className="sheet" ref={sheetRef} role="dialog" aria-modal="true" style={sheetStyle}>
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{editing ? 'Edit recipe' : 'New recipe'}</h2>
            <button
              className="sheet-close"
              onClick={() => onClose(false)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="sheet-body">
          {/* image */}
          <div className="field">
            <label>Photo</label>
            <div className="image-upload" onClick={() => fileRef.current?.click()}>
              {form.image ? (
                <>
                  <img src={form.image} alt="Preview" />
                  <span className="replace">Replace</span>
                </>
              ) : (
                <div className="up-inner">
                  <span className="ic"><IconImage /></span>
                  Tap to add a photo
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} />
            </div>
          </div>

          {/* name */}
          <div className="field">
            <label>Name</label>
            <input
              className="input"
              placeholder="e.g. Midnight Espresso"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>

          {/* category */}
          <div className="field">
            <label>Base spirit / category <span className="hint">(optional)</span></label>
            <input
              className="input"
              placeholder="e.g. Rum, Gin, Mocktail…"
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
            />
          </div>

          {/* tags */}
          <div className="field">
            <label>Tags</label>
            <div className="chips" style={{ margin: 0, padding: 0, flexWrap: 'wrap', overflow: 'visible' }}>
              {TAGS.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={'chip' + (form.tags.includes(t) ? ' active' : '')}
                  onClick={() => toggleTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* scenario */}
          <div className="field">
            <label>When to serve it <span className="hint">(the perfect scenario)</span></label>
            <textarea
              className="textarea"
              placeholder="Describe the moment this cocktail is made for…"
              value={form.scenario}
              onChange={(e) => set({ scenario: e.target.value })}
            />
          </div>

          {/* glass + garnish */}
          <div className="field">
            <label>Glass <span className="hint">(optional)</span></label>
            <input className="input" placeholder="e.g. Coupe" value={form.glass} onChange={(e) => set({ glass: e.target.value })} />
          </div>
          <div className="field">
            <label>Garnish <span className="hint">(optional)</span></label>
            <input className="input" placeholder="e.g. Orange peel" value={form.garnish} onChange={(e) => set({ garnish: e.target.value })} />
          </div>

          {/* ingredients */}
          <div className="field">
            <label>Ingredients</label>
            <div className="row-list">
              {form.ingredients.map((ing, i) => (
                <div className="dyn-row" key={i}>
                  <input
                    className="input"
                    placeholder="Ingredient"
                    value={ing.name}
                    onChange={(e) => setIng(i, 'name', e.target.value)}
                  />
                  <input
                    className="input amt"
                    placeholder="50 ml"
                    value={ing.amount}
                    onChange={(e) => setIng(i, 'amount', e.target.value)}
                  />
                  <button type="button" className="row-del" onClick={() => delIng(i)} aria-label="Remove">×</button>
                </div>
              ))}
            </div>
            <button type="button" className="add-row" onClick={addIng}>+ Add ingredient</button>
          </div>

          {/* steps */}
          <div className="field">
            <label>Recipe steps</label>
            <div className="row-list">
              {form.instructions.map((step, i) => (
                <div className="dyn-row" key={i}>
                  <span className="dyn-num">{i + 1}</span>
                  <input
                    className="input"
                    placeholder="Describe this step…"
                    value={step}
                    onChange={(e) => setStep(i, e.target.value)}
                  />
                  <button type="button" className="row-del" onClick={() => delStep(i)} aria-label="Remove">×</button>
                </div>
              ))}
            </div>
            <button type="button" className="add-row" onClick={addStep}>+ Add step</button>
          </div>

          {error && <div className="field-error">{error}</div>}
        </div>

        <div className="sheet-footer">
          <button className="btn btn-primary btn-block" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add to library'}
          </button>
        </div>
      </div>
    </>
  )
}
