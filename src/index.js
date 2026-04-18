import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import AddRecipePage from './pages/AddRecipePage'
import EditRecipePage from './pages/EditRecipePage'
import CookModePage from './pages/CookModePage'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:id" element={<CategoryPage />} />
          <Route path="recipe/:id" element={<RecipeDetailPage />} />
          <Route path="recipe/:id/edit" element={<EditRecipePage />} />
          <Route path="add" element={<AddRecipePage />} />
        </Route>
        <Route path="recipe/:id/cook" element={<CookModePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
