'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function TermsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromApp = searchParams.get('from') === 'app'

  const handleBack = () => {
    if (fromApp) {
      router.push('/app')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      {/* Header - with iOS safe area */}
      <nav 
        className="bg-[#0a1f1a]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href={fromApp ? "/app" : "/"} className="flex items-center gap-3">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                I4IGUANA
              </span>
            </Link>
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 min-h-[44px] px-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {fromApp ? 'Back to App' : 'Back'}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last updated: December 2024</p>

        <div className="prose prose-invert prose-green max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using I4IGUANA ("the App"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the App. We reserve the right to modify 
              these terms at any time, and your continued use of the App constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">2. Eligibility</h2>
            <p className="text-gray-300 leading-relaxed">
              You must be at least 18 years old to use I4IGUANA. By using the App, you represent and warrant 
              that you are at least 18 years of age and have the legal capacity to enter into this agreement. 
              We reserve the right to request proof of age at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">3. Account Registration</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To use certain features of the App, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">4. User Conduct</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Use the App for any illegal purpose or in violation of any laws</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or deceptive content</li>
              <li>Upload inappropriate, offensive, or explicit content</li>
              <li>Impersonate any person or entity</li>
              <li>Use automated systems or bots to access the App</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the App</li>
              <li>Solicit personal information from minors</li>
              <li>Use the App for commercial purposes without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">5. Safety Guidelines</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Your safety is important to us. We strongly recommend:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Meeting in public places only</li>
              <li>Informing friends or family of your plans</li>
              <li>Never sharing financial information with other users</li>
              <li>Reporting suspicious behavior immediately</li>
              <li>Trusting your instincts - if something feels wrong, leave</li>
            </ul>
            <p className="text-gray-400 mt-4 text-sm">
              I4IGUANA is not responsible for the conduct of any user, whether online or offline.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-red-400 mb-4">6. ⚠️ Assumption of Risk & User Responsibility</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              <strong className="text-white">BY USING I4IGUANA, YOU ACKNOWLEDGE AND AGREE THAT:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-3 ml-4">
              <li><strong className="text-white">Inherent Risks:</strong> Meeting people you've connected with online involves inherent risks. You assume full responsibility for your interactions with other users, both online and offline.</li>
              <li><strong className="text-white">No Background Checks:</strong> We do NOT conduct criminal background checks, identity verification, or screening of users. Users may misrepresent themselves.</li>
              <li><strong className="text-white">Location-Based Risks:</strong> The App uses your location to connect you with nearby users. You understand that sharing your proximity carries risks, including potential stalking, harassment, or unwanted contact.</li>
              <li><strong className="text-white">User Conduct:</strong> We have no control over and are not responsible for the actions, behavior, or conduct of any user, whether online or in person.</li>
              <li><strong className="text-white">Meeting Strangers:</strong> Any in-person meetings with other users are at your own risk. We strongly recommend meeting only in public places and informing someone you trust of your plans.</li>
              <li><strong className="text-white">No Guarantees:</strong> We make no guarantees regarding the identity, character, intentions, or behavior of any user.</li>
            </ul>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
              <p className="text-red-300 text-sm">
                <strong>⚠️ WARNING:</strong> You are solely responsible for your safety when using the App and meeting other users. 
                I4IGUANA accepts no liability for any harm, injury, harassment, stalking, impersonation, 
                or any other negative experience resulting from your use of the App or interactions with other users.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">7. Prohibited Conduct & Harassment Policy</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The following behaviors are strictly prohibited and may result in immediate account termination and reporting to authorities:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong className="text-white">Harassment:</strong> Any form of harassment, intimidation, or bullying</li>
              <li><strong className="text-white">Stalking:</strong> Following, tracking, or monitoring other users</li>
              <li><strong className="text-white">Impersonation:</strong> Creating fake profiles or pretending to be someone else</li>
              <li><strong className="text-white">Sexual Harassment:</strong> Unwanted sexual advances, requests, or explicit content</li>
              <li><strong className="text-white">Threats:</strong> Any threats of violence or harm</li>
              <li><strong className="text-white">Revenge:</strong> Using location data or personal information to harm, embarrass, or retaliate against users</li>
              <li><strong className="text-white">Doxxing:</strong> Sharing other users' personal information without consent</li>
            </ul>
            <p className="text-gray-400 mt-4 text-sm">
              If you experience any of the above, please use the in-app report feature immediately. 
              We encourage victims to also report incidents to local law enforcement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">8. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify, defend, and hold harmless I4IGUANA, its owners, officers, directors, employees, 
              and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses 
              (including reasonable attorneys' fees) arising out of or relating to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-4">
              <li>Your use of the App</li>
              <li>Your violation of these Terms</li>
              <li>Your interactions with other users</li>
              <li>Any content you post or share</li>
              <li>Any harm caused by your conduct to other users</li>
              <li>Any claims brought by third parties as a result of your actions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">9. Location Services</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA uses location services to provide proximity-based features. By using the App, you 
              consent to the collection and use of your location data. Location data is used only to 
              connect you with nearby users and verify venue check-ins. You can disable location services 
              at any time, but this may limit App functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">10. Venue Partner Notifications</h2>
            <div className="bg-[#1a4d3e]/30 border border-green-500/30 rounded-xl p-4 mb-4">
              <p className="text-gray-300 leading-relaxed mb-4">
                By checking in to a venue (bar, club, or partner location), you consent to receive push 
                notifications from that venue's management. Specifically:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Venue owners may send collective announcements to all checked-in users</li>
                <li>Venue owners cannot access your personal information - they see only aggregate user counts</li>
                <li>Notifications cease when you check out or your check-in expires (8 hours)</li>
                <li>You may disable venue notifications through your device settings</li>
              </ul>
            </div>
            
            {/* Hebrew Version */}
            <div className="bg-[#1a4d3e]/30 border border-green-500/30 rounded-xl p-4" dir="rtl">
              <p className="text-gray-300 leading-relaxed mb-4">
                בהתחברות למועדון (בר, מועדון או מקום שותף), אתה מסכים לקבל התראות מהנהלת המקום:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mr-4">
                <li>בעלי מועדונים יכולים לשלוח הודעות קולקטיביות לכל המשתמשים המחוברים</li>
                <li>בעלי מועדונים לא יכולים לגשת למידע האישי שלך - הם רואים רק מספרים מצטברים</li>
                <li>ההתראות נפסקות כשאתה יוצא או שההתחברות פגה (8 שעות)</li>
                <li>אתה יכול לכבות התראות מועדון בהגדרות המכשיר שלך</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">11. Subscriptions and Payments</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Some features require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Pay all fees associated with your subscription</li>
              <li>Automatic renewal unless canceled before the renewal date</li>
              <li>No refunds for partial subscription periods</li>
              <li>Price changes with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">12. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              All content, features, and functionality of the App are owned by I4IGUANA and are protected 
              by international copyright, trademark, and other intellectual property laws. You may not 
              reproduce, distribute, modify, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">13. User Content</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of content you upload to the App. However, by uploading content, you 
              grant I4IGUANA a non-exclusive, worldwide, royalty-free license to use, display, and 
              distribute your content in connection with the App. You are solely responsible for your 
              content and must ensure it does not violate any laws or third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">14. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time, for any reason, 
              including violation of these Terms. You may also delete your account at any time through 
              the App settings. Upon termination, your right to use the App will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">15. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT 
              WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. WE ARE NOT 
              RESPONSIBLE FOR THE ACTIONS, CONTENT, OR DATA OF THIRD PARTIES OR OTHER USERS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">16. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, I4IGUANA SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP, 
              INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, EMOTIONAL DISTRESS, OR LOSS OF DATA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">17. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of 
              Israel, without regard to its conflict of law provisions. Any disputes arising from these 
              Terms shall be resolved in the courts of Tel Aviv, Israel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">18. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {fromApp ? 'Back to App' : 'Back'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-[#0d2920]/50">
        <div className="max-w-4xl mx-auto">
          {/* Copyright & Creator */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-8 h-8" />
              <span className="text-lg font-bold text-white">I4IGUANA</span>
            </div>
            
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} I4IGUANA. All rights reserved.
            </p>
            
            {/* ✅ NEW: Nir Ram Copyright - Elegant Style */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-gray-500 text-sm">
                All copyrights reserved to <span className="text-green-400 font-semibold">Nir Ram</span>
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Founder & Creator of I4IGUANA
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function TermsOfService() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a1f1a]" />}>
      <TermsContent />
    </Suspense>
  )
}
