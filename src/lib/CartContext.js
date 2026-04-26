import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'

const CartContext = createContext()
const CART_ID = 'main'

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [otherGroceries, setOtherGroceries] = useState([])
  const [cartLoaded, setCartLoaded] = useState(false)
  // Prevents the save effect from echoing back data we just received
  // (from initial load or from a Realtime update sent by another device)
  const skipSaveRef = useRef(false)

  useEffect(() => {
    // Initial load from Supabase
    supabase
      .from('shared_cart')
      .select('cart_items, other_groceries')
      .eq('id', CART_ID)
      .maybeSingle()
      .then(({ data }) => {
        skipSaveRef.current = true
        setCartItems(data?.cart_items || [])
        setOtherGroceries(data?.other_groceries || [])
        setCartLoaded(true)
      })

    // Realtime: receive changes made on another device
    const channel = supabase
      .channel('cart-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_cart',
        filter: `id=eq.${CART_ID}`,
      }, ({ new: row }) => {
        if (!row?.cart_items) return
        skipSaveRef.current = true
        setCartItems(row.cart_items)
        setOtherGroceries(row.other_groceries || [])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Persist to Supabase whenever cart changes — skipped for incoming syncs
  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (!cartLoaded) return
    supabase
      .from('shared_cart')
      .upsert({ id: CART_ID, cart_items: cartItems, other_groceries: otherGroceries })
      .then()
  }, [cartItems, otherGroceries]) // eslint-disable-line

  function addToCart(recipe, servings) {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === recipe.id)
      if (existing) return prev.map(item => item.id === recipe.id ? { ...item, servings } : item)
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
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, servings } : item))
  }

  function clearCart() {
    setCartItems([])
  }

  function isInCart(id) {
    return cartItems.some(item => item.id === id)
  }

  // otherGroceries items are { name: string, quantity: number }
  function addOtherGrocery(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    setOtherGroceries(prev =>
      prev.some(i => i.name === trimmed) ? prev : [...prev, { name: trimmed, quantity: 1 }]
    )
  }

  function removeOtherGrocery(name) {
    setOtherGroceries(prev => prev.filter(i => i.name !== name))
  }

  function updateOtherGroceryQuantity(name, quantity) {
    if (quantity < 1) {
      setOtherGroceries(prev => prev.filter(i => i.name !== name))
      return
    }
    setOtherGroceries(prev => prev.map(i => i.name === name ? { ...i, quantity } : i))
  }

  function clearOtherGroceries() {
    setOtherGroceries([])
  }

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateServings, clearCart, isInCart, cartLoaded,
      otherGroceries, addOtherGrocery, removeOtherGrocery, updateOtherGroceryQuantity, clearOtherGroceries,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
