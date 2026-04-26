import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../lib/CartContext'
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

function CartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export default function RecipeCard({ recipe }) {
  const { addToCart, isInCart } = useCart()
  const [showPicker, setShowPicker] = useState(false)
  const [servings, setServings] = useState(recipe.servings || 4)
  const inCart = isInCart(recipe.id)

  function handleCartClick(e) {
    e.preventDefault()
    e.stopPropagation()
    setServings(recipe.servings || 4)
    setShowPicker(true)
  }

  function handleAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    addToCart(recipe, servings)
    setShowPicker(false)
  }

  function handleCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setShowPicker(false)
  }

  return (
    <Link to={`/recipe/${recipe.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.name} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder}>✦</div>
        )}
        <div className={styles.categoryBadge}>{recipe.category_name}</div>

        <button
          className={`${styles.cartBtn} ${inCart ? styles.cartBtnActive : ''}`}
          onClick={inCart ? handleCartClick : handleCartClick}
          aria-label={inCart ? 'Update cart' : 'Add to cart'}
        >
          {inCart
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            : <CartIcon />
          }
        </button>

        {showPicker && (
          <div
            className={styles.pickerOverlay}
            onClick={handleCancel}
          >
            <div
              className={styles.pickerCard}
              onClick={e => { e.preventDefault(); e.stopPropagation() }}
            >
              <p className={styles.pickerTitle}>{inCart ? 'Update servings' : 'Add to Cart'}</p>
              <p className={styles.pickerLabel}>For how many people?</p>
              <div className={styles.pickerRow}>
                <button
                  className={styles.pickerStepBtn}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setServings(s => Math.max(1, s - 1)) }}
                >−</button>
                <span className={styles.pickerNum}>{servings}</span>
                <button
                  className={styles.pickerStepBtn}
                  onClick={e => { e.preventDefault(); e.stopPropagation(); setServings(s => s + 1) }}
                >+</button>
              </div>
              <button className={styles.pickerAddBtn} onClick={handleAdd}>
                {inCart ? 'Update' : 'Add to Cart'}
              </button>
            </div>
          </div>
        )}
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
