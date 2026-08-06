import { useContext } from 'react'
import { StoreContext } from '../context/store-context.js'

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}
