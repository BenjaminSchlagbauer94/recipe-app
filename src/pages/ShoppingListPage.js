import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { generateShoppingList } from '../lib/api'
import styles from './ShoppingListPage.module.css'

function parseAmount(str) {
  if (!str) return { value: null, unit: '' }
  const match = str.match(/^([\d]+(?:[.,\/][\d]+)?)\s*(.*)$/)
  if (!match) return { value: null, unit: str }
  let value
  const raw = match[1]
  if (raw.includes('/')) {
    const parts = raw.split('/')
    value = parseFloat(parts[0]) / parseFloat(parts[1])
  } else {
    value = parseFloat(raw.replace(',', '.'))
  }
  return { value: isNaN(value) ? null : value, unit: match[2].trim() }
}

function formatAmount(value, unit) {
  const rounded = Math.round(value * 10) / 10
  const str = rounded % 1 === 0 ? String(rounded) : String(rounded)
  return unit ? `${str} ${unit}`.trim() : str
}

function getStep(value) {
  if (value < 5) return 0.5
  if (value < 50) return 1
  if (value < 200) return 10
  return 25
}

export default function ShoppingListPage() {
  const navigate = useNavigate()
  const { cartItems } = useCart()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart')
      return
    }
    load()
  }, []) // runs once on mount

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const items = cartItems.map(item => ({ recipeId: item.id, servings: item.servings }))
      const data = await generateShoppingList(items)
      const withIds = data.categories.map(cat => ({
        ...cat,
        items: cat.items.map((item, i) => ({
          ...item,
          uid: `${cat.name}-${i}-${Date.now()}`,
        })),
      }))
      setCategories(withIds)
    } catch (err) {
      setError('Could not generate the shopping list. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function removeItem(catName, uid) {
    setCategories(prev =>
      prev
        .map(cat => {
          if (cat.name !== catName) return cat
          return { ...cat, items: cat.items.filter(i => i.uid !== uid) }
        })
        .filter(cat => cat.items.length > 0)
    )
  }

  function adjustAmount(catName, uid, delta) {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.name !== catName) return cat
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.uid !== uid) return item
            const { value, unit } = parseAmount(item.amount)
            if (value === null) return item
            const step = getStep(value)
            const newValue = Math.max(0, Math.round((value + delta * step) * 10) / 10)
            if (newValue === 0) return null
            return { ...item, amount: formatAmount(newValue, unit) }
          }).filter(Boolean),
        }
      }).filter(cat => cat.items.length > 0)
    )
  }

  async function handleExport() {
    if (!listRef.current) return
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      await new Promise(r => setTimeout(r, 150))
      const canvas = await html2canvas(listRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const url = canvas.toDataURL('image/jpeg', 0.92)
      const link = document.createElement('a')
      link.download = 'shopping-list.jpg'
      link.href = url
      link.click()
    } catch (err) {
      alert('Could not export the image. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Preparing your shopping list…</p>
        <p className={styles.loadingNote}>Combining ingredients and sorting by store section</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorWrap}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={load}>Try Again</button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/cart')}>
          ← Back to Cart
        </button>
        <div>
          <h1 className={styles.title}>Shopping List</h1>
          <p className={styles.subtitle}>
            {cartItems.length} recipe{cartItems.length !== 1 ? 's' : ''} · {totalItems} items
          </p>
        </div>
      </div>

      <p className={styles.hint}>Remove products you already have at home</p>

      <div ref={listRef} className={`${styles.list} ${exporting ? styles.exporting : ''}`}>
        <div className={styles.exportHeader}>
          <span className={styles.exportLogo}>✦ Shopping List</span>
          <span className={styles.exportDate}>{new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>

        {categories.map(cat => (
          <div key={cat.name} className={styles.category}>
            <h2 className={styles.categoryName}>{cat.name}</h2>
            <ul className={styles.itemList}>
              {cat.items.map(item => (
                <li key={item.uid} className={styles.item}>
                  <span className={styles.itemAmount}>{item.amount}</span>
                  <span className={styles.itemName}>{item.name}</span>

                  <div className={styles.itemActions}>
                    <button
                      className={styles.amountBtn}
                      onClick={() => adjustAmount(cat.name, item.uid, -1)}
                      aria-label="Decrease amount"
                    >−</button>
                    <button
                      className={styles.amountBtn}
                      onClick={() => adjustAmount(cat.name, item.uid, 1)}
                      aria-label="Increase amount"
                    >+</button>
                    <button
                      className={styles.removeItemBtn}
                      onClick={() => removeItem(cat.name, item.uid)}
                      aria-label="Remove item"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.exportBtn}
          onClick={handleExport}
          disabled={exporting || totalItems === 0}
        >
          {exporting ? 'Saving…' : '↓ Save as Image'}
        </button>
      </div>
    </div>
  )
}
