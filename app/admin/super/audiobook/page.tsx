"use client"

/**
 * 🎧 NO-ART GALLERY - Audiobook Production Panel
 * Hollywood Edition - Order Management + Production Tools
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Headphones, Package, User, Mail, Phone, Copy, CheckCircle, 
  Clock, DollarSign, FileText, MessageCircle, Loader2, 
  RefreshCw, Home, ChevronLeft, Play, Download, Sparkles, 
  Trash2, Eye, Send, Terminal, Music, BookOpen, Upload, Cloud, Link, ExternalLink
} from 'lucide-react'
import { db, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, Timestamp, where } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

// Types
interface AudiobookOrder {
  id?: string
  orderId?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: string
  customerCity?: string
  customerZipcode?: string
  basePrice?: number
  finalPrice?: number
  price?: number // legacy
  discountCode?: string
  discountPercent?: number
  couponCode?: string // legacy
  discount?: number // legacy
  product?: string
  productName?: string
  paymentMethod?: string
  bitPayerPhone?: string
  status: 'pending' | 'paid' | 'producing' | 'sent' | 'completed'
  createdAt: Date
  paidAt?: Date
  sentAt?: Date
  invoiceId?: string
  notes?: string
  source?: string
  downloadUrl?: string // 🎧 Cloud download link
  downloadCount?: number // 📊 How many times downloaded
  uploadedAt?: Date // ⏰ When file was uploaded
}

export default function AudiobookAdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<AudiobookOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<AudiobookOrder | null>(null)
  const [copied, setCopied] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // 🌍 Language filter: 'all' | 'he' | 'en'
  const [langFilter, setLangFilter] = useState<'all' | 'he' | 'en'>('all')
  
  // New order form
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [newOrder, setNewOrder] = useState({ name: '', email: '', phone: '', price: 69, lang: 'he' as 'he' | 'en' })
  
  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  useEffect(() => { loadOrders() }, [])

  // Helper: Parse date from Timestamp OR String (backwards compatible)
  const parseDate = (val: any): Date => {
    if (!val) return new Date()
    if (typeof val === 'string') return new Date(val)
    if (val.toDate) return val.toDate()
    if (val.seconds) return new Date(val.seconds * 1000) // Firestore Timestamp object
    return new Date()
  }
  
  // Helper: Detect language from order
  const getOrderLang = (order: AudiobookOrder): 'he' | 'en' => {
    if (order.product === 'audiobook-en') return 'en'
    if (order.product === 'audiobook-he') return 'he'
    if (order.source?.includes('.com')) return 'en'
    if (order.source?.includes('.co.il')) return 'he'
    return 'he' // Default to Hebrew
  }
  
  // Filter orders by language
  const filteredOrders = langFilter === 'all' 
    ? orders 
    : orders.filter(o => getOrderLang(o) === langFilter)

  const loadOrders = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'audiobook_orders'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const list: AudiobookOrder[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        list.push({
          id: doc.id,
          ...data,
          createdAt: parseDate(data.createdAt),
          paidAt: data.paidAt ? parseDate(data.paidAt) : undefined,
          sentAt: data.sentAt ? parseDate(data.sentAt) : undefined
        } as AudiobookOrder)
      })
      setOrders(list)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate PowerShell command for audiobook creation
  const generateCommand = (order: AudiobookOrder) => {
    const name = order.customerName
    const email = order.customerEmail
    const lang = getOrderLang(order)
    
    if (lang === 'en') {
      // English audiobook path
      return `cd "C:\\XTTS\\LoveBites_Audiobook"
.\\create_audiobook_en.bat "${name}" "${email}"`
    } else {
      // Hebrew audiobook path
      return `cd "C:\\audiobook\\audiobook_final"
.\\create_audiobook.bat "${name}" "${email}"`
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  // Update order status
  const updateStatus = async (orderId: string, status: AudiobookOrder['status']) => {
    try {
      const updates: any = { status }
      if (status === 'paid') updates.paidAt = Timestamp.now()
      if (status === 'sent') updates.sentAt = Timestamp.now()
      
      await updateDoc(doc(db, 'audiobook_orders', orderId), updates)
      await loadOrders()
      setSuccessMessage('סטטוס עודכן!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('למחוק הזמנה זו?')) return
    try {
      await deleteDoc(doc(db, 'audiobook_orders', orderId))
      await loadOrders()
      setSelectedOrder(null)
      setSuccessMessage('נמחק!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (error) {
      console.error('Error deleting order:', error)
    }
  }

  // Add new order manually
  const addNewOrder = async () => {
    if (!newOrder.name || !newOrder.email) {
      alert('נא למלא שם ומייל / Please fill name and email')
      return
    }
    try {
      await addDoc(collection(db, 'audiobook_orders'), {
        customerName: newOrder.name,
        customerEmail: newOrder.email,
        customerPhone: newOrder.phone || '',
        price: newOrder.price,
        product: newOrder.lang === 'en' ? 'audiobook-en' : 'audiobook-he',
        source: newOrder.lang === 'en' ? 'funnydates101.com' : 'funnydates101.co.il',
        status: 'pending',
        createdAt: Timestamp.now()
      })
      await loadOrders()
      setNewOrder({ name: '', email: '', phone: '', price: 69, lang: 'he' })
      setShowNewOrder(false)
      setSuccessMessage('הזמנה נוספה! / Order added!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (error) {
      console.error('Error adding order:', error)
    }
  }

  // Send via WhatsApp
  const sendWhatsApp = (order: AudiobookOrder) => {
    const phone = order.customerPhone?.replace(/\D/g, '')
    if (!phone) { alert('אין טלפון / No phone'); return }
    
    // Use our download page URL (with counter) instead of direct Firebase URL
    const downloadPageUrl = `https://i4iguana.com/download/audiobook/${order.id}`
    const lang = getOrderLang(order)
    
    let msg = ''
    
    if (lang === 'en') {
      // English message
      msg = `🎧 *Love Bites: 101 Dating Disasters - Audiobook*\n\n` +
        `Hi ${order.customerName}! 👋\n\n` +
        `Thank you for your purchase! 💚\n\n` +
        `Your personalized audiobook is ready!\n\n`
      
      if (order.downloadUrl) {
        msg += `📥 *Download link:*\n${downloadPageUrl}\n\n`
      } else {
        msg += `📧 Will be sent to: ${order.customerEmail}\n\n`
      }
      
      msg += `Enjoy listening! 🎧✨\n\n` +
        `Nir Ram | NO-ART GALLERY`
    } else {
      // Hebrew message
      msg = `🎧 *101 דייטים ואף נשיכה - אודיובוק*\n\n` +
        `היי ${order.customerName}! 👋\n\n` +
        `תודה על הרכישה! 💚\n\n` +
        `האודיובוק המותאם אישית שלך מוכן!\n\n`
      
      if (order.downloadUrl) {
        msg += `📥 *לינק להורדה:*\n${downloadPageUrl}\n\n`
      } else {
        msg += `📧 נשלח אליך למייל: ${order.customerEmail}\n\n`
      }
      
      msg += `תהנה מההאזנה! 🎧✨\n\n` +
        `ניר רם | NO-ART GALLERY`
    }
    
    const p = phone.startsWith('0') ? `972${phone.slice(1)}` : phone
    window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Open invoice page with pre-filled data
  const openInvoice = (order: AudiobookOrder) => {
    const lang = getOrderLang(order)
    const params = new URLSearchParams({
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone || '',
      product: lang === 'en' ? 'audiobook-en' : 'audiobook-he',
      price: String(order.finalPrice || order.price || (lang === 'en' ? 19.90 : 69))
    })
    window.open(`/admin/super/invoices?${params.toString()}`, '_blank')
  }

  // 🎧 Upload audiobook to Firebase Storage
  const uploadAudiobook = async (order: AudiobookOrder, file: File) => {
    if (!order.id) return
    
    try {
      setUploading(true)
      setUploadProgress('מעלה לענן...')
      
      // Create unique filename with order ID and customer name
      const safeName = order.customerName.replace(/[^a-zA-Zא-ת0-9]/g, '_')
      const fileName = `audiobooks/${order.orderId || order.id}_${safeName}.mp3`
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, fileName)
      setUploadProgress('מעלה קובץ...')
      await uploadBytes(storageRef, file)
      
      // Get download URL
      setUploadProgress('מקבל לינק...')
      const downloadUrl = await getDownloadURL(storageRef)
      
      // Update order with download URL, uploadedAt, and reset download count
      setUploadProgress('שומר...')
      await updateDoc(doc(db, 'audiobook_orders', order.id), {
        downloadUrl: downloadUrl,
        uploadedAt: Timestamp.now(),
        downloadCount: 0, // Reset counter on new upload
        status: 'producing'
      })
      
      // Reload orders
      await loadOrders()
      
      // Update selected order
      setSelectedOrder(prev => prev ? { ...prev, downloadUrl, downloadCount: 0, status: 'producing' } : null)
      
      setSuccessMessage('✅ הועלה בהצלחה!')
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('שגיאה בהעלאה: ' + (error as Error).message)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  // 🔄 Reset download count
  const resetDownloadCount = async (order: AudiobookOrder) => {
    if (!order.id) return
    
    try {
      await updateDoc(doc(db, 'audiobook_orders', order.id), {
        downloadCount: 0
      })
      
      await loadOrders()
      setSelectedOrder(prev => prev ? { ...prev, downloadCount: 0 } : null)
      setSuccessMessage('✅ מונה הורדות אופס!')
      setTimeout(() => setSuccessMessage(''), 2000)
    } catch (error) {
      console.error('Reset error:', error)
    }
  }

  // Handle file selection
  const handleFileSelect = (order: AudiobookOrder) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'audio/*,.mp3,.m4a,.wav'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        uploadAudiobook(order, file)
      }
    }
    input.click()
  }

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    paid: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    producing: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    sent: 'bg-green-500/20 text-green-400 border-green-500/40',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  }

  const statusLabels = {
    pending: 'ממתין לאימות',
    paid: 'שולם',
    producing: 'בהפקה',
    sent: 'נשלח',
    completed: 'הושלם'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-red-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/admin/super')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-red-400">הפקת אודיובוק</h1>
              <p className="text-xs text-gray-400">101 דייטים ואף נשיכה</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            חזרה
          </button>
        </div>
      </header>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg"
          >
            ✓ {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 🌍 Language Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLangFilter('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              langFilter === 'all' 
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            🌍 All ({orders.length})
          </button>
          <button
            onClick={() => setLangFilter('he')}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              langFilter === 'he' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            🇮🇱 עברית ({orders.filter(o => getOrderLang(o) === 'he').length})
          </button>
          <button
            onClick={() => setLangFilter('en')}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              langFilter === 'en' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            🇺🇸 English ({orders.filter(o => getOrderLang(o) === 'en').length})
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">{filteredOrders.filter(o => o.status === 'pending').length}</div>
            <div className="text-xs text-yellow-400/60">ממתינים / Pending</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">{filteredOrders.filter(o => o.status === 'paid').length}</div>
            <div className="text-xs text-blue-400/60">שולמו / Paid</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
            <Music className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">{filteredOrders.filter(o => o.status === 'producing').length}</div>
            <div className="text-xs text-purple-400/60">בהפקה / Producing</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">{filteredOrders.filter(o => o.status === 'sent' || o.status === 'completed').length}</div>
            <div className="text-xs text-green-400/60">נשלחו / Sent</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowNewOrder(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            הזמנה חדשה
          </button>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            רענן
          </button>
        </div>

        {/* New Order Modal */}
        <AnimatePresence>
          {showNewOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowNewOrder(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-red-500/30 rounded-2xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  הזמנה חדשה / New Order
                </h3>
                <div className="space-y-4">
                  {/* Language Selection */}
                  <div>
                    <label className="text-white/60 text-sm">שפה / Language *</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, lang: 'he', price: 69 })}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          newOrder.lang === 'he' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        🇮🇱 עברית
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, lang: 'en', price: 19.90 })}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          newOrder.lang === 'en' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        🇺🇸 English
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">שם הלקוח / Customer Name *</label>
                    <input
                      type="text"
                      value={newOrder.name}
                      onChange={e => setNewOrder({ ...newOrder, name: e.target.value })}
                      placeholder={newOrder.lang === 'en' ? "John Doe" : "ישראל ישראלי"}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mt-1 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">מייל / Email *</label>
                    <input
                      type="email"
                      value={newOrder.email}
                      onChange={e => setNewOrder({ ...newOrder, email: e.target.value })}
                      placeholder="email@gmail.com"
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mt-1 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">טלפון / Phone</label>
                    <input
                      type="tel"
                      value={newOrder.phone}
                      onChange={e => setNewOrder({ ...newOrder, phone: e.target.value })}
                      placeholder={newOrder.lang === 'en' ? "+1-555-0000" : "050-0000000"}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mt-1 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm">מחיר / Price {newOrder.lang === 'en' ? '$' : '₪'}</label>
                    <input
                      type="number"
                      value={newOrder.price}
                      onChange={e => setNewOrder({ ...newOrder, price: parseFloat(e.target.value) || (newOrder.lang === 'en' ? 19.90 : 69) })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mt-1 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowNewOrder(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl"
                    >
                      ביטול / Cancel
                    </button>
                    <button
                      onClick={addNewOrder}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl"
                    >
                      הוסף / Add
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white/80 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-400" />
              הזמנות / Orders ({filteredOrders.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <Headphones className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין הזמנות עדיין / No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => (
                  <motion.button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-right p-4 rounded-xl border transition-all ${
                      selectedOrder?.id === order.id 
                        ? 'bg-red-500/20 border-red-500/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                        {/* Language Badge */}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          getOrderLang(order) === 'en' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {getOrderLang(order) === 'en' ? '🇺🇸' : '🇮🇱'}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs">
                        {new Date(order.createdAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    <div className="text-white font-medium">{order.customerName}</div>
                    <div className="text-white/50 text-sm truncate">{order.customerEmail}</div>
                    <div className="text-red-400 font-bold mt-1">
                      {getOrderLang(order) === 'en' ? '$' : '₪'}{order.finalPrice || order.price || (getOrderLang(order) === 'en' ? 19.90 : 69)}
                    </div>
                    {order.orderId && (
                      <div className="text-white/30 text-xs mt-1">#{order.orderId}</div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Order Details */}
          <div>
            {selectedOrder ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-red-500/30 rounded-2xl p-6 sticky top-24"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-red-400">
                      {getOrderLang(selectedOrder) === 'en' ? 'Order Details' : 'פרטי הזמנה'}
                    </h3>
                    {/* Language Badge */}
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      getOrderLang(selectedOrder) === 'en' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {getOrderLang(selectedOrder) === 'en' ? '🇺🇸 English' : '🇮🇱 עברית'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteOrder(selectedOrder.id!)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Customer Info */}
                <div className="space-y-3 mb-6">
                  {selectedOrder.orderId && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg border border-amber-500/30">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <div className="flex-1">
                        <div className="text-amber-400 font-bold">{selectedOrder.orderId}</div>
                        <div className="text-white/50 text-xs">מספר הזמנה</div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(selectedOrder.orderId!, 'orderId')}
                        className="p-2 hover:bg-white/10 rounded"
                      >
                        {copied === 'orderId' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <User className="w-5 h-5 text-red-400" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{selectedOrder.customerName}</div>
                      <div className="text-white/50 text-xs">לקוח</div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(selectedOrder.customerName, 'name')}
                      className="p-2 hover:bg-white/10 rounded"
                    >
                      {copied === 'name' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <Mail className="w-5 h-5 text-red-400" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{selectedOrder.customerEmail}</div>
                      <div className="text-white/50 text-xs">מייל</div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(selectedOrder.customerEmail, 'email')}
                      className="p-2 hover:bg-white/10 rounded"
                    >
                      {copied === 'email' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/40" />}
                    </button>
                  </div>

                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <Phone className="w-5 h-5 text-red-400" />
                      <div className="flex-1">
                        <div className="text-white font-medium">{selectedOrder.customerPhone}</div>
                        <div className="text-white/50 text-xs">טלפון לקוח</div>
                      </div>
                      <a 
                        href={`https://wa.me/972${selectedOrder.customerPhone.replace(/\D/g, '').replace(/^0/, '')}`}
                        target="_blank"
                        className="p-2 hover:bg-green-500/20 rounded text-green-400"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {selectedOrder.bitPayerPhone && (
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <Phone className="w-5 h-5 text-purple-400" />
                      <div className="flex-1">
                        <div className="text-white font-medium">{selectedOrder.bitPayerPhone}</div>
                        <div className="text-purple-400 text-xs">📱 טלפון Bit (לאימות)</div>
                      </div>
                    </div>
                  )}

                  {selectedOrder.customerAddress && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <Home className="w-5 h-5 text-red-400" />
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {selectedOrder.customerAddress}, {selectedOrder.customerCity} {selectedOrder.customerZipcode}
                        </div>
                        <div className="text-white/50 text-xs">כתובת</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-lg border border-red-500/30">
                    <DollarSign className="w-5 h-5 text-red-400" />
                    <div className="flex-1">
                      <div className="text-red-400 font-bold text-xl">₪{selectedOrder.finalPrice || selectedOrder.price || 69}</div>
                      <div className="text-white/50 text-xs">
                        מחיר סופי
                        {selectedOrder.discountCode && (
                          <span className="text-green-400 mr-2">
                            (הנחה: {selectedOrder.discountCode} -{selectedOrder.discountPercent}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div className="mb-6">
                  <label className="text-white/60 text-sm mb-2 block">עדכון סטטוס</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pending', 'paid', 'producing', 'sent', 'completed'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedOrder.id!, status)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                          selectedOrder.status === status 
                            ? statusColors[status] 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Production Command */}
                <div className="mb-6">
                  <label className="text-white/60 text-sm mb-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    פקודת הפקה (PowerShell)
                  </label>
                  <div className="bg-black/50 rounded-lg p-3 font-mono text-sm text-green-400 relative">
                    <pre className="whitespace-pre-wrap break-all">{generateCommand(selectedOrder)}</pre>
                    <button
                      onClick={() => copyToClipboard(generateCommand(selectedOrder), 'cmd')}
                      className="absolute top-2 left-2 p-2 bg-white/10 hover:bg-white/20 rounded"
                    >
                      {copied === 'cmd' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ☁️ Cloud Upload Section */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/30">
                  <label className="text-white/80 text-sm mb-3 flex items-center gap-2 font-medium">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    העלאה לענן
                  </label>
                  
                  {selectedOrder.downloadUrl ? (
                    // Already uploaded - show link + download counter
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>הקובץ הועלה בהצלחה!</span>
                        </div>
                        {/* Download Counter */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          (selectedOrder.downloadCount || 0) >= 3 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          📥 {selectedOrder.downloadCount || 0}/3
                        </div>
                      </div>
                      
                      {/* Download Page Link (for customers) */}
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-white/50 text-xs mb-1">לינק ללקוח:</div>
                        <div className="flex items-center gap-2">
                          <Link className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          <input 
                            type="text" 
                            value={`https://i4iguana.com/download/audiobook/${selectedOrder.id}`} 
                            readOnly 
                            className="bg-transparent text-blue-300 text-xs flex-1 outline-none truncate"
                          />
                          <button
                            onClick={() => copyToClipboard(`https://i4iguana.com/download/audiobook/${selectedOrder.id}`, 'download-link')}
                            className="p-1.5 hover:bg-white/10 rounded"
                          >
                            {copied === 'download-link' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/50" />}
                          </button>
                        </div>
                      </div>

                      {/* Direct Firebase Link (for admin) */}
                      <div className="bg-black/20 rounded-lg p-2 text-xs">
                        <div className="text-white/40 mb-1">קובץ בענן:</div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={selectedOrder.downloadUrl} 
                            readOnly 
                            className="bg-transparent text-white/40 text-xs flex-1 outline-none truncate"
                          />
                          <a 
                            href={selectedOrder.downloadUrl} 
                            target="_blank" 
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <ExternalLink className="w-3 h-3 text-white/40" />
                          </a>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFileSelect(selectedOrder)}
                          disabled={uploading}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-sm flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          החלף קובץ
                        </button>
                        {(selectedOrder.downloadCount || 0) > 0 && (
                          <button
                            onClick={() => resetDownloadCount(selectedOrder)}
                            className="py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm flex items-center justify-center gap-2"
                            title="איפוס מונה הורדות"
                          >
                            <RefreshCw className="w-4 h-4" />
                            אפס מונה
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Not uploaded yet - show upload button
                    <button
                      onClick={() => handleFileSelect(selectedOrder)}
                      disabled={uploading}
                      className="w-full py-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 rounded-xl flex items-center justify-center gap-3 font-medium border border-blue-500/30 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {uploadProgress || 'מעלה...'}
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          בחר קובץ והעלה לענן
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openInvoice(selectedOrder)}
                    className="py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl flex items-center justify-center gap-2 font-medium"
                  >
                    <FileText className="w-5 h-5" />
                    הפק חשבונית
                  </button>
                  <button
                    onClick={() => sendWhatsApp(selectedOrder)}
                    disabled={!selectedOrder.customerPhone}
                    className="py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    <MessageCircle className="w-5 h-5" />
                    וואטסאפ
                  </button>
                </div>

                {/* Production Steps */}
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-white/80 font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    שלבי הפקה
                  </h4>
                  <ol className="space-y-2 text-sm">
                    <li className={`flex items-center gap-2 ${selectedOrder.status !== 'pending' ? 'text-green-400' : 'text-white/40'}`}>
                      {selectedOrder.status !== 'pending' ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">1</span>}
                      קבלת תשלום
                    </li>
                    <li className={`flex items-center gap-2 ${selectedOrder.invoiceId ? 'text-green-400' : 'text-white/40'}`}>
                      {selectedOrder.invoiceId ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">2</span>}
                      הפקת חשבונית
                    </li>
                    <li className={`flex items-center gap-2 ${selectedOrder.status === 'producing' || selectedOrder.status === 'sent' || selectedOrder.status === 'completed' ? 'text-green-400' : 'text-white/40'}`}>
                      {selectedOrder.status === 'producing' || selectedOrder.status === 'sent' || selectedOrder.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">3</span>}
                      הרצת פקודת הפקה
                    </li>
                    <li className={`flex items-center gap-2 ${selectedOrder.downloadUrl ? 'text-green-400' : 'text-white/40'}`}>
                      {selectedOrder.downloadUrl ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">4</span>}
                      העלאה לענן ☁️
                    </li>
                    <li className={`flex items-center gap-2 ${selectedOrder.status === 'sent' || selectedOrder.status === 'completed' ? 'text-green-400' : 'text-white/40'}`}>
                      {selectedOrder.status === 'sent' || selectedOrder.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">5</span>}
                      שליחה ללקוח
                    </li>
                  </ol>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Headphones className="w-16 h-16 text-red-400/30 mx-auto mb-4" />
                <p className="text-white/40">בחר הזמנה לצפייה בפרטים</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
