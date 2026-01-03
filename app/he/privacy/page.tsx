'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function HebrewPrivacyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromApp = searchParams.get('from') === 'app'

  const handleBack = () => {
    if (fromApp) {
      // Coming from app - go back to app
      router.push('/app')
    } else {
      // Coming from website - go back to Hebrew landing
      router.push('/he')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white" dir="rtl">
      {/* Header - with iOS safe area */}
      <nav 
        className="bg-[#0a1f1a]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={fromApp ? "/app" : "/he"} className="flex items-center gap-3">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                I4IGUANA
              </span>
            </Link>
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 min-h-[44px] px-3"
            >
              {fromApp ? 'חזרה לאפליקציה' : 'חזרה'}
              <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">מדיניות פרטיות</h1>
        <p className="text-gray-400 mb-12">עדכון אחרון: דצמבר 2024</p>

        <div className="prose prose-invert prose-green max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">1. הקדמה</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA ("אנחנו", "שלנו", או "אותנו") מחויבת להגן על פרטיותך. מדיניות פרטיות זו
              מסבירה כיצד אנו <strong className="text-white">אוספים, משתמשים, חושפים ומגנים</strong> על המידע שלך כאשר אתה משתמש
              באפליקציה ובאתר שלנו (ביחד, "האפליקציה").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">2. מידע שאנו אוספים</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">מידע אישי</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li>שם ושם תצוגה</li>
              <li>כתובת אימייל</li>
              <li>מספר טלפון (לאימות)</li>
              <li>תאריך לידה</li>
              <li>מגדר והעדפות מגדר</li>
              <li>תמונות פרופיל</li>
              <li>תיאור אישי</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">נתוני מיקום</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li><strong className="text-white">קואורדינטות GPS</strong> (בעת שימוש באפליקציה)</li>
              <li>מיקומי צ'ק-אין במקומות</li>
              <li>קרבה למשתמשים אחרים</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">נתוני שימוש</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li>דפוסי שימוש והעדפות באפליקציה</li>
              <li>מידע על המכשיר (סוג, מערכת הפעלה)</li>
              <li>כתובת IP</li>
              <li>נתוני אינטראקציה (התאמות, הודעות)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">3. כיצד אנו משתמשים במידע שלך</h2>
            <p className="text-gray-300 leading-relaxed mb-4">אנו משתמשים במידע שלך כדי:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li>לספק ולתחזק את הפונקציונליות של האפליקציה</li>
              <li><strong className="text-white">לחבר אותך עם משתמשים קרובים על בסיס קרבה</strong></li>
              <li>לאמת את זהותך ולמנוע הונאה</li>
              <li>להתאים אישית את החוויה שלך</li>
              <li>לעבד תשלומים ומנויים</li>
              <li>לשלוח התראות על התאמות והודעות</li>
              <li>לשפר את השירותים שלנו ולפתח תכונות חדשות</li>
              <li>לאכוף את תנאי השימוש שלנו</li>
              <li>לציית לחובות משפטיות</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">4. שיתוף מידע</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              אנו עשויים לשתף את המידע שלך עם:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li><strong className="text-white">משתמשים אחרים:</strong> מידע הפרופיל, התמונות והמיקום המשוער שלך גלויים למשתמשים אחרים</li>
              <li><strong className="text-white">ספקי שירות:</strong> צדדים שלישיים המסייעים לנו להפעיל את האפליקציה (מעבדי תשלומים, ספקי אירוח)</li>
              <li><strong className="text-white">דרישות משפטיות:</strong> כאשר נדרש על פי חוק או להגנה על זכויותינו</li>
              <li><strong className="text-white">העברות עסקיות:</strong> בקשר למיזוג, רכישה או מכירת נכסים</li>
            </ul>
            <p className="text-green-400 mt-4 text-sm font-semibold">
              ✓ אנחנו לא מוכרים את המידע האישי שלך לצדדים שלישיים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">5. פרטיות מיקום</h2>
            <p className="text-gray-300 leading-relaxed">
              מיקום הוא מרכזי לפונקציונליות של I4IGUANA. <strong className="text-white">אנו אוספים את המיקום שלך רק כאשר אתה
              משתמש באפליקציה באופן פעיל</strong>. המיקום המדויק שלך <strong className="text-white">לעולם אינו מוצג למשתמשים אחרים</strong> -
              רק המרחק המשוער שלך (למשל, "50 מטר משם"). באפשרותך להשבית את שירותי המיקום בכל
              עת בהגדרות המכשיר שלך, אם כי הדבר יגביל את הפונקציונליות של האפליקציה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">6. אבטחת מידע</h2>
            <p className="text-gray-300 leading-relaxed">
              אנו מיישמים <strong className="text-white">אמצעים טכניים וארגוניים מתאימים</strong> כדי להגן על המידע האישי שלך,
              כולל <strong className="text-white">הצפנה, שרתים מאובטחים ובקרות גישה</strong>. עם זאת, אף שיטת העברה דרך
              האינטרנט אינה מאובטחת ב-100%, ואיננו יכולים להבטיח אבטחה מוחלטת.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">7. שמירת מידע</h2>
            <p className="text-gray-300 leading-relaxed">
              אנו שומרים את המידע האישי שלך כל עוד החשבון שלך פעיל או לפי הצורך לספק
              שירותים. <strong className="text-white">כאשר אתה מוחק את החשבון שלך, נמחק או נאנונים את המידע שלך
              תוך 30 יום</strong>, למעט במקרים בהם אנו נדרשים לשמור אותו למטרות משפטיות.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">8. הזכויות שלך</h2>
            <p className="text-gray-300 leading-relaxed mb-4">יש לך את הזכות:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
              <li><strong className="text-white">גישה:</strong> לבקש עותק של הנתונים האישיים שלך</li>
              <li><strong className="text-white">תיקון:</strong> לעדכן או לתקן מידע לא מדויק</li>
              <li><strong className="text-white">מחיקה:</strong> לבקש מחיקת החשבון והנתונים שלך</li>
              <li><strong className="text-white">ניידות:</strong> לקבל את הנתונים שלך בפורמט נייד</li>
              <li><strong className="text-white">ביטול הרשמה:</strong> לבטל הרשמה לתקשורת שיווקית</li>
              <li><strong className="text-white">ביטול הסכמה:</strong> לבטל הסכמה שניתנה בעבר</li>
            </ul>
            <p className="text-gray-400 mt-4">
              למימוש זכויות אלה, צור קשר ב-<a href="mailto:nir@i4iguana.com" className="text-green-400 hover:underline">nir@i4iguana.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">9. עוגיות ומעקב</h2>
            <p className="text-gray-300 leading-relaxed">
              אנו משתמשים בעוגיות וטכנולוגיות דומות כדי לשפר את החוויה שלך, לנתח שימוש
              ולהעביר תוכן מותאם אישית. באפשרותך לשלוט בעוגיות דרך הגדרות הדפדפן שלך,
              אם כי השבתתן עשויה להשפיע על הפונקציונליות של האפליקציה.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">10. שירותי צד שלישי</h2>
            <p className="text-gray-300 leading-relaxed">
              האפליקציה עשויה להכיל קישורים לאתרים או שירותים של צדדים שלישיים. <strong className="text-white">איננו אחראים
              לשיטות הפרטיות של צדדים שלישיים אלה</strong>. אנו ממליצים לקרוא את מדיניות הפרטיות שלהם.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">11. פרטיות ילדים</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong className="text-white">I4IGUANA אינה מיועדת לאף אחד מתחת לגיל 18</strong>. איננו אוספים ביודעין
              מידע אישי מילדים. אם נגלה שילד סיפק לנו מידע אישי,
              נמחק אותו מיד.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">12. העברות נתונים בינלאומיות</h2>
            <p className="text-gray-300 leading-relaxed">
              המידע שלך עשוי להיות מועבר ומעובד במדינות אחרות מלבד שלך.
              <strong className="text-white"> אנו מבטיחים שמוצבים אמצעי הגנה מתאימים</strong> להגנה על המידע שלך בהתאם
              למדיניות פרטיות זו.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">13. שינויים במדיניות זו</h2>
            <p className="text-gray-300 leading-relaxed">
              אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. נודיע לך על כל שינויים על ידי
              פרסום המדיניות החדשה בדף זה ועדכון תאריך "עדכון אחרון". <strong className="text-white">המשך השימוש
              באפליקציה לאחר שינויים מהווה קבלת המדיניות המעודכנת</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">14. יצירת קשר</h2>
            <p className="text-gray-300 leading-relaxed">
              אם יש לך שאלות או חששות לגבי מדיניות פרטיות זו או שיטות הנתונים שלנו, אנא צור קשר:
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
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors min-h-[44px]"
          >
            {fromApp ? 'חזרה לאפליקציה' : 'חזרה'}
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

export default function HebrewPrivacyPolicy() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1f1a]" />}>
      <HebrewPrivacyContent />
    </Suspense>
  )
}
