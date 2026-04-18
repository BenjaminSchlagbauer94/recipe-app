import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import styles from './Layout.module.css'

export default function Layout() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

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
            <button
              className={styles.addBtn}
              onClick={() => navigate('/add')}
            >
              + New Recipe
            </button>
          </nav>

          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Collection</Link>
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
