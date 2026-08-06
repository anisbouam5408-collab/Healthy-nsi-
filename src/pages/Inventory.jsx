import { useId, useMemo, useState } from 'react'
import Icon from '../components/ui/Icon.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { Input, Select, Label, FieldError } from '../components/ui/Field.jsx'
import { useStore } from '../hooks/useStore.js'
import { useToast } from '../hooks/useToast.js'
import { CATEGORIES } from '../data/seed.js'
import { formatMoney, formatNumber } from '../lib/format.js'
import { downloadCsv } from '../lib/csv.js'

const EMPTY_FORM = { name: '', category: CATEGORIES[0], costPrice: '', price: '', quantity: '', minQuantity: '', sku: '' }

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'اسم المنتج مطلوب'
  if (form.price === '' || Number(form.price) < 0) errors.price = 'سعر البيع غير صالح'
  if (form.costPrice !== '' && Number(form.costPrice) < 0) errors.costPrice = 'سعر التكلفة غير صالح'
  if (form.quantity === '' || Number(form.quantity) < 0) errors.quantity = 'الكمية غير صالحة'
  if (form.minQuantity !== '' && Number(form.minQuantity) < 0) errors.minQuantity = 'الحد الأدنى غير صالح'
  return errors
}

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore()
  const toast = useToast()
  const formId = useId()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      const matchesCategory = category === 'all' || p.category === category
      return matchesQuery && matchesCategory
    })
  }, [products, query, category])

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      costPrice: String(product.costPrice),
      price: String(product.price),
      quantity: String(product.quantity),
      minQuantity: String(product.minQuantity),
      sku: product.sku,
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validation = validate(form)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    if (editingId) {
      updateProduct(editingId, form)
      toast.success('تم تحديث المنتج بنجاح')
    } else {
      addProduct(form)
      toast.success('تمت إضافة المنتج بنجاح')
    }
    setModalOpen(false)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteProduct(deleteTarget.id)
    toast.success(`تم حذف "${deleteTarget.name}"`)
    setDeleteTarget(null)
  }

  const handleExport = () => {
    downloadCsv(
      'المخزون.csv',
      [
        { key: 'name', label: 'المنتج' },
        { key: 'category', label: 'الفئة' },
        { key: 'sku', label: 'المرجع' },
        { key: 'costPrice', label: 'سعر التكلفة' },
        { key: 'price', label: 'سعر البيع' },
        { key: 'quantity', label: 'الكمية' },
        { key: 'minQuantity', label: 'الحد الأدنى' },
      ],
      filtered
    )
    toast.success('تم تصدير المخزون بصيغة CSV')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو المرجع…"
              className="ps-9"
              aria-label="بحث في المخزون"
            />
          </div>
          <div className="sm:w-52">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="تصفية حسب الفئة">
              <option value="all">كل الفئات</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={filtered.length === 0}>
            <Icon name="download" size={17} />
            تصدير CSV
          </Button>
          <Button onClick={openAdd}>
            <Icon name="plus" size={17} />
            إضافة منتج
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Icon name="box" size={22} />}
          title={products.length === 0 ? 'لا توجد منتجات بعد' : 'لا توجد نتائج'}
          description={
            products.length === 0
              ? 'ابدأ بإضافة أول منتج للمخزون'
              : 'جرّب تعديل كلمات البحث أو الفئة المختارة'
          }
          action={
            products.length === 0 ? (
              <Button onClick={openAdd}>
                <Icon name="plus" size={17} />
                إضافة منتج
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
                  <th className="px-4 py-3 text-start">المنتج</th>
                  <th className="px-4 py-3 text-start">الفئة</th>
                  <th className="px-4 py-3 text-start">سعر البيع</th>
                  <th className="px-4 py-3 text-start">الكمية</th>
                  <th className="px-4 py-3 text-start">الحالة</th>
                  <th className="px-4 py-3 text-start sr-only">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((p) => {
                  const low = p.quantity <= p.minQuantity
                  return (
                    <tr key={p.id} className="hover:bg-ink-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-800">{p.name}</p>
                        {p.sku && <p className="text-xs text-ink-400">{p.sku}</p>}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{p.category}</td>
                      <td className="px-4 py-3 font-medium text-ink-800">{formatMoney(p.price)}</td>
                      <td className="px-4 py-3 text-ink-600">{formatNumber(p.quantity)}</td>
                      <td className="px-4 py-3">
                        {p.quantity === 0 ? (
                          <Badge tone="danger">نفدت الكمية</Badge>
                        ) : low ? (
                          <Badge tone="warning">مخزون منخفض</Badge>
                        ) : (
                          <Badge tone="success">متوفر</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            aria-label={`تعديل ${p.name}`}
                            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            aria-label={`حذف ${p.name}`}
                            className="rounded-lg p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
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
            <Label htmlFor="p-name" required>
              اسم المنتج
            </Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              invalid={Boolean(errors.name)}
            />
            <FieldError>{errors.name}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p-category">الفئة</Label>
              <Select
                id="p-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="p-sku">المرجع (SKU)</Label>
              <Input id="p-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p-cost">سعر التكلفة</Label>
              <Input
                id="p-cost"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                invalid={Boolean(errors.costPrice)}
              />
              <FieldError>{errors.costPrice}</FieldError>
            </div>
            <div>
              <Label htmlFor="p-price" required>
                سعر البيع
              </Label>
              <Input
                id="p-price"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                invalid={Boolean(errors.price)}
              />
              <FieldError>{errors.price}</FieldError>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p-qty" required>
                الكمية
              </Label>
              <Input
                id="p-qty"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                invalid={Boolean(errors.quantity)}
              />
              <FieldError>{errors.quantity}</FieldError>
            </div>
            <div>
              <Label htmlFor="p-min">الحد الأدنى للتنبيه</Label>
              <Input
                id="p-min"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
                invalid={Boolean(errors.minQuantity)}
              />
              <FieldError>{errors.minQuantity}</FieldError>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="حذف المنتج"
        message={`متأكد بلي تحب تحذف "${deleteTarget?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
      />
    </div>
  )
}
