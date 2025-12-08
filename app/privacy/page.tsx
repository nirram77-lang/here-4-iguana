'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: December 2024</p>

        <div className="prose prose-invert prose-green max-w-none space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              mobile application and website (collectively, the "App").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Name and display name</li>
              <li>Email address</li>
              <li>Phone number (for verification)</li>
              <li>Date of birth</li>
              <li>Gender and gender preferences</li>
              <li>Profile photos</li>
              <li>Bio and personal description</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Location Data</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>GPS coordinates (when using the App)</li>
              <li>Venue check-in locations</li>
              <li>Proximity to other users</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Usage Data</h3>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>App usage patterns and preferences</li>
              <li>Device information (type, operating system)</li>
              <li>IP address</li>
              <li>Interaction data (matches, messages)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Provide and maintain the App's functionality</li>
              <li>Connect you with nearby users based on proximity</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Personalize your experience</li>
              <li>Process payments and subscriptions</li>
              <li>Send notifications about matches and messages</li>
              <li>Improve our services and develop new features</li>
              <li>Enforce our Terms of Service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">4. Information Sharing</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Other Users:</strong> Your profile information, photos, and approximate location are visible to other users</li>
              <li><strong>Service Providers:</strong> Third parties that help us operate the App (payment processors, hosting providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="text-gray-400 mt-4 text-sm">
              We do NOT sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">5. Location Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Location is central to I4IGUANA's functionality. We collect your location only when you 
              actively use the App. Your exact location is never shown to other users - only your 
              approximate distance (e.g., "50 meters away"). You can disable location services at any 
              time in your device settings, though this will limit App functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">6. Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal 
              information, including encryption, secure servers, and access controls. However, no method 
              of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">7. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to 
              provide services. When you delete your account, we will delete or anonymize your information 
              within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">8. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Withdraw Consent:</strong> Revoke previously given consent</li>
            </ul>
            <p className="text-gray-400 mt-4">
              To exercise these rights, contact us at <a href="mailto:nir@i4iguana.com" className="text-green-400 hover:underline">nir@i4iguana.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-300 leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage, and 
              deliver personalized content. You can control cookies through your browser settings, though 
              disabling them may affect App functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">10. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed">
              The App may contain links to third-party websites or services. We are not responsible for 
              the privacy practices of these third parties. We encourage you to read their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">11. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              I4IGUANA is not intended for anyone under 18 years of age. We do not knowingly collect 
              personal information from children. If we discover that a child has provided us with 
              personal information, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">12. International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your information in accordance 
              with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">13. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date. Continued use of 
              the App after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-green-400 mb-4">14. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
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
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} I4IGUANA. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
