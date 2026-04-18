import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecipe, updateRecipe } from '../lib/api'
import RecipeForm from '../components/RecipeForm'
import styles from './EditRecipePage.module.css'

export default function EditRecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecipe(id)
      .then(setRecipe)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (formData) => {
    await updateRecipe(id, formData)
    navigate(`/recipe/${id}`)
  }

  if (loading) return (
    <div className={styles.loading}><span className={styles.spinner} /></div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>Edit Recipe</h1>
        <p className={styles.sub}>{recipe?.name}</p>
      </div>
      <RecipeForm
        initial={recipe}
        onSave={handleSave}
        onCancel={() => navigate(`/recipe/${id}`)}
        mode="edit"
      />
    </div>
  )
}
