import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { loadState, saveState } from '../lib/storage.js'
import { ROLES } from '../lib/roles.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadState('session', null))
  const [loading, setLoading] = useState(true)

  // Simulates a session check so consumers can show a real loading state
  // instead of a flash of the login screen.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 250)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    saveState('session', user)
  }, [user])

  const login = (name, role) => {
    setUser({ name: name.trim() || (role === ROLES.OWNER ? 'المالك' : 'الموظف'), role })
  }

  const logout = () => setUser(null)

  const value = {
    user,
    loading,
    login,
    logout,
    isOwner: user?.role === ROLES.OWNER,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
