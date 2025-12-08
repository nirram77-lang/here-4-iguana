'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function TermsOfService() {
  const router = useRouter()

  // Smart back function - goes back in history or to app
  const handleBack = () => {
    // Check if there's history to go back to
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      // Fallback to app
      router.push('/app')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a1f1a] text-white">
      {/* Header */}
      <nav className="bg-[#0a1f1a]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/notification-icon-192.png" alt="I4IGUANA" className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                I4IGUANA
              </span>
            </Link>
            <button 
              onClick={handleBack}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
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
            <h2 className="text-2xl font-bold text-green-400 mb-4">6. Location Services</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA uses location services to provide proximity-based features. By using the App, you 
              consent to the collection and use of your location data. Location data is used only to 
              connect you with nearby users and verify venue check-ins. You can disable location services 
              at any time, but this may limit App functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">7. Subscriptions and Payments</h2>
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
            <h2 className="text-2xl font-bold text-green-400 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed">
              All content, features, and functionality of the App are owned by I4IGUANA and are protected 
              by international copyright, trademark, and other intellectual property laws. You may not 
              reproduce, distribute, modify, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">9. User Content</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of content you upload to the App. However, by uploading content, you 
              grant I4IGUANA a non-exclusive, worldwide, royalty-free license to use, display, and 
              distribute your content in connection with the App. You are solely responsible for your 
              content and must ensure it does not violate any laws or third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">10. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time, for any reason, 
              including violation of these Terms. You may also delete your account at any time through 
              the App settings. Upon termination, your right to use the App will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">11. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT 
              WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. WE ARE NOT 
              RESPONSIBLE FOR THE ACTIONS, CONTENT, OR DATA OF THIRD PARTIES OR OTHER USERS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">12. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, I4IGUANA SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE APP, 
              INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, EMOTIONAL DISTRESS, OR LOSS OF DATA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">13. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of 
              Israel, without regard to its conflict of law provisions. Any disputes arising from these 
              Terms shall be resolved in the courts of Tel Aviv, Israel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">14. Contact Us</h2>
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
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
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
