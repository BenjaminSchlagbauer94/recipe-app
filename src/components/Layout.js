import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../lib/CartContext'
import styles from './Layout.module.css'

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

export default function Layout() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartItems } = useCart()
  const cartCount = cartItems.length

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>✦</span>
            <span className={styles.logoText}>Recipes</span>
          </Link>

          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>Collection</Link>
            <Link to="/inspirations" className={styles.navLink}>Inspirations</Link>
            <button
              className={styles.cartNavBtn}
              onClick={() => navigate('/cart')}
              aria-label={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
            >
              <CartIcon />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>
            <button className={styles.addBtn} onClick={() => navigate('/add')}>
              + New Recipe
            </button>
          </nav>

          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Collection</Link>
            <Link to="/inspirations" onClick={() => setMenuOpen(false)}>✦ Inspirations</Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>
              Cart {cartCount > 0 && `(${cartCount})`}
            </Link>
            <Link to="/add" onClick={() => setMenuOpen(false)}>+ New Recipe</Link>
          </div>
        )}
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
