import { useEffect, useRef, useState, useCallback } from 'react'
import { getInspirations, getCategories, createRecipe } from '../lib/api'
import styles from './InspirationPage.module.css'

const FOOD_TYPES = ['All', 'Meat', 'Fish', 'Vegetarian', 'Vegan']
const APP_CATEGORIES = ['All', 'Starters', 'Main Dishes', 'Desserts', 'Drinks']

function NutritionBar({ value, label }) {
  const color = value >= 8 ? '#2d6a4f' : value >= 5 ? '#c17f3a' : '#c0392b'
  return (
    <div className={styles.nutrient}>
      <div className={styles.nutrientBar}>
        <div className={styles.nutrientFill} style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span className={styles.nutrientLabel}>{label} {value}/10</span>
    </div>
  )
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}

export default function InspirationPage() {
  const [stack, setStack] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [noMore, setNoMore] = useState(false)
  const [error, setError] = useState(null)

  const [foodTypeFilter, setFoodTypeFilter] = useState('All')
  const [catFilter, setCatFilter] = useState('All')

  const [dragX, setDragX] = useState(0)
  const [swipeAnim, setSwipeAnim] = useState(null) // 'left' | 'right'
  const [swipingId, setSwipingId] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [pendingRecipe, setPendingRecipe] = useState(null)
  const [dbCategories, setDbCategories] = useState([])
  const [selectedCatId, setSelectedCatId] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const [seenUrls, setSeenUrls] = useState([])

  const isDragging = useRef(false)
  const startX = useRef(0)
  const cardRef = useRef(null)

  // ── Derived filtered stack ───────────────────────────────
  const filteredStack = stack.filter(r => {
    if (foodTypeFilter !== 'All' && r.food_type !== foodTypeFilter) return false
    if (catFilter !== 'All' && r.recipe_category !== catFilter) return false
    return true
  })
  const currentRecipe = filteredStack[currentIdx] || null

  // ── Load initial batch ───────────────────────────────────
  useEffect(() => {
    loadBatch([], true)
    getCategories().then(cats => {
      setDbCategories(cats)
      if (cats.length) setSelectedCatId(cats[0].id)
    }).catch(() => {})
  }, []) // runs once on mount

  const loadBatch = useCallback(async (exclude, isInitial) => {
    if (isInitial) { setLoading(true); setError(null) }
    else setLoadingMore(true)

    try {
      const data = await getInspirations({ excludeUrls: exclude, count: 5 })
      if (data.recipes.length === 0) {
        if (isInitial) setError(data.message || 'No inspirations found. Add some recipes first so we know which sites you like.')
        else setNoMore(true)
      } else {
        const newUrls = data.recipes.map(r => r.source_url)
        setStack(prev => isInitial ? data.recipes : [...prev, ...data.recipes])
        setSeenUrls(prev => [...prev, ...newUrls])
      }
    } catch {
      if (isInitial) setError('Could not load inspirations. Please try again.')
    } finally {
      if (isInitial) setLoading(false)
      else setLoadingMore(false)
    }
  }, [])

  // Load more when 2 cards remaining in filtered view
  useEffect(() => {
    const remaining = filteredStack.length - currentIdx
    if (!loading && !loadingMore && !noMore && remaining <= 2 && stack.length > 0) {
      loadBatch(seenUrls, false)
    }
  }, [currentIdx, filteredStack.length, loading, loadingMore, noMore, seenUrls, stack.length, loadBatch])

  // Reset index when filters change
  useEffect(() => { setCurrentIdx(0) }, [foodTypeFilter, catFilter])

  // ── Swipe logic ──────────────────────────────────────────
  function commitSwipe(direction) {
    if (!currentRecipe) return
    setSwipeAnim(direction)
    setSwipingId(currentRecipe.source_url)
    setDragX(0)

    setTimeout(() => {
      setSwipeAnim(null)
      setSwipingId(null)
      if (direction === 'right') {
        setPendingRecipe(currentRecipe)
        setShowModal(true)
      }
      setCurrentIdx(i => i + 1)
    }, 380)
  }

  function handlePointerDown(e) {
    if (swipeAnim || !currentRecipe) return
    startX.current = e.clientX
    isDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!isDragging.current) return
    const dx = e.clientX - startX.current
    setDragX(dx)
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.04}deg)`
    }
  }

  function handlePointerUp() {
    if (!isDragging.current) return
    isDragging.current = false
    if (Math.abs(dragX) > 100) {
      commitSwipe(dragX > 0 ? 'right' : 'left')
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)'
        cardRef.current.style.transform = ''
        setTimeout(() => { if (cardRef.current) cardRef.current.style.transition = '' }, 420)
      }
      setDragX(0)
    }
  }

  // ── Save recipe ──────────────────────────────────────────
  async function handleSave() {
    if (!pendingRecipe || !selectedCatId) return
    setSaving(true)
    try {
      await createRecipe({
        name: pendingRecipe.name,
        category_id: selectedCatId,
        image_url: pendingRecipe.image_url || null,
        source_url: pendingRecipe.source_url,
        servings: pendingRecipe.servings || 4,
        ingredients: pendingRecipe.ingredients || [],
        steps: pendingRecipe.steps || [],
        score_vitamins: pendingRecipe.score_vitamins || 5,
        score_proteins: pendingRecipe.score_proteins || 5,
        score_carbs: pendingRecipe.score_carbs || 5,
      })
      setSavedCount(c => c + 1)
      setShowModal(false)
      setPendingRecipe(null)
    } catch {
      alert('Could not save the recipe. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render states ────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingTitle}>Finding Inspirations…</p>
        <p className={styles.loadingNote}>Browsing your favourite recipe sites</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorWrap}>
        <span className={styles.errorIcon}>✦</span>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={() => loadBatch([], true)}>Try Again</button>
      </div>
    )
  }

  const visibleCards = filteredStack.slice(currentIdx, currentIdx + 3)
  const exhausted = currentIdx >= filteredStack.length

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Inspirations</h1>
        {savedCount > 0 && (
          <span className={styles.savedBadge}>{savedCount} added ✓</span>
        )}
      </div>

      {/* ── Filters ── */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          {APP_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${catFilter === cat ? styles.filterBtnActive : ''}`}
              onClick={() => setCatFilter(cat)}
            >{cat}</button>
          ))}
        </div>
        <div className={styles.filterRow}>
          {FOOD_TYPES.map(ft => (
            <button
              key={ft}
              className={`${styles.filterBtn} ${foodTypeFilter === ft ? styles.filterBtnActive : ''}`}
              onClick={() => setFoodTypeFilter(ft)}
            >{ft}</button>
          ))}
        </div>
      </div>

      {/* ── Card stack ── */}
      {exhausted ? (
        <div className={styles.exhausted}>
          <p className={styles.exhaustedText}>
            {noMore ? 'No more inspirations right now.' : 'No recipes match this filter.'}
          </p>
          {noMore
            ? <button className={styles.retryBtn} onClick={() => { setStack([]); setSeenUrls([]); setCurrentIdx(0); setNoMore(false); loadBatch([], true) }}>Refresh</button>
            : <button className={styles.retryBtn} onClick={() => { setFoodTypeFilter('All'); setCatFilter('All') }}>Clear Filters</button>
          }
          {loadingMore && <p className={styles.loadingMoreText}>Loading more…</p>}
        </div>
      ) : (
        <>
          <div className={styles.cardStack}>
            {[...visibleCards].reverse().map((recipe, ri) => {
              const layerFromTop = visibleCards.length - 1 - ri
              const isTop = layerFromTop === 0
              const scale = 1 - layerFromTop * 0.04
              const yOffset = layerFromTop * -10

              return (
                <div
                  key={recipe.source_url}
                  ref={isTop ? cardRef : null}
                  className={`${styles.card} ${isTop && swipeAnim && swipingId === recipe.source_url ? styles[`swipe_${swipeAnim}`] : ''}`}
                  style={{
                    zIndex: 10 - layerFromTop,
                    transform: !isTop ? `scale(${scale}) translateY(${yOffset}px)` : undefined,
                    pointerEvents: isTop ? 'auto' : 'none',
                  }}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerUp : undefined}
                  onPointerCancel={isTop ? handlePointerUp : undefined}
                >
                  {isTop && dragX > 60 && (
                    <div className={`${styles.indicator} ${styles.indicatorAdd}`}>ADD ♥</div>
                  )}
                  {isTop && dragX < -60 && (
                    <div className={`${styles.indicator} ${styles.indicatorSkip}`}>SKIP ✕</div>
                  )}

                  <div className={styles.cardImage}>
                    {recipe.image_url
                      ? <img src={recipe.image_url} alt={recipe.name} draggable={false} />
                      : <div className={styles.imagePlaceholder}>✦</div>
                    }
                    <div className={styles.cardBadges}>
                      <span className={styles.catBadge}>{recipe.recipe_category}</span>
                      <span className={`${styles.foodBadge} ${styles[`food${recipe.food_type}`]}`}>
                        {recipe.food_type}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.sourceDomain}>{getDomain(recipe.source_url)}</p>
                    <h2 className={styles.recipeName}>{recipe.name}</h2>
                    <div className={styles.nutrients}>
                      <NutritionBar value={recipe.score_vitamins || 0} label="Vit" />
                      <NutritionBar value={recipe.score_proteins || 0} label="Pro" />
                      <NutritionBar value={recipe.score_carbs || 0} label="Carb" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Action buttons ── */}
          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${styles.skipActionBtn}`}
              onClick={() => commitSwipe('left')}
              aria-label="Skip recipe"
            >✕</button>
            <div className={styles.cardCounter}>
              {currentIdx + 1} / {filteredStack.length}{loadingMore ? '+' : ''}
            </div>
            <button
              className={`${styles.actionBtn} ${styles.addActionBtn}`}
              onClick={() => commitSwipe('right')}
              aria-label="Add recipe"
            >♥</button>
          </div>
        </>
      )}

      {/* ── Add to collection modal ── */}
      {showModal && pendingRecipe && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalImage}>
              {pendingRecipe.image_url
                ? <img src={pendingRecipe.image_url} alt={pendingRecipe.name} />
                : <div className={styles.modalImagePlaceholder}>✦</div>
              }
            </div>
            <div className={styles.modalBody}>
              <h3 className={styles.modalTitle}>{pendingRecipe.name}</h3>
              <p className={styles.modalLabel}>Add to which category?</p>
              <div className={styles.modalCats}>
                {dbCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`${styles.modalCatBtn} ${selectedCatId === cat.id ? styles.modalCatBtnActive : ''}`}
                    onClick={() => setSelectedCatId(cat.id)}
                  >{cat.name}</button>
                ))}
              </div>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={!selectedCatId || saving}
              >
                {saving ? 'Saving…' : 'Save to Collection'}
              </button>
              <button
                className={styles.skipModalBtn}
                onClick={() => { setShowModal(false); setPendingRecipe(null) }}
              >Skip for now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
