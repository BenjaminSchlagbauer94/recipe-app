import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { scrapeRecipe, createRecipe, getCategories } from '../lib/api'
import RecipeForm from '../components/RecipeForm'
import styles from './AddRecipePage.module.css'

export default function AddRecipePage() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scraped, setScraped] = useState(null)
  const [error, setError] = useState('')

  const handleScrape = async () => {
    if (!url.trim()) return
    setScraping(true)
    setError('')
    try {
      const data = await scrapeRecipe(url)
      setScraped(data)
    } catch (e) {
      setError('Could not extract recipe. Please check the URL and try again.')
    } finally {
      setScraping(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      const recipe = await createRecipe({ ...formData, source_url: url })
      navigate(`/recipe/${recipe.id}`)
    } catch (e) {
      alert('Failed to save recipe')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 className={styles.title}>New Recipe</h1>
        <p className={styles.sub}>Paste a link from any recipe website</p>
      </div>

      {!scraped ? (
        <div className={styles.urlBox}>
          <div className={styles.urlInputWrap}>
            <span className={styles.urlIcon}>🔗</span>
            <input
              className={styles.urlInput}
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
              placeholder="https://www.chefkoch.de/rezepte/..."
              disabled={scraping}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button
            className={styles.scrapeBtn}
            onClick={handleScrape}
            disabled={scraping || !url.trim()}
          >
            {scraping ? (
              <><span className={styles.btnSpinner} /> Extracting recipe…</>
            ) : (
              'Extract Recipe'
            )}
          </button>

          {scraping && (
            <div className={styles.scrapingInfo}>
              <p>Our AI is reading the page and extracting all details…</p>
            </div>
          )}
        </div>
      ) : (
        <RecipeForm
          initial={scraped}
          onSave={handleSave}
          onCancel={() => setScraped(null)}
          mode="create"
        />
      )}
    </div>
  )
}
