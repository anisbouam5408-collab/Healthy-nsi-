import { useId, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/ui/Logo.jsx'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import { Input, Label } from '../components/ui/Field.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { ROLES, ROLE_LABELS } from '../lib/roles.js'

const ROLE_CARDS = [
  {
    role: ROLES.OWNER,
    title: ROLE_LABELS[ROLES.OWNER],
    description: 'وصول كامل لكل الشاشات، بما فيها التقارير والمبيعات',
    icon: 'reports',
  },
  {
    role: ROLES.EMPLOYEE,
    title: ROLE_LABELS[ROLES.EMPLOYEE],
    description: 'وصول لنقطة البيع والمخزون والزبائن فقط',
    icon: 'pos',
  },
]

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const nameId = useId()
  const [name, setName] = useState('')
  const [role, setRole] = useState(ROLES.OWNER)
  const [error, setError] = useState('')

  if (!loading && user) {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('أدخل الاسم من فضلك')
      return
    }
    login(name, role)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size={44} />
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-center text-xl font-bold text-ink-900">تسجيل الدخول</h1>
          <p className="mt-1.5 text-center text-sm text-ink-500">
            اختر صفتك وأدخل اسمك للمتابعة
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-700">الصفة</legend>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_CARDS.map((card) => {
                  const active = role === card.role
                  return (
                    <button
                      key={card.role}
                      type="button"
                      onClick={() => setRole(card.role)}
                      aria-pressed={active}
                      className={`flex flex-col items-start gap-2 rounded-xl border p-3.5 text-start transition ${
                        active
                          ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                          : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          active ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-500'
                        }`}
                      >
                        <Icon name={card.icon} size={17} />
                      </span>
                      <span className="text-sm font-semibold text-ink-900">{card.title}</span>
                      <span className="text-xs leading-relaxed text-ink-500">{card.description}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div>
              <Label htmlFor={nameId} required>
                الاسم
              </Label>
              <Input
                id={nameId}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError('')
                }}
                placeholder="مثال: سارة"
                invalid={Boolean(error)}
                autoFocus
              />
              {error && (
                <p className="mt-1.5 text-xs text-rose-600" role="alert">
                  {error}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg">
              دخول
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          هذا تسجيل دخول تجريبي محلي بلا خادم — البيانات محفوظة على هذا الجهاز فقط.
        </p>
      </div>
    </div>
  )
}
