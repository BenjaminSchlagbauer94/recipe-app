import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecipes, getCategories } from '../lib/api'
import RecipeCard from '../components/RecipeCard'
import styles from './CategoryPage.module.css'

export default function CategoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getRecipes(), getCategories()])
      .then(([recs, cats]) => {
        const cat = cats.find(c => c.id === id)
        setCategory(cat)
        setRecipes(recs.filter(r => r.category_id === id))
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className={styles.loading}><span className={styles.spinner} /></div>

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
      <h1 className={styles.title}>{category?.name || 'Category'}</h1>
      <p className={styles.count}>{recipes.length} recipes</p>

      {recipes.length === 0 ? (
        <div className={styles.empty}>
          <p>No recipes in this category yet.</p>
          <button onClick={() => navigate('/add')}>Add a recipe</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {recipes.map((r, i) => (
            <div key={r.id} style={{ animationDelay: `${i * 0.05}s` }} className={styles.cardWrap}>
              <RecipeCard recipe={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
