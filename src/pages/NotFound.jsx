import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon name="alert" size={28} />
      </span>
      <div>
        <h1 className="text-2xl font-bold text-ink-900">404 — الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-ink-500">الرابط لي دخلتيه ماكانش، أو تحوّل لمكان آخر.</p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        الرجوع للرئيسية
      </Link>
    </div>
  )
}
