import { useState, useEffect } from 'react'
import { getCategories } from '../lib/api'
import styles from './RecipeForm.module.css'

// For each ingredient that has an amount, inject that amount into steps where
// the ingredient name appears but is not yet preceded by its amount.
// Tries the full ingredient name first, then just the first word as fallback
// (e.g. "Frischkäse" from "Frischkäse natur"). Only injects into the first
// matching step to avoid repetition. Repairs steps corrupted by a previous bug.
function restoreAmountsInSteps(ingredients, steps) {
  let result = steps.slice()

  for (const ing of ingredients) {
    const { amount, rest } = parseIngredient(ing)
    if (!amount || !rest) continue
    const ingName = rest.replace(/^(?:of|von|aus|mit)\s+/i, '').trim()
    if (ingName.length < 2) continue
    const ingNameFirst = ingName.split(/\s+/)[0]

    const alreadyPresent = (name) => result.some(s => {
      const lower = s.toLowerCase()
      return lower.includes((amount + ' ' + name).toLowerCase()) ||
             lower.includes((amount + name).toLowerCase())
    })
    if (alreadyPresent(ingName) || (ingNameFirst !== ingName && alreadyPresent(ingNameFirst))) continue

    // Attempt to inject amount before `name` in the first step where it appears
    const tryInject = (name) => {
      const lowerName = name.toLowerCase()
      let injected = false
      const updated = result.map(step => {
        if (injected) return step
        const lowerStep = step.toLowerCase()
        const idx = lowerStep.indexOf(lowerName)
        if (idx === -1) return step
        const charBefore = idx > 0 ? step[idx - 1] : ' '
        const charAfter = step[idx + name.length] || ' '
        // Must be at a word boundary on both sides
        if (/[a-zA-ZäöüÄÖÜß]/.test(charBefore)) return step
        if (/[a-zA-ZäöüÄÖÜß]/.test(charAfter)) return step
        if (/\d/.test(charBefore)) return step  // already has a number before it
        injected = true
        return step.substring(0, idx) + amount + ' ' + step.substring(idx)
      })
      return injected ? updated : null
    }

    const withFull = tryInject(ingName)
    if (withFull) { result = withFull; continue }
    if (ingNameFirst !== ingName) {
      const withFirst = tryInject(ingNameFirst)
      if (withFirst) result = withFirst
    }
  }
  return result
}

function parseIngredient(str) {
  const UNITS =
    // German
    'EL|TL|MSP|Bund(?:e|es)?|Prise(?:n)?|Stück(?:e|es)?|Scheibe(?:n)?' +
    '|Zehe(?:n)?|Dose(?:n)?|Glas|Gläser|Flasche(?:n)?|Packung(?:en)?' +
    '|Becher|Zweig(?:e)?|Blatt|Blätter|Paar|Pkt' +
    // Metric / English
    '|g|kg|ml|l|cl|dl|tbsp?|tsp?|cups?|oz|lbs?|pieces?|pcs?|slices?' +
    '|bunch(?:es)?|pinch(?:es)?|handful|packs?|cans?|jars?|bottles?|bags?|cm|mm'

  // Number (e.g. 150, 0,5, 1/2) + optional space + known unit + space + rest
  const withUnit = str.match(new RegExp(`^(\\d[\\d.,/]*\\s*(?:${UNITS})\\.?)\\s+(.+)`, 'i'))
  if (withUnit) return { amount: withUnit[1].trim(), rest: withUnit[2] }

  // Plain number only: "2 eggs", "3 cloves garlic"
  const plain = str.match(/^(\d[\d.,/]*)\s+(.+)/)
  if (plain) return { amount: plain[1], rest: plain[2] }

  return { amount: '', rest: str }
}

