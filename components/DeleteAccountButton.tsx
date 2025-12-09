'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { deleteUserAccount } from '@/lib/delete-account-service';

export default function DeleteAccountButton() {
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
      setError('נא להקליד בדיוק "DELETE" לאישור המחיקה');
      return;
    }

    if (!user) {
      setError('לא נמצא משתמש מחובר');
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
        'lastVenueId'
      ];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`   ✓ Removed: ${key}`);
      });
      
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
      setError(error.message || 'אירעה שגיאה במחיקת החשבון');
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
        <span className="text-2xl">🗑️</span>
        <span>מחק חשבון לצמיתות</span>
      </button>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="text-7xl mb-4 animate-bounce">✅</div>
              <h3 className="text-3xl font-bold text-green-600 mb-3">
                חשבונך נמחק!
              </h3>
              <p className="text-gray-700 text-lg">
                מעביר אותך למסך הבית...
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
              <h3 className="text-2xl font-bold text-red-600">
                אתה בטוח?
              </h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-800 font-semibold text-center">
                פעולה זו תמחק את החשבון שלך לצמיתות!
              </p>
              
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-bold mb-3">
                  מה יימחק?
                </p>
                <ul className="space-y-2 text-red-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>כל ההתאמות והשיחות שלך</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>כל ה-PASS-ים שלך</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>היסטוריית הפעילות המלאה</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>כל ההגדרות והעדפות</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>חשבון ההזדהות שלך</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                <p className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>טוב לדעת</span>
                </p>
                <p className="text-blue-700 text-sm">
                  תוכל להירשם מחדש בכל עת. אם יש לך טיימר פעיל, הוא יישמר.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleProceedToConfirm}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                אני מבין, המשך למחיקה
              </button>
              
              <button
                onClick={handleCancel}
                className="w-full py-4 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                ביטול - אני רוצה לשמור על החשבון
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
              <h3 className="text-2xl font-bold text-red-600">
                אישור סופי
              </h3>
            </div>
            
            <p className="text-gray-800 text-center mb-6 font-semibold">
              זוהי ההזדמנות האחרונה לבטל!
            </p>
            
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
              <p className="text-red-800 font-bold mb-4 text-center">
                הקלד "DELETE" באותיות גדולות:
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
                <p className="text-red-600 text-sm mt-3 text-center">
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
                    <span>מוחק חשבון...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>מחק לצמיתות</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="w-full py-4 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                ביטול
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              פעולה זו אינה ניתנת לביטול
            </p>
          </div>
        </div>
      )}
    </>
  );
}
