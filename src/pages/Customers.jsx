import { useId, useMemo, useState } from 'react'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Input, Label, Textarea, FieldError } from '../components/ui/Field.jsx'
import { useStore } from '../hooks/useStore.js'
import { useToast } from '../hooks/useToast.js'
import { formatMoney, formatNumber } from '../lib/format.js'
import { downloadCsv } from '../lib/csv.js'

const EMPTY_FORM = { name: '', phone: '', notes: '' }

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore()
  const toast = useToast()
  const formId = useId()

  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
  }, [customers, query])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (customer) => {
    setEditingId(customer.id)
    setForm({ name: customer.name, phone: customer.phone, notes: customer.notes })
    setError('')
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('اسم الزبون مطلوب')
      return
    }
    if (editingId) {
      updateCustomer(editingId, form)
      toast.success('تم تحديث بيانات الزبون')
    } else {
      addCustomer(form)
      toast.success('تمت إضافة الزبون بنجاح')
    }
    setModalOpen(false)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteCustomer(deleteTarget.id)
    toast.success(`تم حذف "${deleteTarget.name}"`)
    setDeleteTarget(null)
  }

  const handleExport = () => {
    downloadCsv(
      'الزبائن.csv',
      [
        { key: 'name', label: 'الاسم' },
        { key: 'phone', label: 'الهاتف' },
        { key: 'visits', label: 'عدد الزيارات' },
        { key: 'totalSpent', label: 'إجمالي الإنفاق' },
        { key: 'notes', label: 'ملاحظات' },
      ],
      filtered
    )
    toast.success('تم تصدير الزبائن بصيغة CSV')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Icon name="search" size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف…"
            className="ps-9"
            aria-label="بحث في الزبائن"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
            <Icon name="download" size={17} />
            تصدير CSV
          </Button>
          <Button onClick={openAdd}>
            <Icon name="plus" size={17} />
            إضافة زبون
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Icon name="users" size={22} />}
          title={customers.length === 0 ? 'لا يوجد زبائن بعد' : 'لا توجد نتائج'}
          description={customers.length === 0 ? 'ابدأ بإضافة أول زبون' : 'جرّب كلمة بحث أخرى'}
          action={
            customers.length === 0 ? (
              <Button onClick={openAdd}>
                <Icon name="plus" size={17} />
                إضافة زبون
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/60 text-xs font-semibold text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-start">الاسم</th>
                  <th className="px-4 py-3 text-start">الهاتف</th>
                  <th className="px-4 py-3 text-start">الزيارات</th>
                  <th className="px-4 py-3 text-start">إجمالي الإنفاق</th>
                  <th className="px-4 py-3 text-start sr-only">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-800">{c.name}</p>
                      {c.notes && <p className="max-w-xs truncate text-xs text-ink-400">{c.notes}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{formatNumber(c.visits)}</td>
                    <td className="px-4 py-3 font-medium text-ink-800">{formatMoney(c.totalSpent)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          aria-label={`تعديل ${c.name}`}
                          className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          aria-label={`حذف ${c.name}`}
                          className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'تعديل الزبون' : 'إضافة زبون جديد'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" form={formId}>
              حفظ
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="c-name" required>
              الاسم
            </Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value })
                if (error) setError('')
              }}
              invalid={Boolean(error)}
            />
            <FieldError>{error}</FieldError>
          </div>
          <div>
            <Label htmlFor="c-phone">الهاتف</Label>
            <Input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="c-notes">ملاحظات</Label>
            <Textarea id="c-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="حذف الزبون"
        message={`متأكد بلي تحب تحذف "${deleteTarget?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
      />
    </div>
  )
}
