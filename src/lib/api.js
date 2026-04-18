const API_URL = process.env.REACT_APP_API_URL

export async function scrapeRecipe(url) {
  const res = await fetch(`${API_URL}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error('Failed to scrape recipe')
  return res.json()
}

export async function getRecipes() {
  const res = await fetch(`${API_URL}/recipes`)
  if (!res.ok) throw new Error('Failed to fetch recipes')
  return res.json()
}

export async function getRecipe(id) {
  const res = await fetch(`${API_URL}/recipes/${id}`)
  if (!res.ok) throw new Error('Failed to fetch recipe')
  return res.json()
}

export async function createRecipe(recipe) {
  const res = await fetch(`${API_URL}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe),
  })
  if (!res.ok) throw new Error('Failed to create recipe')
  return res.json()
}

export async function updateRecipe(id, recipe) {
  const res = await fetch(`${API_URL}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipe),
  })
  if (!res.ok) throw new Error('Failed to update recipe')
  return res.json()
}

export async function deleteRecipe(id) {
  const res = await fetch(`${API_URL}/recipes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete recipe')
  return res.json()
}

export async function getCategories() {
  const res = await fetch(`${API_URL}/categories`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export async function createCategory(category) {
  const res = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  })
  if (!res.ok) throw new Error('Failed to create category')
  return res.json()
}
