import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCategories, getRecipes, createCategory } from '../lib/api'
import RecipeCard from '../components/RecipeCard'
import styles from './HomePage.module.css'

const CATEGORY_ICONS = {
  'Starters': '🥗',
  'Main dishes': '🍽️',
  'Desserts': '🍮',
  'Drinks': '🍹',
  'Prep Meals': '📦',
  'Soups & Stews': '🍲',
  "Soup's & Stew's": '🍲',
}

export default function HomePage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [recipes, setRecipes] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    Promise.all([getCategories(), getRecipes()])
      .then(([cats, recs]) => {
        setCategories(cats)
        setRecipes(recs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const created = await createCategory({ name: newCategoryName.trim() })
      setCategories(prev => [...prev, created])
      setNewCategoryName('')
      setAddingCategory(false)
    } catch (e) {
      alert('Failed to add category')
    }
  }

  const filtered = activeCategory === 'all'
    ? recipes
    : recipes.filter(r => r.category_id === activeCategory)

  if (loading) return <div className={styles.loading}><span className={styles.spinner} /></div>

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.heroSub}>Your personal collection</p>
        <h1 className={styles.heroTitle}>Recipe Book</h1>
        <p className={styles.heroDesc}>{recipes.length} recipes across {categories.length} categories</p>
      </div>

      {/* Category tabs */}
      <div className={styles.categoryBar}>
        <button
          className={`${styles.catBtn} ${activeCategory === 'all' ? styles.catActive : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catActive : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{CATEGORY_ICONS[cat.name] || '📁'}</span>
            {cat.name}
          </button>
        ))}
        {addingCategory ? (
          <div className={styles.newCatInput}>
            <input
              autoFocus
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder="Category name..."
            />
            <button onClick={handleAddCategory}>Add</button>
            <button onClick={() => setAddingCategory(false)}>✕</button>
          </div>
        ) : (
          <button className={styles.addCatBtn} onClick={() => setAddingCategory(true)}>
            + Category
          </button>
        )}
      </div>

      {/* Recipes grid */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>No recipes yet.</p>
          <button className={styles.emptyBtn} onClick={() => navigate('/add')}>
            Add your first recipe
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((recipe, i) => (
            <div key={recipe.id} className={styles.cardWrap} style={{ animationDelay: `${i * 0.05}s` }}>
              <RecipeCard recipe={recipe} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
