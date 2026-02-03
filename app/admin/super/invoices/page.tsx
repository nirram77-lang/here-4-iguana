"use client"

/**
 * 🦎 NO-ART GALLERY - Invoice Management System
 * Hollywood Edition - Split View Desktop + Responsive Mobile
 * v4.0 - Product Catalog + User Auto-Complete + Coupon Generation
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Plus, History, PieChart, Printer,
  User, Mail, Phone, Package, Trash2,
  CheckCircle, Search, MessageCircle, X, Save, RefreshCw, Home, ChevronLeft, Eye, ChevronDown, Users, Ticket, Copy, Sparkles
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

// Types
interface InvoiceItem { id: string; productId: string; description: string; quantity: number; price: number; total: number }
interface Customer { name: string; email: string; phone: string; address: string; userId?: string }
interface Invoice { id?: string; invoiceNumber: string; createdAt: Date; customer: Customer; items: InvoiceItem[]; subtotal: number; total: number; notes: string; status: 'draft' | 'sent' | 'paid'; sentAt?: Date; sentVia?: 'email' | 'whatsapp'; couponCode?: string }
interface DBUser { id: string; email: string; displayName?: string; firstName?: string; lastName?: string; phone?: string }

// 🛍️ PRODUCTS CATALOG - NO-ART GALLERY
const PRODUCTS = [
  // I4IGUANA Premium - with coupon type mapping
  { id: 'premium-pass', name: 'I4IGUANA - Pass חד פעמי', price: 9, category: 'I4IGUANA', couponType: 'PASS' },
  { id: 'premium-weekly', name: 'I4IGUANA - מנוי שבועי', price: 19, category: 'I4IGUANA', couponType: 'WEEKLY' },
  { id: 'premium-monthly', name: 'I4IGUANA - מנוי חודשי', price: 49, category: 'I4IGUANA', couponType: 'MONTHLY' },
  
  // FunnyDates - Audiobooks (no coupon)
  { id: 'audiobook-he', name: 'אודיובוק 101 דייטים - עברית', price: 69, category: 'FunnyDates' },
  { id: 'audiobook-en', name: 'Love Bites Audiobook - English', price: 0, category: 'FunnyDates' },
  
  // GO CIO Services (no coupon)
  { id: 'consult-hour', name: 'שעת ייעוץ IT', price: 350, category: 'GO CIO' },
  { id: 'consult-hour-premium', name: 'שעת ייעוץ IT Premium', price: 550, category: 'GO CIO' },
  
  // Custom (no coupon)
  { id: 'custom', name: '📝 מוצר/שירות מותאם אישית', price: 0, category: 'אחר' },
]

// 🎫 Coupon type labels
const COUPON_LABELS: Record<string, string> = {
  'PASS': 'Pass חד פעמי',
  'WEEKLY': 'מנוי שבועי (7 ימים)',
  'MONTHLY': 'מנוי חודשי (30 יום)'
}

// Business Details
const BUSINESS = { name: 'NO-ART GALLERY', owner: 'רם ניר אור', businessNumber: '038680278', address: 'שד׳ ירושלים 147 דירה 4', city: 'אשקלון', phone: '052-265-3170', email: 'nir@noartgallery.com', website: 'www.noartgallery.com' }

export default function InvoicesAdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'summary'>('create')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid'>('all')
  const [successMessage, setSuccessMessage] = useState('')
  const [customer, setCustomer] = useState<Customer>({ name: '', email: '', phone: '', address: '' })
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', productId: '', description: '', quantity: 1, price: 0, total: 0 }])
  const [notes, setNotes] = useState('')
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('001')
  
  // 🎫 Coupon generation states
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null)
  const [generatedCoupon, setGeneratedCoupon] = useState<string>('')
  const [couponSent, setCouponSent] = useState(false)
  const [generatingCoupon, setGeneratingCoupon] = useState(false)
  const [showMobileList, setShowMobileList] = useState(false)
  
  // 🔍 User search states
  const [dbUsers, setDbUsers] = useState<DBUser[]>([])
  const [emailSearch, setEmailSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<DBUser[]>([])
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { 
    loadInvoices()
    loadUsers()
  }, [])

  // 🔍 Load all users from DB
  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const users: DBUser[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        users.push({
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || data.firstName || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || data.phoneNumber || ''
        })
      })
      setDbUsers(users)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  // 🔍 Filter users as email is typed
  useEffect(() => {
    if (emailSearch.length >= 2) {
      const filtered = dbUsers.filter(u => 
        u.email?.toLowerCase().includes(emailSearch.toLowerCase()) ||
        u.displayName?.toLowerCase().includes(emailSearch.toLowerCase())
      ).slice(0, 5)
      setFilteredUsers(filtered)
      setShowUserDropdown(filtered.length > 0)
    } else {
      setFilteredUsers([])
      setShowUserDropdown(false)
    }
  }, [emailSearch, dbUsers])

  // 🔍 Select user from dropdown
  const selectUser = (user: DBUser) => {
    const fullName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim()
    setCustomer({
      ...customer,
      email: user.email,
      name: fullName || customer.name,
      phone: user.phone || customer.phone,
      userId: user.id
    })
    setEmailSearch(user.email)
    setShowUserDropdown(false)
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const list: Invoice[] = []
      snapshot.forEach(doc => { const data = doc.data(); list.push({ id: doc.id, ...data, createdAt: data.createdAt?.toDate() || new Date() } as Invoice) })
      setInvoices(list)
      const maxNum = list.reduce((max, inv) => { const num = parseInt(inv.invoiceNumber) || 0; return num > max ? num : max }, 0)
      setNextInvoiceNumber(String(maxNum + 1).padStart(3, '0'))
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal

  // Select product from catalog
  const selectProduct = (itemId: string, productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId)
    if (product) {
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          const newPrice = product.price
          return {
            ...item,
            productId,
            description: product.name,
            price: newPrice,
            total: item.quantity * newPrice
          }
        }
        return item
      }))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'price') updated.total = (field === 'quantity' ? Number(value) : item.quantity) * (field === 'price' ? Number(value) : item.price)
        return updated
      }
      return item
    }))
  }

  const addItem = () => setItems(prev => [...prev, { id: String(Date.now()), productId: '', description: '', quantity: 1, price: 0, total: 0 }])
  const removeItem = (id: string) => { if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id)) }

  const saveInvoice = async (status: 'draft' | 'sent' | 'paid' = 'draft') => {
    if (!customer.name) { alert('נא להזין שם לקוח'); return null }
    if (items.every(item => !item.description)) { alert('נא להזין לפחות פריט אחד'); return null }
    try {
      setSaving(true)
      const data = { invoiceNumber: nextInvoiceNumber, createdAt: Timestamp.now(), customer, items: items.filter(item => item.description), subtotal, total, notes, status, ...((status === 'sent' || status === 'paid') && { sentAt: Timestamp.now() }) }
      const docRef = await addDoc(collection(db, 'invoices'), data)
      await loadInvoices()
      setCustomer({ name: '', email: '', phone: '', address: '' })
      setEmailSearch('')
      setItems([{ id: '1', productId: '', description: '', quantity: 1, price: 0, total: 0 }])
      setNotes('')
      // Reset coupon state
      setSavedInvoice(null)
      setGeneratedCoupon('')
      setCouponSent(false)
      setSuccessMessage(status === 'sent' ? 'נשלח!' : status === 'paid' ? 'שולם!' : 'נשמר!')
      setTimeout(() => setSuccessMessage(''), 3000)
      return { id: docRef.id, ...data }
    } catch (error) { alert('שגיאה'); return null }
    finally { setSaving(false) }
  }

  const generateHTML = (inv?: Invoice) => {
    const i = inv || { invoiceNumber: nextInvoiceNumber, createdAt: new Date(), customer, items: items.filter(x => x.description), total, notes }
    return `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>חשבונית ${i.invoiceNumber}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px}.inv{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(0,0,0,.1)}.hd{background:linear-gradient(135deg,#1A4D3E,#0d2920);padding:20px;text-align:center}.hd .logo{font-size:36px}.hd .name{font-size:20px;color:#C9A962;letter-spacing:2px;font-weight:700}.hd .owner{color:rgba(255,255,255,.6);font-size:12px;margin-top:4px}.badge{display:inline-block;background:#C9A962;color:#1A4D3E;padding:3px 10px;border-radius:10px;font-size:10px;font-weight:700;margin-bottom:8px}.ttl{text-align:center;padding:15px;border-bottom:2px solid #C9A962}.ttl h1{font-size:24px;color:#1A4D3E}.ttl .meta{color:#666;font-size:12px;margin-top:5px}.info{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:15px;background:#f9f9f9}.info-box{background:#fff;border-radius:8px;padding:10px;border:1px solid #eee;font-size:11px}.info-box .t{font-weight:700;color:#1A4D3E;margin-bottom:5px}.items{padding:15px}.tbl{width:100%;border-collapse:collapse}.tbl th{background:#1A4D3E;color:#fff;padding:8px;font-size:11px}.tbl td{padding:8px;border-bottom:1px solid #eee;font-size:11px;text-align:center}.tbl td:first-child{text-align:right}.tot{display:flex;justify-content:flex-end;padding:15px}.tot-box{background:linear-gradient(135deg,#C9A962,#B8963D);padding:10px 20px;border-radius:8px;text-align:center}.tot-box .lbl{font-size:11px;color:#1A4D3E}.tot-box .amt{font-size:22px;font-weight:900;color:#1A4D3E}.tax{background:#FFF8E7;border:1px solid #C9A962;border-radius:6px;padding:8px;margin:0 15px 15px;text-align:center;font-size:10px;color:#666}.ft{background:#f9f9f9;padding:12px;text-align:center;border-top:2px solid #C9A962;font-size:11px;color:#666}.ft .ty{font-size:14px;color:#C9A962;font-weight:700;margin-top:5px}@media(max-width:500px){.info{grid-template-columns:1fr}}</style></head><body><div class="inv"><div class="hd"><div class="badge">עוסק פטור</div><div class="logo">🦎</div><div class="name">NO-ART GALLERY</div><div class="owner">${BUSINESS.owner}</div></div><div class="ttl"><h1>חשבונית</h1><div class="meta">מספר: ${i.invoiceNumber} | ${new Date(i.createdAt).toLocaleDateString('he-IL')}</div></div><div class="info"><div class="info-box"><div class="t">📋 לקוח</div><div>${i.customer.name}</div>${i.customer.phone?`<div>טל: ${i.customer.phone}</div>`:''}</div><div class="info-box"><div class="t">✦ העסק</div><div style="color:#C9A962;font-weight:700">${BUSINESS.name}</div><div>ע.מ: ${BUSINESS.businessNumber}</div><div>${BUSINESS.address}</div><div>טל: ${BUSINESS.phone}</div></div></div><div class="items"><table class="tbl"><thead><tr><th>תיאור</th><th>כמות</th><th>מחיר</th><th>סה״כ</th></tr></thead><tbody>${i.items.map(x=>`<tr><td>${x.description}</td><td>${x.quantity}</td><td>₪${x.price}</td><td><b>₪${x.total}</b></td></tr>`).join('')}</tbody></table></div><div class="tot"><div class="tot-box"><div class="lbl">סה״כ לתשלום</div><div class="amt">₪${i.total.toLocaleString()}</div></div></div><div class="tax"><b>עוסק פטור</b> - פטור ממע״מ</div><div class="ft">📞 ${BUSINESS.phone} | ${BUSINESS.email}<div class="ty">תודה!</div></div></div></body></html>`
  }

  const sendWhatsApp = async (inv?: Invoice) => {
    const i = inv || await saveInvoice('sent'); if (!i) return
    const phone = (i.customer?.phone || customer.phone).replace(/\D/g, ''); if (!phone) { alert('אין טלפון'); return }
    const msg = encodeURIComponent(`🦎 *NO-ART GALLERY*\n\nחשבונית: ${i.invoiceNumber}\nלכבוד: ${i.customer?.name || customer.name}\n\n*סה״כ: ₪${i.total?.toLocaleString() || total}*\n\nתודה! 💚`)
    const p = phone.startsWith('0') ? `972${phone.slice(1)}` : phone
    window.open(`https://wa.me/${p}?text=${msg}`, '_blank')
    if (inv?.id) { await updateDoc(doc(db, 'invoices', inv.id), { status: 'sent', sentAt: Timestamp.now(), sentVia: 'whatsapp' }); loadInvoices() }
  }

  const sendEmail = async (inv?: Invoice) => {
    const i = inv || await saveInvoice('sent'); if (!i) return
    const email = i.customer?.email || customer.email; if (!email) { alert('אין מייל'); return }
    const subj = encodeURIComponent(`חשבונית ${i.invoiceNumber} - NO-ART GALLERY`)
    const body = encodeURIComponent(`שלום ${i.customer?.name || customer.name},\n\nחשבונית ${i.invoiceNumber}\nסה״כ: ₪${i.total?.toLocaleString() || total}\n\nבברכה,\n${BUSINESS.owner}`)
    window.open(`mailto:${email}?subject=${subj}&body=${body}`, '_blank')
    if (inv?.id) { await updateDoc(doc(db, 'invoices', inv.id), { status: 'sent', sentAt: Timestamp.now(), sentVia: 'email' }); loadInvoices() }
  }

  const printInv = (inv?: Invoice) => { const w = window.open('', '_blank'); if (w) { w.document.write(generateHTML(inv)); w.document.close(); setTimeout(() => w.print(), 500) } }
  const markPaid = async (inv: Invoice) => { if (inv.id) { await updateDoc(doc(db, 'invoices', inv.id), { status: 'paid' }); loadInvoices(); setSuccessMessage('שולם!'); setTimeout(() => setSuccessMessage(''), 2000) } }

  // 🎫 Get coupon type from invoice items
  const getCouponTypeFromInvoice = (inv: Invoice): string | null => {
    for (const item of inv.items) {
      const product = PRODUCTS.find(p => p.id === item.productId || p.name === item.description)
      if (product && 'couponType' in product) {
        return (product as any).couponType
      }
    }
    return null
  }

  // 🎫 Generate random coupon code
  const generateCouponCode = (type: string): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `${type}-${code}`
  }

  // 🎫 Create coupon and save to DB
  const createCouponForInvoice = async (inv: Invoice) => {
    const couponType = getCouponTypeFromInvoice(inv)
    if (!couponType) {
      alert('אין מוצר Premium בחשבונית זו')
      return null
    }

    setGeneratingCoupon(true)
    try {
      const code = generateCouponCode(couponType)
      
      // Save to coupons collection
      await addDoc(collection(db, 'coupons'), {
        code,
        type: couponType.toLowerCase(),
        status: 'available',
        createdAt: Timestamp.now(),
        createdFrom: 'invoice',
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        userId: inv.customer.userId || null,
        userEmail: inv.customer.email || null,
        userName: inv.customer.name || null
      })

      // Update invoice with coupon
      if (inv.id) {
        await updateDoc(doc(db, 'invoices', inv.id), { 
          couponCode: code,
          status: 'paid'
        })
      }

      setGeneratedCoupon(code)
      setSavedInvoice({ ...inv, couponCode: code })
      await loadInvoices()
      
      return code
    } catch (error) {
      console.error('Error creating coupon:', error)
      alert('שגיאה ביצירת קופון')
      return null
    } finally {
      setGeneratingCoupon(false)
    }
  }

  // 🎫 Send coupon via WhatsApp
  const sendCouponWhatsApp = (inv: Invoice, couponCode: string) => {
    const phone = inv.customer.phone?.replace(/\D/g, '')
    if (!phone) { alert('אין טלפון'); return }
    
    const couponType = getCouponTypeFromInvoice(inv)
    const typeLabel = couponType ? COUPON_LABELS[couponType] : 'Premium'
    
    const msg = encodeURIComponent(
      `🦎 *I4IGUANA Premium*\n\n` +
      `היי ${inv.customer.name}! 👋\n\n` +
      `תודה על הרכישה! 💚\n\n` +
      `🎫 *הקופון שלך:*\n` +
      `\`${couponCode}\`\n\n` +
      `📦 *סוג מנוי:* ${typeLabel}\n\n` +
      `📲 *להפעלה:*\n` +
      `1. היכנס לאפליקציה\n` +
      `2. לחץ על "יש לי קופון" בפרופיל\n` +
      `3. הזן את הקוד\n\n` +
      `בהצלחה! 🦎✨`
    )
    
    const p = phone.startsWith('0') ? `972${phone.slice(1)}` : phone
    window.open(`https://wa.me/${p}?text=${msg}`, '_blank')
    setCouponSent(true)
  }

  // 🎫 Copy coupon to clipboard
  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code)
    setSuccessMessage('הועתק!')
    setTimeout(() => setSuccessMessage(''), 2000)
  }

  // 🎫 Reset coupon state for new invoice
  const resetCouponState = () => {
    setSavedInvoice(null)
    setGeneratedCoupon('')
    setCouponSent(false)
    // Reset form for new invoice
    setCustomer({ name: '', email: '', phone: '', address: '' })
    setEmailSearch('')
    setItems([{ id: '1', productId: '', description: '', quantity: 1, price: 0, total: 0 }])
    setNotes('')
  }

  // 🎫 Save and prepare for coupon
  const saveAndPrepareCoupon = async () => {
    if (!customer.name) { alert('נא להזין שם לקוח'); return }
    if (items.every(item => !item.description)) { alert('נא להזין לפחות פריט אחד'); return }
    
    try {
      setSaving(true)
      const data = { 
        invoiceNumber: nextInvoiceNumber, 
        createdAt: Timestamp.now(), 
        customer, 
        items: items.filter(item => item.description), 
        subtotal, 
        total, 
        notes, 
        status: 'paid' as const
      }
      const docRef = await addDoc(collection(db, 'invoices'), data)
      await loadInvoices()
      
      // Create invoice object for coupon generation (don't reset form yet!)
      const inv: Invoice = {
        id: docRef.id,
        invoiceNumber: nextInvoiceNumber,
        createdAt: new Date(),
        customer,
        items: items.filter(item => item.description),
        subtotal,
        total,
        notes,
        status: 'paid'
      }
      
      const couponType = getCouponTypeFromInvoice(inv)
      if (couponType) {
        setSavedInvoice(inv)
        setSuccessMessage('נשמר! כעת הפק קופון')
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error) { 
      alert('שגיאה') 
    } finally { 
      setSaving(false) 
    }
  }

  const filtered = invoices.filter(inv => (inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || inv.invoiceNumber.includes(searchTerm)) && (filterStatus === 'all' || inv.status === filterStatus))
  const year = new Date().getFullYear()
  const yearly = invoices.filter(inv => new Date(inv.createdAt).getFullYear() === year)
  const yearTotal = yearly.reduce((s, i) => s + i.total, 0)
  const paidTotal = yearly.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)

  // Invoice List Component (reusable)
  const InvoiceList = ({ compact = false }: { compact?: boolean }) => (
    <div className="space-y-2">
      {!compact && (
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" placeholder="חיפוש..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-9 text-white text-sm placeholder-white/40 focus:border-[#C9A962] focus:outline-none" />
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-center py-6 text-white/60"><RefreshCw className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-white/60 text-sm">אין חשבוניות</div>
      ) : (
        filtered.slice(0, compact ? 10 : undefined).map(inv => (
          <motion.div key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#C9A962]/30 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="bg-[#C9A962]/20 rounded px-2 py-0.5 text-[#C9A962] text-xs font-bold flex-shrink-0">#{inv.invoiceNumber}</div>
                <div className="truncate">
                  <div className="text-white text-sm font-medium truncate">{inv.customer.name}</div>
                  <div className="text-white/40 text-xs">{new Date(inv.createdAt).toLocaleDateString('he-IL')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-left">
                  <div className="text-[#C9A962] font-bold text-sm">₪{inv.total.toLocaleString()}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${inv.status === 'paid' ? 'bg-green-500/20 text-green-400' : inv.status === 'sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/20 text-white/60'}`}>
                    {inv.status === 'paid' ? '✓ שולם' : inv.status === 'sent' ? '→ נשלח' : '◌ טיוטה'}
                  </span>
                </div>
                {!compact && (
                  <div className="flex">
                    {inv.status !== 'paid' && <button onClick={() => markPaid(inv)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"><CheckCircle className="w-4 h-4" /></button>}
                    <button onClick={() => sendWhatsApp(inv)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded"><MessageCircle className="w-4 h-4" /></button>
                    <button onClick={() => printInv(inv)} className="p-1.5 text-[#C9A962] hover:bg-[#C9A962]/20 rounded"><Printer className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      <AnimatePresence>{successMessage && <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2"><CheckCircle className="w-5 h-5" />{successMessage}</motion.div>}</AnimatePresence>

      <header className="sticky top-0 z-40 bg-[#0d2920]/90 backdrop-blur-lg border-b border-[#C9A962]/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin/super')} className="p-2 hover:bg-white/10 rounded-lg"><ChevronLeft className="w-5 h-5 text-white/60" /></button>
            <div className="text-2xl">🦎</div>
            <div><h1 className="text-lg font-bold text-[#C9A962]">NO-ART GALLERY</h1><p className="text-white/50 text-xs">חשבוניות</p></div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: Show list toggle */}
            <button onClick={() => setShowMobileList(!showMobileList)} className="lg:hidden p-2 bg-white/10 hover:bg-white/20 rounded-lg">
              <History className="w-5 h-5 text-white/80" />
            </button>
            <button onClick={() => router.push('/admin/super')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><Home className="w-5 h-5 text-white/80" /></button>
          </div>
        </div>
      </header>

      {/* Mobile Tabs - Only show on mobile */}
      <div className="lg:hidden sticky top-[52px] z-30 bg-[#0d2920]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 py-2 overflow-x-auto">
          {[{ id: 'create', label: '+ חדשה', icon: Plus }, { id: 'history', label: 'היסטוריה', icon: History }, { id: 'summary', label: 'סיכום', icon: PieChart }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${activeTab === t.id ? 'bg-[#C9A962] text-[#1A4D3E] font-bold' : 'text-white/70 hover:bg-white/10'}`}><t.icon className="w-4 h-4" />{t.label}</button>
          ))}
        </div>
      </div>

      {/* Main Content - Split View on Desktop */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-6">
          {/* LEFT SIDE - Invoice List (Desktop Only) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-[80px] bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-[#C9A962]/10 px-4 py-3 border-b border-white/10">
                <h2 className="text-[#C9A962] font-bold flex items-center gap-2">
                  <History className="w-4 h-4" />
                  חשבוניות אחרונות
                </h2>
              </div>
              <div className="p-3 max-h-[calc(100vh-180px)] overflow-y-auto">
                <InvoiceList compact />
              </div>
              <div className="p-3 border-t border-white/10 bg-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">סה״כ {year}:</span>
                  <span className="text-[#C9A962] font-bold">₪{yearTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-white/60">שולם:</span>
                  <span className="text-green-400 font-bold">₪{paidTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Form / Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Desktop always shows create form, mobile shows based on tab */}
              {(activeTab === 'create' || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                <motion.div key="create" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 lg:block" style={{ display: activeTab === 'create' ? 'block' : '' }}>
                  <div className="bg-white/5 rounded-xl p-4 border border-[#C9A962]/30 flex items-center justify-between">
                    <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-[#C9A962]" /><span className="text-white font-medium">חשבונית חדשה</span></div>
                    <div className="text-[#C9A962] text-xl font-bold">#{nextInvoiceNumber}</div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/80 text-sm font-medium"><User className="w-4 h-4 text-[#C9A962]" />פרטי לקוח</div>
                      {dbUsers.length > 0 && <span className="text-xs text-white/40 flex items-center gap-1"><Users className="w-3 h-3" />{dbUsers.length} משתמשים ב-DB</span>}
                    </div>
                    
                    {/* 🔍 Email Search with Auto-Complete */}
                    <div className="relative">
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A962]" />
                        <input 
                          ref={emailInputRef}
                          type="email" 
                          placeholder="🔍 חפש מייל או הקלד ידנית..." 
                          value={emailSearch || customer.email}
                          onChange={e => {
                            setEmailSearch(e.target.value)
                            setCustomer(p => ({ ...p, email: e.target.value }))
                          }}
                          onFocus={() => emailSearch.length >= 2 && setShowUserDropdown(true)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 pr-10 text-white placeholder-white/40 focus:border-[#C9A962] focus:outline-none" 
                        />
                      </div>
                      
                      {/* User Dropdown */}
                      <AnimatePresence>
                        {showUserDropdown && filteredUsers.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 top-full mt-1 w-full bg-[#1a4d3e] border border-[#C9A962]/30 rounded-lg shadow-xl overflow-hidden"
                          >
                            {filteredUsers.map(user => (
                              <button
                                key={user.id}
                                onClick={() => selectUser(user)}
                                className="w-full px-4 py-3 text-right hover:bg-[#C9A962]/20 transition-colors flex items-center gap-3 border-b border-white/10 last:border-0"
                              >
                                <div className="w-8 h-8 bg-[#C9A962]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-[#C9A962]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white text-sm font-medium truncate">{user.email}</div>
                                  <div className="text-white/50 text-xs truncate">{user.displayName || user.firstName || 'ללא שם'}</div>
                                </div>
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Name & Phone */}
                    <input type="text" placeholder="שם *" value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-[#C9A962] focus:outline-none" />
                    <input type="tel" placeholder="טלפון" value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:border-[#C9A962] focus:outline-none" />
                    
                    {/* User linked indicator */}
                    {customer.userId && (
                      <div className="flex items-center gap-2 text-green-400 text-xs bg-green-500/10 px-3 py-2 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span>מקושר למשתמש ב-DB: {customer.userId.slice(0, 8)}...</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-white/80 text-sm font-medium"><Package className="w-4 h-4 text-[#C9A962]" />פריטים</div>
                    {items.map(item => (
                      <div key={item.id} className="bg-white/5 rounded-lg p-3 space-y-2">
                        {/* Product Selector */}
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <select
                              value={item.productId}
                              onChange={e => selectProduct(item.id, e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A962] focus:outline-none appearance-none cursor-pointer"
                            >
                              <option value="" className="bg-[#1a4d3e]">בחר מוצר/שירות...</option>
                              <optgroup label="🦎 I4IGUANA" className="bg-[#1a4d3e]">
                                {PRODUCTS.filter(p => p.category === 'I4IGUANA').map(p => (
                                  <option key={p.id} value={p.id} className="bg-[#1a4d3e]">{p.name} - ₪{p.price}</option>
                                ))}
                              </optgroup>
                              <optgroup label="📚 FunnyDates" className="bg-[#1a4d3e]">
                                {PRODUCTS.filter(p => p.category === 'FunnyDates').map(p => (
                                  <option key={p.id} value={p.id} className="bg-[#1a4d3e]">{p.name} - ₪{p.price}</option>
                                ))}
                              </optgroup>
                              <optgroup label="💼 GO CIO" className="bg-[#1a4d3e]">
                                {PRODUCTS.filter(p => p.category === 'GO CIO').map(p => (
                                  <option key={p.id} value={p.id} className="bg-[#1a4d3e]">{p.name} - ₪{p.price.toLocaleString()}</option>
                                ))}
                              </optgroup>
                              <optgroup label="📝 אחר" className="bg-[#1a4d3e]">
                                {PRODUCTS.filter(p => p.category === 'אחר').map(p => (
                                  <option key={p.id} value={p.id} className="bg-[#1a4d3e]">{p.name}</option>
                                ))}
                              </optgroup>
                            </select>
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                          </div>
                          {items.length > 1 && <button onClick={() => removeItem(item.id)} className="text-red-400 p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                        
                        {/* Custom description if selected "custom" or editable */}
                        {(item.productId === 'custom' || item.description) && (
                          <input 
                            type="text" 
                            placeholder="תיאור מותאם אישית" 
                            value={item.description} 
                            onChange={e => updateItem(item.id, 'description', e.target.value)} 
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:border-[#C9A962] focus:outline-none" 
                          />
                        )}
                        
                        {/* Quantity & Price */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-white/40 text-xs">כמות</label>
                            <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-[#C9A962] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs">מחיר ₪</label>
                            <input type="number" min="0" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-[#C9A962] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs">סה״כ</label>
                            <div className="bg-[#C9A962]/20 border border-[#C9A962]/40 rounded-lg px-3 py-2 text-[#C9A962] text-sm font-bold text-center">₪{item.total.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-white/20 rounded-lg text-white/60 hover:border-[#C9A962] hover:text-[#C9A962] flex items-center justify-center gap-2"><Plus className="w-4 h-4" />הוסף פריט</button>
                  </div>

                  <div className="bg-gradient-to-r from-[#C9A962] to-[#B8963D] rounded-xl p-4 flex justify-between items-center">
                    <span className="text-[#1A4D3E] font-medium">סה״כ:</span>
                    <span className="text-[#1A4D3E] text-3xl font-bold">₪{total.toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => saveInvoice('draft')} disabled={saving} className="flex flex-col items-center justify-center gap-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50"><Save className="w-5 h-5" /><span className="text-xs">שמור</span></button>
                    <button onClick={() => printInv()} className="flex flex-col items-center justify-center gap-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"><Printer className="w-5 h-5" /><span className="text-xs">הדפס</span></button>
                    <button onClick={() => sendEmail()} disabled={saving} className="flex flex-col items-center justify-center gap-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl disabled:opacity-50"><Mail className="w-5 h-5" /><span className="text-xs">מייל</span></button>
                    <button onClick={() => sendWhatsApp()} disabled={saving} className="flex flex-col items-center justify-center gap-1 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl disabled:opacity-50"><MessageCircle className="w-5 h-5" /><span className="text-xs">וואטס</span></button>
                  </div>

                  {/* 🎫 Coupon Generation Section - Only for I4IGUANA products */}
                  {(items.some(item => PRODUCTS.find(p => p.id === item.productId && 'couponType' in p)) || savedInvoice) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-purple-300 font-medium">
                        <Ticket className="w-5 h-5" />
                        <span>🎫 הפקת קופון Premium</span>
                      </div>

                      {!savedInvoice ? (
                        // Step 1: Save invoice first
                        <div className="space-y-3">
                          <p className="text-white/60 text-sm">
                            שמור את החשבונית תחילה כדי להפיק קופון מותאם
                          </p>
                          <button
                            onClick={saveAndPrepareCoupon}
                            disabled={saving || !customer.name}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                          >
                            <Save className="w-5 h-5" />
                            שמור והכן קופון
                          </button>
                        </div>
                      ) : !generatedCoupon ? (
                        // Step 2: Generate coupon
                        <div className="space-y-3">
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-white/60 text-xs mb-1">חשבונית נשמרה!</div>
                            <div className="text-white font-medium">#{savedInvoice.invoiceNumber} - {savedInvoice.customer.name}</div>
                            <div className="text-purple-300 text-sm mt-1">
                              {items.find(item => PRODUCTS.find(p => p.id === item.productId && 'couponType' in p))?.description}
                            </div>
                          </div>
                          <button
                            onClick={() => createCouponForInvoice(savedInvoice)}
                            disabled={generatingCoupon}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-[#1A4D3E] font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                          >
                            {generatingCoupon ? (
                              <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                מייצר קופון...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5" />
                                🎫 הפק קופון עכשיו
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        // Step 3: Coupon generated - send it
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 rounded-lg p-4 text-center">
                            <div className="text-amber-400/60 text-xs mb-2">🎫 הקופון שלך</div>
                            <div className="text-amber-400 text-2xl font-mono font-bold tracking-wider mb-2">
                              {generatedCoupon}
                            </div>
                            <div className="text-white/60 text-xs">
                              {COUPON_LABELS[getCouponTypeFromInvoice(savedInvoice) || ''] || 'Premium'}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => copyCoupon(generatedCoupon)}
                              className="py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center gap-2 text-sm"
                            >
                              <Copy className="w-4 h-4" />
                              העתק
                            </button>
                            <button
                              onClick={() => sendCouponWhatsApp(savedInvoice, generatedCoupon)}
                              className={`py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all ${
                                couponSent 
                                  ? 'bg-green-500/30 text-green-400' 
                                  : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                              }`}
                            >
                              {couponSent ? (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  נשלח!
                                </>
                              ) : (
                                <>
                                  <MessageCircle className="w-4 h-4" />
                                  שלח בוואטס
                                </>
                              )}
                            </button>
                          </div>

                          <button
                            onClick={resetCouponState}
                            className="w-full py-2 text-white/40 hover:text-white/60 text-sm"
                          >
                            ✨ חשבונית חדשה
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Mobile: History Tab */}
              {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lg:hidden space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><input type="text" placeholder="חיפוש..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 pr-9 text-white text-sm placeholder-white/40 focus:border-[#C9A962] focus:outline-none" /></div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-[#C9A962] focus:outline-none"><option value="all">הכל</option><option value="draft">טיוטה</option><option value="sent">נשלח</option><option value="paid">שולם</option></select>
                  </div>
                  <InvoiceList />
                </motion.div>
              )}

              {/* Mobile: Summary Tab */}
              {activeTab === 'summary' && (
                <motion.div key="summary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lg:hidden space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-[#C9A962] to-[#B8963D] rounded-xl p-4 text-center"><div className="text-[#1A4D3E]/60 text-xs">הכנסות {year}</div><div className="text-[#1A4D3E] text-2xl font-bold">₪{yearTotal.toLocaleString()}</div></div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10"><div className="text-white/60 text-xs">שולם</div><div className="text-green-400 text-2xl font-bold">₪{paidTotal.toLocaleString()}</div></div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10"><div className="text-white/60 text-xs">חשבוניות</div><div className="text-white text-2xl font-bold">{yearly.length}</div></div>
                    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/10"><div className="text-white/60 text-xs">ממוצע</div><div className="text-white text-2xl font-bold">₪{yearly.length > 0 ? Math.round(yearTotal / yearly.length) : 0}</div></div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-[#C9A962] font-medium text-sm mb-3">חודשי {year}</h3>
                    <div className="space-y-2">
                      {['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'].map((m, i) => {
                        const t = yearly.filter(inv => new Date(inv.createdAt).getMonth() === i).reduce((s, x) => s + x.total, 0)
                        return <div key={i} className="flex items-center gap-2"><span className="w-8 text-white/50 text-xs">{m}</span><div className="flex-1 bg-white/10 rounded-full h-3"><div className="h-full bg-gradient-to-r from-[#C9A962] to-[#B8963D] rounded-full" style={{ width: `${yearTotal > 0 ? (t / yearTotal) * 100 : 0}%` }} /></div><span className="w-16 text-white text-xs text-left">₪{t}</span></div>
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile Invoice List Modal */}
      <AnimatePresence>
        {showMobileList && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 bg-black/80 z-50" onClick={() => setShowMobileList(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween' }} className="absolute right-0 top-0 bottom-0 w-80 bg-[#0d2920] border-l border-white/10" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-[#C9A962] font-bold">חשבוניות</h2>
                <button onClick={() => setShowMobileList(false)} className="text-white/60"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
                <InvoiceList />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
