import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRecipe, deleteRecipe } from '../lib/api'
import styles from './RecipeDetailPage.module.css'

function ScoreBar({ value, label }) {
  const color = value >= 8 ? 'var(--success)' : value >= 5 ? 'var(--accent)' : 'var(--danger)'
  return (
    <div className={styles.scoreRow}>
      <span className={styles.scoreLabel}>{label}</span>
      <div className={styles.scoreTrack}>
        <div className={styles.scoreFill} style={{ width: `${value * 10}%`, background: color }} />
      </div>
      <span className={styles.scoreNum}>{value}/10</span>
    </div>
  )
}

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getRecipe(id)
      .then(setRecipe)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this recipe?')) return
    setDeleting(true)
    await deleteRecipe(id)
    navigate('/')
  }

  if (loading) return <div className={styles.loading}><span className={styles.spinner} /></div>
  if (!recipe) return null

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <div className={styles.topActions}>
          <Link to={`/recipe/${id}/edit`} className={styles.editBtn}>Edit</Link>
          <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        {recipe.image_url && (
          <div className={styles.imageWrap}>
            <img src={recipe.image_url} alt={recipe.name} className={styles.image} />
          </div>
        )}
        <div className={styles.heroContent}>
          <span className={styles.categoryLabel}>{recipe.category_name}</span>
          <h1 className={styles.title}>{recipe.name}</h1>
          <div className={styles.meta}>
            {recipe.servings && <span>🍽 {recipe.servings} servings</span>}
            {recipe.source_url && (
              <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                View original ↗
              </a>
            )}
          </div>

          {/* Nutrition */}
          <div className={styles.nutrition}>
            <ScoreBar value={recipe.score_vitamins} label="Vitamins" />
            <ScoreBar value={recipe.score_proteins} label="Proteins" />
            <ScoreBar value={recipe.score_carbs} label="Carbs" />
          </div>

          {/* Prepare button */}
          <button
            className={styles.prepareBtn}
            onClick={() => navigate(`/recipe/${id}/cook`)}
          >
            ▶ Prepare this meal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Ingredients */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          <ul className={styles.ingredientList}>
            {(recipe.ingredients || []).map((ing, i) => (
              <li key={i} className={styles.ingredient}>
                <span className={styles.dot}>·</span>
                {ing}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Method</h2>
          {(recipe.steps || []).map((step, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNum}>{i + 1}</div>
              <p className={styles.stepText}>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
