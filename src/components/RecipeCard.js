import { Link } from 'react-router-dom'
import styles from './RecipeCard.module.css'

function NutritionDot({ value, label }) {
  const color = value >= 8 ? '#2d6a4f' : value >= 5 ? '#c17f3a' : '#c0392b'
  return (
    <div className={styles.nutrient}>
      <div className={styles.nutrientBar}>
        <div
          className={styles.nutrientFill}
          style={{ width: `${value * 10}%`, background: color }}
        />
      </div>
      <span className={styles.nutrientLabel}>{label} {value}/10</span>
    </div>
  )
}

export default function RecipeCard({ recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.name} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>✦</div>
        )}
        <div className={styles.categoryBadge}>{recipe.category_name}</div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{recipe.name}</h3>
        {recipe.servings && (
          <p className={styles.servings}>For {recipe.servings} people</p>
        )}

        <div className={styles.nutrients}>
          <NutritionDot value={recipe.score_vitamins || 0} label="Vit" />
          <NutritionDot value={recipe.score_proteins || 0} label="Pro" />
          <NutritionDot value={recipe.score_carbs || 0} label="Carb" />
        </div>
      </div>
    </Link>
  )
}