export default function RecipeForm({ initial = {}, onSave, onCancel, mode = 'edit' }) {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: initial.name || '',
    category_id: initial.category_id || '',
    servings: initial.servings || 2,
    image_url: initial.image_url || '',
    ingredients: initial.ingredients || [],
    steps: restoreAmountsInSteps(initial.ingredients || [], initial.steps || []),
    score_vitamins: initial.score_vitamins || 5,
    score_proteins: initial.score_proteins || 5,
    score_carbs: initial.score_carbs || 5,
  })
  const [saving, setSaving] = useState(false)
  const [newIngredient, setNewIngredient] = useState('')
  // Separate draft state so the amount input can be cleared mid-edit without
  // immediately mangling the ingredient string or the steps.
  const [draftAmounts, setDraftAmounts] = useState(() =>
    (initial.ingredients || []).map(ing => parseIngredient(ing).amount)
  )

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const addIngredient = () => {
    if (!newIngredient.trim()) return
    const { amount } = parseIngredient(newIngredient.trim())
    set('ingredients', [...form.ingredients, newIngredient.trim()])
    setDraftAmounts(da => [...da, amount])
    setNewIngredient('')
  }

  const removeIngredient = (i) => {
    set('ingredients', form.ingredients.filter((_, idx) => idx !== i))
    setDraftAmounts(da => da.filter((_, idx) => idx !== i))
  }

  // While typing: only update the draft display, leave ingredient + steps alone.
  const handleAmountChange = (i, val) =>
    setDraftAmounts(da => da.map((a, idx) => idx === i ? val : a))

  // On blur: commit if non-empty (and sync steps), otherwise revert to stored value.
  const handleAmountBlur = (i) => {
    const newAmount = draftAmounts[i].trim()
    const { amount: oldAmount, rest } = parseIngredient(form.ingredients[i])
    if (!newAmount) {
      setDraftAmounts(da => da.map((a, idx) => idx === i ? oldAmount : a))
      return
    }
    if (newAmount === oldAmount) return
    const newIngredientStr = newAmount + (rest ? ' ' + rest : '')
    const newIngredients = form.ingredients.map((ing, idx) => idx === i ? newIngredientStr : ing)
    let newSteps = form.steps.map(step => step.split(oldAmount).join(newAmount))
    // Fallback: if the new amount still doesn't appear in any step (old amount was
    // already stripped), inject it before the ingredient name
    if (rest && !newSteps.some(s => s.includes(newAmount))) {
      newSteps = restoreAmountsInSteps([newIngredientStr], newSteps)
    }
    setForm(f => ({ ...f, ingredients: newIngredients, steps: newSteps }))
  }

  const updateStep = (i, val) =>
    set('steps', form.steps.map((s, idx) => idx === i ? val : s))

  const addStep = () => set('steps', [...form.steps, ''])
  const removeStep = (i) => set('steps', form.steps.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Please enter a recipe name')
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.form}>
      {/* Name */}
      <div className={styles.field}>
        <label className={styles.label}>Recipe name</label>
        <input
          className={styles.input}
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Spaghetti Carbonara"
        />
      </div>

      {/* Image */}
      {form.image_url && (
        <div className={styles.imagePreview}>
          <img src={form.image_url} alt="Recipe" />
          <button className={styles.removeImg} onClick={() => set('image_url', '')}>✕</button>
        </div>
      )}
      <div className={styles.field}>
        <label className={styles.label}>Image URL</label>
        <input
          className={styles.input}
          value={form.image_url}
          onChange={e => set('image_url', e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Category + Servings */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Category</label>
          <select
            className={styles.select}
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Servings</label>
          <div className={styles.servingsControl}>
            <button onClick={() => set('servings', Math.max(1, form.servings - 1))}>−</button>
            <span>{form.servings}</span>
            <button onClick={() => set('servings', form.servings + 1)}>+</button>
          </div>
        </div>
      </div>

      {/* Nutrition scores */}
      <div className={styles.field}>
        <label className={styles.label}>Nutrition scores</label>
        <div className={styles.scores}>
          {['score_vitamins', 'score_proteins', 'score_carbs'].map(key => (
            <div key={key} className={styles.scoreItem}>
              <span className={styles.scoreName}>
                {{ score_vitamins: 'Vitamins', score_proteins: 'Proteins', score_carbs: 'Carbs' }[key]}
              </span>
              <input
                type="range" min="1" max="10"
                value={form[key]}
                onChange={e => set(key, Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.scoreVal}>{form[key]}/10</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div className={styles.field}>
        <label className={styles.label}>Ingredients</label>
        <div className={styles.ingredientList}>
          {form.ingredients.map((ing, i) => {
            const { amount, rest } = parseIngredient(ing)
            return (
              <div key={i} className={styles.ingredientItem}>
                {amount ? (
                  <input
                    className={styles.amountInput}
                    value={draftAmounts[i] ?? amount}
                    onChange={e => handleAmountChange(i, e.target.value)}
                    onBlur={() => handleAmountBlur(i)}
                  />
                ) : null}
                <span className={styles.ingredientRest}>{rest}</span>
                <button onClick={() => removeIngredient(i)} className={styles.removeBtn}>✕</button>
              </div>
            )
          })}
        </div>
        <div className={styles.addRow}>
          <input
            className={styles.input}
            value={newIngredient}
            onChange={e => setNewIngredient(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIngredient()}
            placeholder="e.g. 200g pasta"
          />
          <button className={styles.addBtn} onClick={addIngredient}>Add</button>
        </div>
      </div>

      {/* Steps */}
      <div className={styles.field}>
        <label className={styles.label}>Steps</label>
        {form.steps.map((step, i) => (
          <div key={i} className={styles.stepItem}>
            <span className={styles.stepNum}>{i + 1}</span>
            <textarea
              className={styles.stepInput}
              value={step}
              onChange={e => updateStep(i, e.target.value)}
              rows={2}
              placeholder={`Step ${i + 1}…`}
            />
            <button onClick={() => removeStep(i)} className={styles.removeBtn}>✕</button>
          </div>
        ))}
        <button className={styles.addStepBtn} onClick={addStep}>+ Add step</button>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : mode === 'create' ? 'Save Recipe' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
