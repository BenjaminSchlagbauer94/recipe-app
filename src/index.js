import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { CartProvider } from './lib/CartContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import AddRecipePage from './pages/AddRecipePage'
import EditRecipePage from './pages/EditRecipePage'
import CookModePage from './pages/CookModePage'
import CartPage from './pages/CartPage'
import ShoppingListPage from './pages/ShoppingListPage'
import InspirationPage from './pages/InspirationPage'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="category/:id" element={<CategoryPage />} />
            <Route path="recipe/:id" element={<RecipeDetailPage />} />
            <Route path="recipe/:id/edit" element={<EditRecipePage />} />
            <Route path="add" element={<AddRecipePage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="shopping-list" element={<ShoppingListPage />} />
            <Route path="inspirations" element={<InspirationPage />} />
          </Route>
          <Route path="recipe/:id/cook" element={<CookModePage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>
)
