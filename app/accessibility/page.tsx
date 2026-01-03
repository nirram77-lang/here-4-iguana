"use client"

import { motion } from 'framer-motion'
import { ArrowLeft, Accessibility, Mail, Phone, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AccessibilityStatementPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d2920] via-[#1a4d3e] to-[#0d2920]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            חזרה
          </Button>
          <div className="flex items-center gap-4">
            <Accessibility className="w-12 h-12 text-white" />
            <div>
              <h1 className="text-3xl font-black text-white">הצהרת נגישות</h1>
              <p className="text-white/80">I4IGUANA - אפליקציית היכרויות</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8" dir="rtl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-8"
        >
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">מחויבות לנגישות</h2>
            <p className="text-white/80 leading-relaxed">
              I4IGUANA מחויבת להבטיח שהאתר והאפליקציה שלנו יהיו נגישים לכל האנשים, 
              כולל אנשים עם מוגבלויות. אנו פועלים באופן מתמיד לשיפור הנגישות ולעמידה 
              בתקנים הבינלאומיים והישראליים.
            </p>
          </section>

          {/* Standards */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">תקן נגישות</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              אתר זה תואם לדרישות:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2">
              <li>תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013</li>
              <li>הנחיות WCAG 2.1 ברמה AA (Web Content Accessibility Guidelines)</li>
              <li>תקן ישראלי ת״י 5568</li>
            </ul>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">תכונות נגישות באתר</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'התאמת גודל טקסט', desc: 'אפשרות להגדיל או להקטין את גודל הטקסט' },
                { title: 'ניגודיות גבוהה', desc: 'מצב תצוגה עם ניגודיות מוגברת' },
                { title: 'הדגשת קישורים', desc: 'הבלטה ויזואלית של קישורים ולחצנים' },
                { title: 'סמן מוגדל', desc: 'הגדלת סמן העכבר לנראות טובה יותר' },
                { title: 'עצירת אנימציות', desc: 'אפשרות לעצור אנימציות ותנועות' },
                { title: 'גופן קריא', desc: 'החלפה לגופן ברור וקריא יותר' },
                { title: 'ריווח טקסט', desc: 'הגדלת המרווחים בין שורות ומילים' },
                { title: 'ניווט מקלדת', desc: 'תמיכה מלאה בניווט באמצעות מקלדת' },
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-xl">
                  <h3 className="text-white font-bold mb-1">{feature.title}</h3>
                  <p className="text-white/60 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How to Use */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">כיצד להשתמש בתפריט הנגישות</h2>
            <ol className="list-decimal list-inside text-white/80 space-y-2">
              <li>לחצו על כפתור הנגישות (♿) בפינה השמאלית התחתונה של המסך</li>
              <li>בחרו את ההגדרות המתאימות לכם מתוך התפריט</li>
              <li>ההגדרות יישמרו אוטומטית ויחולו בביקורים הבאים</li>
              <li>ניתן לאפס את כל ההגדרות בכל עת באמצעות כפתור "איפוס הגדרות"</li>
            </ol>
          </section>

          {/* Keyboard Navigation */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">ניווט באמצעות מקלדת</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              ניתן לנווט באתר באמצעות המקלדת:
            </p>
            <div className="bg-white/5 p-4 rounded-xl space-y-2">
              <p className="text-white"><kbd className="bg-white/20 px-2 py-1 rounded">Tab</kbd> - מעבר לאלמנט הבא</p>
              <p className="text-white"><kbd className="bg-white/20 px-2 py-1 rounded">Shift + Tab</kbd> - מעבר לאלמנט הקודם</p>
              <p className="text-white"><kbd className="bg-white/20 px-2 py-1 rounded">Enter</kbd> - הפעלת קישור או לחצן</p>
              <p className="text-white"><kbd className="bg-white/20 px-2 py-1 rounded">Esc</kbd> - סגירת חלונות קופצים</p>
            </div>
          </section>

          {/* Browsers */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">דפדפנים נתמכים</h2>
            <p className="text-white/80 leading-relaxed">
              האתר נבדק ותואם לדפדפנים הבאים בגרסאותיהם העדכניות:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-1 mt-2">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Safari</li>
              <li>Microsoft Edge</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">יצירת קשר בנושא נגישות</h2>
            <p className="text-white/80 leading-relaxed mb-4">
              אם נתקלתם בבעיית נגישות או שיש לכם הצעות לשיפור, נשמח לשמוע מכם:
            </p>
            <div className="bg-gradient-to-r from-[#4ade80]/20 to-[#22c55e]/20 border border-[#4ade80]/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-[#4ade80]" />
                <div>
                  <p className="text-white/60 text-sm">דוא״ל</p>
                  <a href="mailto:accessibility@i4iguana.com" className="text-[#4ade80] hover:underline">
                    accessibility@i4iguana.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-[#4ade80]" />
                <div>
                  <p className="text-white/60 text-sm">טלפון</p>
                  <a href="tel:+972522653170" className="text-[#4ade80] hover:underline">
                    052-265-3170
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Coordinator */}
          <section>
            <h2 className="text-2xl font-bold text-[#4ade80] mb-4">רכז נגישות</h2>
            <div className="bg-white/5 p-4 rounded-xl">
              <p className="text-white font-bold">I4IGUANA Ltd.</p>
              <p className="text-white/60">רכז נגישות: צוות I4IGUANA</p>
              <p className="text-white/60">דוא״ל: accessibility@i4iguana.com</p>
            </div>
          </section>

          {/* Last Update */}
          <section className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 text-white/60">
              <Calendar className="w-5 h-5" />
              <span>הצהרת נגישות זו עודכנה לאחרונה בתאריך: דצמבר 2025</span>
            </div>
          </section>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm">
          <p>♿ I4IGUANA - מחויבים לנגישות לכולם</p>
        </div>
      </div>
    </div>
  )
}
