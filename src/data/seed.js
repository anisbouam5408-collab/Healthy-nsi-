export const CATEGORIES = ['العناية بالبشرة', 'مكياج', 'العناية بالشعر', 'عطور', 'إكسسوارات']

export const seedProducts = [
  {
    id: 'p-1',
    name: 'كريم مرطب للوجه',
    category: 'العناية بالبشرة',
    costPrice: 800,
    price: 1500,
    quantity: 24,
    minQuantity: 5,
    sku: 'SKN-001',
  },
  {
    id: 'p-2',
    name: 'أحمر شفاه مات',
    category: 'مكياج',
    costPrice: 450,
    price: 1200,
    quantity: 40,
    minQuantity: 8,
    sku: 'MKP-014',
  },
  {
    id: 'p-3',
    name: 'شامبو للشعر الجاف',
    category: 'العناية بالشعر',
    costPrice: 600,
    price: 1400,
    quantity: 3,
    minQuantity: 6,
    sku: 'HAR-022',
  },
  {
    id: 'p-4',
    name: 'عطر نسائي فاخر 50مل',
    category: 'عطور',
    costPrice: 2200,
    price: 4500,
    quantity: 12,
    minQuantity: 3,
    sku: 'PRF-005',
  },
  {
    id: 'p-5',
    name: 'باليت ظلال عيون',
    category: 'مكياج',
    costPrice: 900,
    price: 2200,
    quantity: 18,
    minQuantity: 5,
    sku: 'MKP-031',
  },
  {
    id: 'p-6',
    name: 'واقي شمس SPF50',
    category: 'العناية بالبشرة',
    costPrice: 700,
    price: 1600,
    quantity: 0,
    minQuantity: 5,
    sku: 'SKN-018',
  },
]

export const seedCustomers = [
  { id: 'c-1', name: 'أمينة بلحاج', phone: '0551 23 45 67', notes: '', totalSpent: 0, visits: 0 },
  { id: 'c-2', name: 'سارة مرابط', phone: '0662 98 76 54', notes: 'تفضل العطور', totalSpent: 0, visits: 0 },
]
