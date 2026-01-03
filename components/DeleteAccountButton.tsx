'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { deleteUserAccount } from '@/lib/delete-account-service';
import { useLanguage } from '@/lib/LanguageContext';

export default function DeleteAccountButton() {
  const { t, isRTL } = useLanguage();
  
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleInitialClick = () => {
    setShowWarning(true);
    setError(null);
  };

  const handleProceedToConfirm = () => {
    setShowWarning(false);
    setShowConfirm(true);
  };

  const handleFinalDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError(t('deleteAccount.typeDeleteError'));
      return;
    }

    if (!user) {
      setError(t('deleteAccount.noUserFound'));
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      console.log('🗑️ Starting account deletion...');
      
      // Delete account using the new service
      const result = await deleteUserAccount(user.uid);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      console.log('✓ Account deleted', {
        phoneIdentityPreserved: result.phoneIdentityPreserved,
        timerRemaining: result.timerRemaining
      });
      
      // Close modals
      setShowConfirm(false);
      setIsDeleting(false);
      
      // ✅ CRITICAL FIX: Clear localStorage so notifications modal shows again on re-register
      console.log('🧹 Clearing localStorage for fresh start...');
      const keysToRemove = [
        `notificationModalShown_${user.uid}`,
        `oneSignalLinked_${user.uid}`,
        'hasScannedQR',
        'i4iguana_checkin',
        'lastVenueId',
        'i4iguana_phone_verified',
        'i4iguana_onboarding_data',
        'googleDisplayName',
        'pendingCheckIn'
      ];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`   ✓ Removed: ${key}`);
      });
      
      // ✅ Also clear sessionStorage
      sessionStorage.clear();
      console.log('   ✓ sessionStorage cleared');
      
      // ✅ NEW: Logout from OneSignal (unlink device from this user)
      try {
        const OneSignal = (window as any).OneSignal;
        if (OneSignal) {
          console.log('🔔 Logging out from OneSignal...');
          if (OneSignal.logout) {
            await OneSignal.logout();
            console.log('   ✓ OneSignal logout successful');
          } else if (OneSignal.removeExternalUserId) {
            await OneSignal.removeExternalUserId();
            console.log('   ✓ OneSignal removeExternalUserId successful');
          }
        }
      } catch (oneSignalError) {
        console.log('⚠️ OneSignal logout error (continuing anyway):', oneSignalError);
      }
      
      // ✅ NEW: Set force flag to show notification modal on re-registration
      localStorage.setItem('force_notification_setup', 'true');
      console.log('   ✓ Set: force_notification_setup');
      
      // Show success message
      setShowSuccess(true);
      
      // Logout after 2 seconds
      setTimeout(async () => {
        await logout();
        console.log('✓ Logged out');
        
        // Redirect to home
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(error.message || t('deleteAccount.errorDeleting'));
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setShowWarning(false);
    setShowConfirm(false);
    setConfirmText('');
    setError(null);
  };

  return (
    <>
      {/* Delete Button */}
      <button
        onClick={handleInitialClick}
        className="w-full py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
      >
        <span>{t('deleteAccount.button')}</span>
      </button>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-bounce">✅</div>
              <h3 className="text-3xl font-bold text-green-600 mb-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('deleteAccount.successTitle')}
              </h3>
              <p className="text-gray-700 text-lg" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('deleteAccount.redirecting')}
              </p>
              <div className="mt-6">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-600" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('deleteAccount.warningTitle')}
              </h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-800 font-semibold text-center" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('deleteAccount.warningText')}
              </p>
              
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-bold mb-3" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  {t('deleteAccount.whatDeleted')}
                </p>
                <ul className={`space-y-2 text-red-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-red-500">✗</span>
                    <span>{t('deleteAccount.allMatches')}</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-red-500">✗</span>
                    <span>{t('deleteAccount.allPasses')}</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-red-500">✗</span>
                    <span>{t('deleteAccount.allHistory')}</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-red-500">✗</span>
                    <span>{t('deleteAccount.allSettings')}</span>
                  </li>
                  <li className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-red-500">✗</span>
                    <span>{t('deleteAccount.authAccount')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <p className={`text-blue-800 font-bold mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  <span>{t('deleteAccount.goodToKnow')}</span>
                </p>
                <p className="text-blue-700 text-sm" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  {t('deleteAccount.canReregister')}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleProceedToConfirm}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                {t('deleteAccount.proceedDelete')}
              </button>
              
              <button
                onClick={handleCancel}
                className="w-full py-4 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                {t('deleteAccount.cancelKeep')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-red-600" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('deleteAccount.finalConfirm')}
              </h3>
            </div>
            
            <p className="text-gray-800 text-center mb-6 font-semibold" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('deleteAccount.lastChance')}
            </p>
            
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
              <p className="text-red-800 font-bold mb-4 text-center" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('deleteAccount.typeDelete')}
              </p>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 border-2 border-red-300 rounded-lg text-center font-mono text-lg focus:outline-none focus:border-red-500"
                autoFocus
                disabled={isDeleting}
              />
              
              {error && (
                <p className="text-red-600 text-sm mt-3 text-center" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                  {error}
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleFinalDelete}
                disabled={isDeleting || confirmText.trim().toUpperCase() !== 'DELETE'}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('deleteAccount.deleting')}</span>
                  </>
                ) : (
                  <span>{t('deleteAccount.deletePermanent')}</span>
                )}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="w-full py-4 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {t('deleteAccount.cancel')}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              {t('deleteAccount.irreversible')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
