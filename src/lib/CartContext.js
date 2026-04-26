import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recipe-cart')) || [] } catch { return [] }
  })

  const [otherGroceries, setOtherGroceries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('other-groceries')) || [] } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('recipe-cart', JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    localStorage.setItem('other-groceries', JSON.stringify(otherGroceries))
  }, [otherGroceries])

  function addToCart(recipe, servings) {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === recipe.id)
      if (existing) {
        return prev.map(item =>
          item.id === recipe.id ? { ...item, servings } : item
        )
      }
      return [...prev, {
        id: recipe.id,
        name: recipe.name,
        image_url: recipe.image_url || null,
        category_name: recipe.category_name || null,
        originalServings: recipe.servings || 4,
        servings: servings || recipe.servings || 4,
      }]
    })
  }

  function removeFromCart(id) {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  function updateServings(id, servings) {
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, servings } : item)
    )
  }

  function clearCart() {
    setCartItems([])
  }

  function isInCart(id) {
    return cartItems.some(item => item.id === id)
  }

  function addOtherGrocery(item) {
    const trimmed = item.trim()
    if (!trimmed) return
    setOtherGroceries(prev => prev.includes(trimmed) ? prev : [...prev, trimmed])
  }

  function removeOtherGrocery(item) {
    setOtherGroceries(prev => prev.filter(i => i !== item))
  }

  function clearOtherGroceries() {
    setOtherGroceries([])
  }

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateServings, clearCart, isInCart,
      otherGroceries, addOtherGrocery, removeOtherGrocery, clearOtherGroceries,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
