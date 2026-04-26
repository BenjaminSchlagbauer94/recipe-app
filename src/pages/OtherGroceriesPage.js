import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { getGrocerySuggestions } from '../lib/api'
import styles from './OtherGroceriesPage.module.css'

export default function OtherGroceriesPage() {
  const navigate = useNavigate()
  const { otherGroceries, addOtherGrocery, removeOtherGrocery } = useCart()
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    getGrocerySuggestions()
      .then(data => setSuggestions(data.map(s => s.name)))
      .catch(() => {})
  }, [])

  const handleAdd = () => {
    if (!input.trim()) return
    addOtherGrocery(input.trim())
    setInput('')
  }

  const handleSuggestion = (name) => {
    addOtherGrocery(name)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/cart')}>← Back to Cart</button>
        <h1 className={styles.title}>Other Groceries</h1>
        <p className={styles.subtitle}>Add household items, personal care, or anything else</p>
      </div>

      {/* Input */}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Toilet paper, Shower gel…"
          autoFocus
        />
        <button className={styles.addBtn} onClick={handleAdd}>Add</button>
      </div>

      {/* Quick-add suggestions */}
      {suggestions.length > 0 && (
        <div className={styles.suggestionsSection}>
          <p className={styles.suggestionsLabel}>Quick add</p>
          <div className={styles.suggestionsList}>
            {suggestions.map(name => {
              const added = otherGroceries.includes(name)
              return (
                <button
                  key={name}
                  className={`${styles.suggestionPill} ${added ? styles.pillAdded : ''}`}
                  onClick={() => added ? removeOtherGrocery(name) : handleSuggestion(name)}
                >
                  {added ? '✓ ' : '+ '}{name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Added items */}
      {otherGroceries.length > 0 && (
        <div className={styles.addedSection}>
          <p className={styles.addedLabel}>Added ({otherGroceries.length})</p>
          <ul className={styles.addedList}>
            {otherGroceries.map(item => (
              <li key={item} className={styles.addedItem}>
                <span>{item}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeOtherGrocery(item)}
                  aria-label={`Remove ${item}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <button className={styles.backFooterBtn} onClick={() => navigate('/cart')}>
          ← Back to Cart
        </button>
        <button className={styles.proceedBtn} onClick={() => navigate('/shopping-list')}>
          Proceed to Shopping List →
        </button>
      </div>
    </div>
  )
}
