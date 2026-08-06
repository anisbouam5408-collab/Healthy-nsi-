import { useEffect, useState } from 'react'
import { loadState, saveState } from '../lib/storage.js'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => loadState(key, initialValue))

  useEffect(() => {
    saveState(key, value)
  }, [key, value])

  return [value, setValue]
}
