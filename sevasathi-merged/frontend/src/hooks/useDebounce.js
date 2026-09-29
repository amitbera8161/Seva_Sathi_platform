import { useState, useEffect } from 'react'

// Delays updating a value until the user stops changing it for `delay` ms.
// Handy for search boxes so you don't fire an API call on every keystroke.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
