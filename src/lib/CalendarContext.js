// recipe-app/src/lib/CalendarContext.js
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { getCalendar, updateCalendarSettings } from './api'

const CalendarContext = createContext()
const CALENDAR_ID = 'main'

export function CalendarProvider({ children }) {
  const [calendarData, setCalendarData] = useState(null)

  const fetchCalendar = useCallback(async () => {
    try {
      const data = await getCalendar()
      setCalendarData(data)
    } catch (err) {
      console.error('CalendarContext fetch error:', err)
    }
  }, [])

  useEffect(() => {
    fetchCalendar()

    const channel = supabase
      .channel('calendar-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cooking_calendar',
        filter: `id=eq.${CALENDAR_ID}`,
      }, () => { fetchCalendar() })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchCalendar])

  function isHighlighted(recipeId) {
    return (calendarData?.highlighted_recipe_ids || []).includes(recipeId)
  }

  async function toggleHighlight(recipe) {
    if (!calendarData) return
    const ids = calendarData.highlighted_recipe_ids || []
    const newIds = ids.includes(recipe.id)
      ? ids.filter(id => id !== recipe.id)
      : [...ids, recipe.id]

    // Optimistic update so the icon flips immediately
    setCalendarData(prev => ({ ...prev, highlighted_recipe_ids: newIds }))

    try {
      const updated = await updateCalendarSettings({ highlighted_recipe_ids: newIds })
      setCalendarData(updated)
    } catch (err) {
      // Revert on error
      setCalendarData(prev => ({ ...prev, highlighted_recipe_ids: ids }))
      console.error('toggleHighlight error:', err)
    }
  }

  return (
    <CalendarContext.Provider value={{ calendarData, isHighlighted, toggleHighlight }}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  return useContext(CalendarContext)
}
