"use client"

/**
 * 🎯 Mission Control - Kanban Board
 * 
 * Shared task board for Nir & Claude collaboration
 * 
 * FEATURES:
 * - 3 columns: Tasks, In Progress, Done
 * - Drag & Drop between columns
 * - Color-coded by project
 * - Priority levels
 * - Firebase persistence
 * 
 * v1.0.0 - Initial release
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Plus,
  X,
  GripVertical,
  Trash2,
  Edit2,
  Save,
  Calendar,
  Flag,
  ChevronRight,
  Home,
  ClipboardList,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore'

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL TASKS DATA
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_TASKS = [
  // 🦎 I4IGUANA
  { title: 'QA Iguana Agent - לבדוק ולשפר', description: 'לוודא שהסוכן עובד, משפר דוחות, בודק SSL/Uptime/Links', project: 'i4iguana' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'סביבת פיתוח נפרדת (Staging)', description: 'Firebase Dev + Vercel Preview + env files', project: 'i4iguana' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'ספק תשלומים ישראלי', description: 'CardCom או PayPlus - לבחור ולאינטגרציה', project: 'i4iguana' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'גיבוי קוד לענן', description: 'GitHub private repo או backup אוטומטי', project: 'i4iguana' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'Analytics לאפליקציה', description: 'לראות מה קורה - שימוש, המרות, זמני שיא', project: 'i4iguana' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'בדיקות E2E מקצה לקצה', description: 'Test Suite מלא לפני פיילוטים', project: 'i4iguana' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'פיילוט Trinity 31/01', description: 'הכנות, סטיקרים, QR, תיאום עם הבעלים', project: 'i4iguana' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'WhatsApp שיווק 200 איש דרום', description: 'קבוצת וואטסאפ משתמשים פוטנציאליים', project: 'i4iguana' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'Tango User Guide', description: 'מדריך למשתמשים חדשים', project: 'i4iguana' as const, priority: 'medium' as const, status: 'tasks' as const },
  // 📚 FUNNYDATES  
  { title: 'סליקה Verifone - אודיובוק', description: 'להוריד Coming Soon, לאפשר רכישה', project: 'funnydates' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'אודיובוק אנגלית', description: 'יצירת גרסה אנגלית של האודיובוק', project: 'funnydates' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'Watermark אישי לאודיובוק', description: 'הגנה על קבצי אודיו עם שם הרוכש', project: 'funnydates' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'YouTube תיקון הגדרות ערוץ', description: 'האלגוריתם לא תופס - מ-1.5K ל-20 צפיות', project: 'funnydates' as const, priority: 'high' as const, status: 'tasks' as const },
  // 🎨 NO ART GALLERY
  { title: 'Google Analytics - noartgallery.com', description: 'לחבר אנליטיקס לאתר הראשי', project: 'noartgallery' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'Google Ads - שובר 1,500₪', description: 'לטעון את השובר לחשבון גוגל', project: 'noartgallery' as const, priority: 'medium' as const, status: 'tasks' as const },
  // 📺 YOUTUBE OPTIMIZATION - IL
  { title: 'YouTube IL - לינקים בתיאור כל הסרטונים', description: 'להוסיף לינק לספר בתיאור של כל הסרטונים הקיימים', project: 'funnydates' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'YouTube IL - תגובות מוצמדות עם CTA', description: 'תגובה מוצמדת בכל סרטון עם לינק לרכישה', project: 'funnydates' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'YouTube IL - End Screens לכל הסרטונים', description: 'להוסיף End Screen עם לינק לערוץ ולספר', project: 'funnydates' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'YouTube IL - סרטון ארוך ראשון', description: 'קריאת פרק מהספר - 8-15 דקות לזמן צפייה', project: 'funnydates' as const, priority: 'medium' as const, status: 'tasks' as const },
  // 📺 YOUTUBE OPTIMIZATION - US
  { title: 'YouTube US - לינקים בתיאור כל הסרטונים', description: 'Add book link to all video descriptions', project: 'funnydates' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'YouTube US - תגובות מוצמדות עם CTA', description: 'Pinned comment with purchase link on all videos', project: 'funnydates' as const, priority: 'high' as const, status: 'tasks' as const },
  { title: 'YouTube US - End Screens לכל הסרטונים', description: 'Add End Screens with channel + book links', project: 'funnydates' as const, priority: 'medium' as const, status: 'tasks' as const },
  { title: 'YouTube US - First long video', description: 'Chapter reading - 8-15 min for watch time', project: 'funnydates' as const, priority: 'medium' as const, status: 'tasks' as const },
]

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Task {
  id: string
  title: string
  description?: string
  project: 'i4iguana' | 'funnydates' | 'noartgallery' | 'gocio' | 'general'
  priority: 'high' | 'medium' | 'low'
  status: 'tasks' | 'progress' | 'done'
  dueDate?: string
  createdAt: Date
  updatedAt: Date
}

type Column = 'tasks' | 'progress' | 'done'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const PROJECTS = {
  i4iguana: { label: 'I4IGUANA', color: 'bg-green-500', emoji: '🦎' },
  funnydates: { label: 'FunnyDates', color: 'bg-red-500', emoji: '📚' },
  noartgallery: { label: 'No Art Gallery', color: 'bg-purple-500', emoji: '🎨' },
  gocio: { label: 'GO CIO', color: 'bg-blue-500', emoji: '⚙️' },
  general: { label: 'כללי', color: 'bg-gray-500', emoji: '📋' }
}

const PRIORITIES = {
  high: { label: 'גבוהה', color: 'text-red-400', bg: 'bg-red-500/20' },
  medium: { label: 'בינונית', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  low: { label: 'נמוכה', color: 'text-green-400', bg: 'bg-green-500/20' }
}

const COLUMNS: { id: Column; title: string; icon: any; color: string }[] = [
  { id: 'tasks', title: '📝 Tasks', icon: Circle, color: 'border-gray-500' },
  { id: 'progress', title: '🔄 In Progress', icon: Clock, color: 'border-yellow-500' },
  { id: 'done', title: '✅ Done', icon: CheckCircle2, color: 'border-green-500' }
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MissionControlPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  
  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: 'general' as Task['project'],
    priority: 'medium' as Task['priority'],
    status: 'tasks' as Column,
    dueDate: ''
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // FIREBASE LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const q = query(collection(db, 'missionTasks'), orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = []
      snapshot.forEach((doc) => {
        tasksData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as Task)
      })
      setTasks(tasksData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ═══════════════════════════════════════════════════════════════════════════
  // TASK ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addTask = async () => {
    if (!newTask.title.trim()) return

    try {
      await addDoc(collection(db, 'missionTasks'), {
        ...newTask,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      setNewTask({
        title: '',
        description: '',
        project: 'general',
        priority: 'medium',
        status: 'tasks',
        dueDate: ''
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateDoc(doc(db, 'missionTasks', taskId), {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('למחוק את המשימה?')) return
    
    try {
      await deleteDoc(doc(db, 'missionTasks', taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const initTasks = async () => {
    if (!confirm('להוסיף את כל המשימות הראשוניות?')) return
    
    let added = 0
    for (const task of INITIAL_TASKS) {
      try {
        const q = query(collection(db, 'missionTasks'), where('title', '==', task.title))
        const existing = await getDocs(q)
        
        if (existing.empty) {
          await addDoc(collection(db, 'missionTasks'), {
            ...task,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          added++
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    alert(`נוספו ${added} משימות חדשות!`)
  }

  const moveTask = async (taskId: string, newStatus: Column) => {
    await updateTask(taskId, { status: newStatus })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAG & DROP
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (column: Column) => {
    if (draggedTask && draggedTask.status !== column) {
      await moveTask(draggedTask.id, column)
    }
    setDraggedTask(null)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const getTasksByColumn = (column: Column) => 
    tasks.filter(t => t.status === column)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-amber-500/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ClipboardList className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Mission Control
                </h1>
                <p className="text-xs text-gray-400">לוח משימות משותף • Nir & Claude</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {tasks.length === 0 && (
                <Button
                  onClick={initTasks}
                  variant="outline"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  טען משימות
                </Button>
              )}
              
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold"
              >
                <Plus className="w-4 h-4 ml-2" />
                משימה חדשה
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/admin/super')}
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Home className="w-4 h-4 ml-2" />
                חזרה
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Kanban Board */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((column) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
                className={`bg-[#111]/80 backdrop-blur-sm rounded-2xl border-2 ${column.color} border-opacity-30 p-4 min-h-[500px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    {column.title}
                  </h2>
                  <span className="px-2 py-1 bg-white/10 rounded-full text-sm">
                    {getTasksByColumn(column.id).length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {getTasksByColumn(column.id).map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        className={`bg-[#1a1a1a] rounded-xl p-4 cursor-grab active:cursor-grabbing border border-white/5 hover:border-amber-500/30 transition-all group ${
                          draggedTask?.id === task.id ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Task Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-lg ${PROJECTS[task.project].color} flex items-center justify-center text-xs`}>
                              {PROJECTS[task.project].emoji}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITIES[task.priority].bg} ${PRIORITIES[task.priority].color}`}>
                              {PRIORITIES[task.priority].label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Task Title */}
                        <h3 className="font-medium text-white mb-1">{task.title}</h3>
                        
                        {/* Task Description */}
                        {task.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                        )}

                        {/* Task Footer */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                          <span className="text-xs text-gray-500">
                            {PROJECTS[task.project].label}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Move Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                          {column.id !== 'tasks' && (
                            <button
                              onClick={() => moveTask(task.id, column.id === 'done' ? 'progress' : 'tasks')}
                              className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded transition-colors"
                            >
                              ← הקודם
                            </button>
                          )}
                          {column.id !== 'done' && (
                            <button
                              onClick={() => moveTask(task.id, column.id === 'tasks' ? 'progress' : 'done')}
                              className="text-xs px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded transition-colors mr-auto"
                            >
                              הבא →
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty State */}
                {getTasksByColumn(column.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">אין משימות</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md border border-amber-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-amber-400">משימה חדשה</h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">כותרת *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="מה צריך לעשות?"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">תיאור</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="פרטים נוספים..."
                    rows={3}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                {/* Project & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">פרויקט</label>
                    <select
                      value={newTask.project}
                      onChange={(e) => setNewTask({ ...newTask, project: e.target.value as Task['project'] })}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50"
                    >
                      {Object.entries(PROJECTS).map(([key, val]) => (
                        <option key={key} value={key}>{val.emoji} {val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">עדיפות</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50"
                    >
                      {Object.entries(PRIORITIES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">סטטוס התחלתי</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Column })}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">תאריך יעד</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1 border-white/10"
                >
                  ביטול
                </Button>
                <Button
                  onClick={addTask}
                  disabled={!newTask.title.trim()}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף משימה
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-600 border-t border-white/5">
        <p>Mission Control v1.0.0 • Made with 🦎 & 🤖</p>
      </footer>
    </div>
  )
}
