// recipe-app/src/pages/CalendarPage.js
import { useState, useEffect, useCallback } from 'react'
import { useCalendar } from '../lib/CalendarContext'
import { useCart } from '../lib/CartContext'
import { updateCalendarSettings, reshuffleCalendar, setCalendarOverride, getCalendarWeek } from '../lib/api'
import styles from './CalendarPage.module.css'

const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu',
  friday:'Fri', saturday:'Sat', sunday:'Sun'
}
const DAY_FULL = {
  monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday',
  friday:'Friday', saturday:'Saturday', sunday:'Sunday'
}

function getMondayStr(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatWeekOf(mondayStr) {
  const d = new Date(mondayStr + 'T00:00:00')
  return d.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })
}

function CartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export default function CalendarPage() {
  const { calendarData } = useCalendar()
  const { addToCart } = useCart()
  const [weekData, setWeekData] = useState(null)
  const [viewingDate, setViewingDate] = useState(() => getMondayStr(new Date()))
  const [weekLoading, setWeekLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [overridePicker, setOverridePicker] = useState(null) // { date, dayName }

  const fetchWeek = useCallback(async (date) => {
    setWeekLoading(true)
    try {
      const data = await getCalendarWeek(date)
      setWeekData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setWeekLoading(false)
    }
  }, [])

  // Refetch week when viewingDate changes or when calendarData changes (reshuffle/override)
  useEffect(() => {
    if (calendarData) fetchWeek(viewingDate)
  }, [viewingDate, calendarData, fetchWeek])

  async function handleDayToggle(day) {
    if (!calendarData || actionLoading) return
    const current = calendarData.active_days || []
    const newDays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day]
    setActionLoading(true)
    try {
      await updateCalendarSettings({ active_days: newDays })
      // CalendarContext Realtime will update calendarData, which triggers fetchWeek
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReshuffle() {
    if (actionLoading) return
    setActionLoading(true)
    try {
      await reshuffleCalendar()
      // CalendarContext Realtime will update calendarData, which triggers fetchWeek
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleOverridePick(recipe) {
    if (!overridePicker || actionLoading) return
    setActionLoading(true)
    try {
      await setCalendarOverride(overridePicker.date, recipe.id)
      setOverridePicker(null)
      await fetchWeek(viewingDate)
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAddWeekToCart(mondayStr) {
    setWeekLoading(true)
    try {
      const data = mondayStr === viewingDate ? weekData : await getCalendarWeek(mondayStr)
      ;(data?.days || []).forEach(day => {
        if (day.recipe) addToCart(day.recipe, day.recipe.servings || 4)
      })
    } catch (err) {
      console.error(err)
    } finally {
      setWeekLoading(false)
    }
  }

  if (!calendarData) return <div className={styles.loading}>Loading calendar...</div>

  const activeDays = calendarData.active_days || []
  const highlightedRecipes = calendarData.highlighted_recipes || []
  const hasActiveDays = activeDays.length > 0
  const hasPool = highlightedRecipes.length > 0
  const days = weekData?.days || []

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Cooking Calendar</h1>

      {/* Cooking day toggles */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>Cooking Days</p>
        <div className={styles.dayPills}>
          {ALL_DAYS.map(day => (
            <button
              key={day}
              className={`${styles.dayPill} ${activeDays.includes(day) ? styles.dayPillActive : ''}`}
              onClick={() => handleDayToggle(day)}
              disabled={actionLoading}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </section>

      {!hasActiveDays && (
        <p className={styles.emptyMsg}>Tap a day above to pick your cooking days</p>
      )}

      {hasActiveDays && !hasPool && (
        <p className={styles.emptyMsg}>
          Highlight recipes first — tap the calendar icon on any recipe card
        </p>
      )}

      {hasActiveDays && hasPool && (
        <>
          {/* Week navigation */}
          <section className={styles.section}>
            <div className={styles.weekNav}>
              <button
                className={styles.weekNavBtn}
                onClick={() => setViewingDate(d => addDays(d, -7))}
              >◀</button>
              <span className={styles.weekLabel}>Week of {formatWeekOf(viewingDate)}</span>
              <button
                className={styles.weekNavBtn}
                onClick={() => setViewingDate(d => addDays(d, 7))}
              >▶</button>
            </div>
          </section>

          {/* Day rows */}
          <section className={styles.section}>
            {weekLoading ? (
              <p className={styles.emptyMsg}>Loading week...</p>
            ) : days.length === 0 ? (
              <p className={styles.emptyMsg}>No cooking days this week</p>
            ) : (
              <div className={styles.dayList}>
                {days.map(day => (
                  <div key={day.date} className={styles.dayRow}>
                    <div className={styles.dayThumb}>
                      {day.recipe?.image_url
                        ? <img src={day.recipe.image_url} alt={day.recipe.name} className={styles.thumbImg} />
                        : <div className={styles.thumbPlaceholder}>✦</div>
                      }
                    </div>
                    <div className={styles.dayInfo}>
                      <span className={styles.dayName}>{DAY_FULL[day.dayName]}</span>
                      <span className={styles.recipeName}>{day.recipe?.name || '—'}</span>
                      {day.isOverride && <span className={styles.overrideBadge}>custom pick</span>}
                    </div>
                    <button
                      className={styles.iconBtn}
                      onClick={() => day.recipe && addToCart(day.recipe, day.recipe.servings || 4)}
                      aria-label="Add to cart"
                      disabled={!day.recipe}
                      title="Add to cart"
                    >
                      <CartIcon />
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={() => setOverridePicker({ date: day.date, dayName: day.dayName })}
                      aria-label="Change recipe"
                      disabled={actionLoading}
                      title="Change recipe"
                    >
                      ↺
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action buttons */}
          <section className={styles.section}>
            <button
              className={styles.reshuffleBtn}
              onClick={handleReshuffle}
              disabled={actionLoading}
            >
              🔀 Reshuffle
            </button>
            <div className={styles.cartBtns}>
              <button
                className={styles.cartWeekBtn}
                onClick={() => handleAddWeekToCart(viewingDate)}
                disabled={weekLoading || days.length === 0}
              >
                Add this week to cart
              </button>
              <button
                className={styles.cartWeekBtn}
                onClick={() => handleAddWeekToCart(addDays(viewingDate, 7))}
                disabled={weekLoading}
              >
                Add next week to cart
              </button>
            </div>
          </section>
        </>
      )}

      {/* Override picker — bottom sheet modal */}
      {overridePicker && (
        <div className={styles.modalOverlay} onClick={() => setOverridePicker(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              Pick for {DAY_FULL[overridePicker.dayName]}
            </h2>
            <div className={styles.pickerList}>
              {highlightedRecipes.map(recipe => (
                <button
                  key={recipe.id}
                  className={styles.pickerRow}
                  onClick={() => handleOverridePick(recipe)}
                  disabled={actionLoading}
                >
                  <div className={styles.dayThumb}>
                    {recipe.image_url
                      ? <img src={recipe.image_url} alt={recipe.name} className={styles.thumbImg} />
                      : <div className={styles.thumbPlaceholder}>✦</div>
                    }
                  </div>
                  <span className={styles.pickerName}>{recipe.name}</span>
                </button>
              ))}
            </div>
            <button className={styles.modalClose} onClick={() => setOverridePicker(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
