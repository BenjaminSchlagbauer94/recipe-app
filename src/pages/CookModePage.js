import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecipe } from '../lib/api'
import styles from './CookModePage.module.css'

export default function CookModePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)

  // Setup phase
  const [phase, setPhase] = useState('setup') // 'setup' | 'cooking' | 'done'
  const [servings, setServings] = useState(2)

  // Cooking phase
  const [currentStep, setCurrentStep] = useState(0)
  const [checkedIngredients, setCheckedIngredients] = useState([])
  const [timer, setTimer] = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    getRecipe(id)
      .then(r => { setRecipe(r); setServings(r.servings || 2) })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setTimerRunning(false)
            clearInterval(intervalRef.current)
            // Vibrate if supported
            if (navigator.vibrate) navigator.vibrate([300, 100, 300])
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerRunning])

  const startTimer = (mins) => {
    setTimerSeconds(mins * 60)
    setTimerRunning(true)
  }
  const toggleTimer = () => setTimerRunning(r => !r)
  const resetTimer = () => { setTimerRunning(false); setTimerSeconds(0); setTimer(null) }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const toggleIngredient = (i) =>
    setCheckedIngredients(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )

  const goNext = () => {
    resetTimer()
    if (currentStep < (recipe.steps || []).length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      setPhase('done')
    }
  }

  const goPrev = () => {
    resetTimer()
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  // Scale ingredient amounts based on servings ratio
  const scaleIngredient = (ing) => {
    if (!recipe?.servings || recipe.servings === servings) return ing
    const ratio = servings / recipe.servings
    return ing.replace(/(\d+(\.\d+)?)/g, (match) => {
      const scaled = parseFloat(match) * ratio
      return scaled % 1 === 0 ? scaled : scaled.toFixed(1)
    })
  }

  if (loading) return (
    <div className={styles.loadingScreen}>
      <span className={styles.spinner} />
    </div>
  )
  if (!recipe) return null

  const steps = recipe.steps || []
  const ingredients = recipe.ingredients || []
  const progress = steps.length ? ((currentStep + 1) / steps.length) * 100 : 0

  // ── SETUP PHASE ──────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className={styles.setupScreen}>
        <button className={styles.exitBtn} onClick={() => navigate(`/recipe/${id}`)}>✕</button>

        <div className={styles.setupContent}>
          <p className={styles.setupEyebrow}>Getting ready to cook</p>
          <h1 className={styles.setupTitle}>{recipe.name}</h1>

          <div className={styles.servingsBox}>
            <p className={styles.servingsLabel}>How many people are you cooking for?</p>
            <div className={styles.servingsPicker}>
              <button
                className={styles.servingsBtn}
                onClick={() => setServings(s => Math.max(1, s - 1))}
              >−</button>
              <div className={styles.servingsDisplay}>
                <span className={styles.servingsNum}>{servings}</span>
                <span className={styles.servingsUnit}>people</span>
              </div>
              <button
                className={styles.servingsBtn}
                onClick={() => setServings(s => s + 1)}
              >+</button>
            </div>
          </div>

          {ingredients.length > 0 && (
            <div className={styles.ingredientsCheck}>
              <p className={styles.ingredientsTitle}>Check your ingredients</p>
              <ul className={styles.ingredientsList}>
                {ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className={`${styles.ingredientItem} ${checkedIngredients.includes(i) ? styles.checked : ''}`}
                    onClick={() => toggleIngredient(i)}
                  >
                    <span className={styles.checkbox}>
                      {checkedIngredients.includes(i) ? '✓' : ''}
                    </span>
                    <span className={styles.ingredientText}>{scaleIngredient(ing)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className={styles.startBtn}
            onClick={() => { setCurrentStep(0); setPhase('cooking') }}
          >
            Start Cooking →
          </button>
        </div>
      </div>
    )
  }

  // ── DONE PHASE ───────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className={styles.doneScreen}>
        <div className={styles.doneContent}>
          <div className={styles.doneIcon}>✦</div>
          <h1 className={styles.doneTitle}>Enjoy your meal!</h1>
          <p className={styles.doneSub}>{recipe.name} · {servings} servings</p>
          <div className={styles.doneActions}>
            <button className={styles.doneBackBtn} onClick={() => navigate(`/recipe/${id}`)}>
              Back to recipe
            </button>
            <button className={styles.doneHomeBtn} onClick={() => navigate('/')}>
              Recipe collection
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── COOKING PHASE ─────────────────────────────────────────
  return (
    <div className={styles.cookScreen}>
      {/* Header */}
      <div className={styles.cookHeader}>
        <button className={styles.exitCookBtn} onClick={() => navigate(`/recipe/${id}`)}>✕</button>
        <div className={styles.recipeNameSmall}>{recipe.name}</div>
        <div className={styles.stepCounter}>{currentStep + 1} / {steps.length}</div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Step dots */}
      <div className={styles.stepDots}>
        {steps.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === currentStep ? styles.dotActive : ''} ${i < currentStep ? styles.dotDone : ''}`}
            onClick={() => { resetTimer(); setCurrentStep(i) }}
          />
        ))}
      </div>

      {/* Main step content */}
      <div className={styles.stepContent}>
        <div className={styles.stepNumber}>Step {currentStep + 1}</div>
        <p className={styles.stepText}>{steps[currentStep]}</p>

        {/* Timer section */}
        <div className={styles.timerSection}>
          {timerSeconds > 0 || timerRunning ? (
            <div className={styles.timerDisplay}>
              <span className={`${styles.timerTime} ${timerSeconds === 0 ? styles.timerDone : ''}`}>
                {timerSeconds === 0 ? '⏰ Done!' : formatTime(timerSeconds)}
              </span>
              <div className={styles.timerControls}>
                {timerSeconds > 0 && (
                  <button className={styles.timerBtn} onClick={toggleTimer}>
                    {timerRunning ? '⏸ Pause' : '▶ Resume'}
                  </button>
                )}
                <button className={styles.timerResetBtn} onClick={resetTimer}>Reset</button>
              </div>
            </div>
          ) : (
            <div className={styles.timerPicker}>
              <p className={styles.timerLabel}>Set a timer</p>
              <div className={styles.timerOptions}>
                {[1, 2, 3, 5, 10, 15, 20, 30].map(m => (
                  <button key={m} className={styles.timerOption} onClick={() => startTimer(m)}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.cookNav}>
        <button
          className={styles.prevBtn}
          onClick={goPrev}
          disabled={currentStep === 0}
        >
          ← Previous
        </button>

        <button
          className={`${styles.nextBtn} ${currentStep === steps.length - 1 ? styles.finishBtn : ''}`}
          onClick={goNext}
        >
          {currentStep === steps.length - 1 ? '🎉 Finish' : 'Next step →'}
        </button>
      </div>

      {/* Side panel: ingredients reminder */}
      <div className={styles.ingredientsSide}>
        <p className={styles.ingredientsSideTitle}>Ingredients ({servings} people)</p>
        {ingredients.map((ing, i) => (
          <div
            key={i}
            className={`${styles.sideIngredient} ${checkedIngredients.includes(i) ? styles.sideChecked : ''}`}
            onClick={() => toggleIngredient(i)}
          >
            <span>{checkedIngredients.includes(i) ? '✓' : '·'}</span>
            <span>{scaleIngredient(ing)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
