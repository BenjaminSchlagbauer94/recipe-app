import { useNavigate } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import styles from './CartPage.module.css'

export default function CartPage() {
  const navigate = useNavigate()
  const { cartItems, removeFromCart, updateServings, clearCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🛒</div>
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p className={styles.emptyText}>Add recipes from the collection to plan your shopping.</p>
        <button className={styles.browseBtn} onClick={() => navigate('/')}>Browse Recipes</button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Shopping Cart</h1>
        <button className={styles.clearBtn} onClick={clearCart}>Clear all</button>
      </div>

      <div className={styles.list}>
        {cartItems.map(item => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemImage}>
              {item.image_url
                ? <img src={item.image_url} alt={item.name} />
                : <div className={styles.imagePlaceholder}>✦</div>
              }
            </div>

            <div className={styles.itemInfo}>
              <h3 className={styles.itemName}>{item.name}</h3>
              {item.category_name && (
                <span className={styles.itemCategory}>{item.category_name}</span>
              )}
              <div className={styles.servingsRow}>
                <span className={styles.servingsLabel}>Servings:</span>
                <button
                  className={styles.stepBtn}
                  onClick={() => updateServings(item.id, Math.max(1, item.servings - 1))}
                >−</button>
                <span className={styles.servingsNum}>{item.servings}</span>
                <button
                  className={styles.stepBtn}
                  onClick={() => updateServings(item.id, item.servings + 1)}
                >+</button>
                <span className={styles.servingsUnit}>people</span>
              </div>
            </div>

            <button
              className={styles.removeBtn}
              onClick={() => removeFromCart(item.id)}
              aria-label="Remove from cart"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerNote}>{cartItems.length} recipe{cartItems.length !== 1 ? 's' : ''} selected</p>
        <button
          className={styles.checkoutBtn}
          onClick={() => navigate('/shopping-list')}
        >
          Proceed to Shopping List →
        </button>
      </div>
    </div>
  )
}
