'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HebrewTermsOfService() {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      router.push('/he')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white" dir="rtl">
      {/* Header */}
      <nav className="bg-[#0a1f1a]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/he" className="flex items-center gap-3">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                I4IGUANA
              </span>
            </Link>
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              חזרה
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">תנאי שימוש</h1>
        <p className="text-gray-400 mb-12">עדכון אחרון: דצמבר 2024</p>

        <div className="prose prose-invert prose-green max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">1. קבלת התנאים</h2>
            <p className="text-gray-300 leading-relaxed">
              בגישה או שימוש באפליקציית I4IGUANA ("האפליקציה"), <strong className="text-white">הינך מסכים להיות מחויב לתנאי שימוש אלה</strong>.
              אם אינך מסכים לתנאים אלה, <strong className="text-white">אנא אל תשתמש באפליקציה</strong>. אנו שומרים לעצמנו את הזכות לשנות
              תנאים אלה בכל עת, והמשך השימוש שלך באפליקציה מהווה הסכמה לכל שינוי.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">2. כשירות</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-white">עליך להיות בן/בת 18 לפחות כדי להשתמש ב-I4IGUANA</strong>. בשימוש באפליקציה, הינך מצהיר ומתחייב
              שהינך בן/בת 18 לפחות ובעל/ת הכשירות המשפטית להתקשר בהסכם זה.
              אנו שומרים לעצמנו את הזכות לבקש הוכחת גיל בכל עת.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">3. רישום חשבון</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              לשימוש בתכונות מסוימות של האפליקציה, עליך להירשם לחשבון. הינך מסכים:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li>לספק מידע <strong className="text-white">מדויק, עדכני ומלא</strong></li>
              <li>לתחזק ולעדכן את המידע שלך כדי לשמור על דיוקו</li>
              <li>לשמור על אבטחת פרטי החשבון שלך</li>
              <li><strong className="text-white">לקבל אחריות על כל הפעילויות תחת החשבון שלך</strong></li>
              <li>להודיע לנו מיד על כל שימוש לא מורשה</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">4. התנהגות משתמשים</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">הינך מסכים לא:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li>להשתמש באפליקציה למטרה בלתי חוקית או בניגוד לחוקים</li>
              <li><strong className="text-white">להטריד, להתעלל או לפגוע במשתמשים אחרים</strong></li>
              <li>לפרסם תוכן שקרי, מטעה או מרמה</li>
              <li><strong className="text-white">להעלות תוכן לא הולם, פוגעני או מפורש</strong></li>
              <li>להתחזות לאדם או גוף אחר</li>
              <li>להשתמש במערכות אוטומטיות או בוטים לגישה לאפליקציה</li>
              <li>לנסות לקבל גישה לא מורשית למערכות שלנו</li>
              <li>להפריע לתפקוד התקין של האפליקציה</li>
              <li><strong className="text-white">לבקש מידע אישי מקטינים</strong></li>
              <li>להשתמש באפליקציה למטרות מסחריות ללא אישור</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">5. הנחיות בטיחות</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">הבטיחות שלך חשובה לנו.</strong> אנו ממליצים בחום:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li><strong className="text-white">להיפגש רק במקומות ציבוריים</strong></li>
              <li><strong className="text-white">ליידע חברים או משפחה על התוכניות שלך</strong></li>
              <li>לעולם לא לשתף מידע פיננסי עם משתמשים אחרים</li>
              <li>לדווח על התנהגות חשודה מיד</li>
              <li><strong className="text-white">לסמוך על האינסטינקטים שלך - אם משהו מרגיש לא בסדר, עזוב</strong></li>
            </ul>
            <p className="text-yellow-400 mt-4 text-sm font-semibold">
              ⚠️ I4IGUANA אינה אחראית להתנהגות של כל משתמש, בין אם באינטרנט או מחוצה לו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">6. שירותי מיקום</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA משתמשת בשירותי מיקום כדי לספק תכונות מבוססות קרבה. <strong className="text-white">בשימוש באפליקציה, הינך
              מסכים לאיסוף ושימוש בנתוני המיקום שלך</strong>. נתוני מיקום משמשים רק לחיבור בינך לבין
              משתמשים קרובים ולאימות צ'ק-אין במקומות. באפשרותך להשבית את שירותי המיקום
              בכל עת, אך הדבר עלול להגביל את הפונקציונליות של האפליקציה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">7. מנויים ותשלומים</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              חלק מהתכונות דורשות מנוי בתשלום. בהרשמה למנוי, הינך מסכים:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li>לשלם את כל העמלות הקשורות למנוי שלך</li>
              <li><strong className="text-white">לחידוש אוטומטי אלא אם בוטל לפני תאריך החידוש</strong></li>
              <li><strong className="text-white">אין החזרים עבור תקופות מנוי חלקיות</strong></li>
              <li>שינויי מחיר עם הודעה סבירה מראש</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">8. קניין רוחני</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-white">כל התוכן, התכונות והפונקציונליות של האפליקציה הם בבעלות I4IGUANA</strong> ומוגנים
              על ידי חוקי זכויות יוצרים, סימני מסחר וקניין רוחני בינלאומיים אחרים. אינך רשאי
              לשכפל, להפיץ, לשנות או ליצור יצירות נגזרות ללא אישור בכתב מאיתנו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">9. תוכן משתמשים</h2>
            <p className="text-gray-300 leading-relaxed">
              הינך שומר על הבעלות על תוכן שאתה מעלה לאפליקציה. עם זאת, בהעלאת תוכן, הינך
              מעניק ל-I4IGUANA רישיון לא בלעדי, עולמי, ללא תמלוגים להשתמש, להציג ולהפיץ
              את התוכן שלך בקשר לאפליקציה. <strong className="text-white">הינך האחראי הבלעדי לתוכן שלך</strong>
              ועליך להבטיח שאינו מפר חוקים או זכויות צד שלישי.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">10. סיום</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-white">אנו שומרים לעצמנו את הזכות להשעות או לסיים את חשבונך בכל עת, מכל סיבה שהיא</strong>,
              כולל הפרה של תנאים אלה. באפשרותך גם למחוק את חשבונך בכל עת דרך
              הגדרות האפליקציה. עם סיום, זכותך להשתמש באפליקציה תיפסק מיד.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">11. הגבלת אחריות</h2>
            <p className="text-white leading-relaxed font-semibold bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              האפליקציה מסופקת "כמות שהיא" ללא אחריות מכל סוג שהוא, מפורשת או משתמעת. איננו
              מתחייבים שהאפליקציה תהיה ללא הפרעות, ללא שגיאות או מאובטחת לחלוטין. איננו
              אחראים למעשים, לתוכן או לנתונים של צדדים שלישיים או משתמשים אחרים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">12. הגבלת נזקים</h2>
            <p className="text-white leading-relaxed font-semibold bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              במידה המרבית המותרת בחוק, I4IGUANA לא תהיה אחראית לכל נזק עקיף,
              מקרי, מיוחד, תוצאתי או עונשי הנובע משימושך באפליקציה,
              כולל אך לא מוגבל לפגיעה אישית, מצוקה רגשית או אובדן נתונים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">13. הדין החל</h2>
            <p className="text-gray-300 leading-relaxed">
              תנאים אלה יהיו כפופים ויפורשו בהתאם לחוקי <strong className="text-white">מדינת ישראל</strong>, מבלי להתחשב
              בהוראות ברירת הדין שלה. <strong className="text-white">כל מחלוקת הנובעת מתנאים אלה תיושב
              בבתי המשפט של תל אביב, ישראל</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">14. יצירת קשר</h2>
            <p className="text-gray-300 leading-relaxed">
              אם יש לך שאלות לגבי תנאי השימוש, אנא צור קשר:
            </p>
            <p className="text-green-400 font-semibold mt-2">
              <a href="mailto:nir@i4iguana.com" className="hover:underline">nir@i4iguana.com</a>
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <button 
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            חזרה
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-[#0d2920]/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-8 h-8" />
              <span className="text-lg font-bold text-white">I4IGUANA</span>
            </div>
            
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} I4IGUANA. כל הזכויות שמורות.
            </p>
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-gray-500 text-sm">
                כל זכויות היוצרים שמורות ל-<span className="text-green-400 font-semibold">ניר רם</span>
              </p>
              <p className="text-gray-600 text-xs mt-1">
                מייסד ויוצר I4IGUANA
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
