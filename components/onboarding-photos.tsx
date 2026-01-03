"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Loader2, ImagePlus, Camera } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface OnboardingPhotosProps {
  onComplete: (data: { photos: string[], bio: string }) => void
  onBack: () => void
  // ✅ NEW: Initial values to preserve on back navigation
  initialPhotos?: string[]
  initialBio?: string
}

export default function OnboardingPhotos({ 
  onComplete, 
  onBack,
  initialPhotos = [],  // ✅ FIX: Use initial values
  initialBio = ''      // ✅ FIX: Use initial values
}: OnboardingPhotosProps) {
  const { t, isRTL } = useLanguage()
  
  // ✅ FIX: Initialize with existing data for back navigation
  const [photos, setPhotos] = useState<string[]>(initialPhotos)
  const [bio, setBio] = useState(initialBio)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // ✅ NEW: Real viewport height for old Android/iOS
  const [viewportHeight, setViewportHeight] = useState<number | null>(null)
  
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight)
    }
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', () => setTimeout(updateViewportHeight, 100))
    return () => {
      window.removeEventListener('resize', updateViewportHeight)
    }
  }, [])
  
  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Process multiple photos at once
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            
            // Resize to max 800px width while maintaining aspect ratio
            const maxWidth = 800
            const scale = Math.min(maxWidth / img.width, 1)
            canvas.width = img.width * scale
            canvas.height = img.height * scale
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const compressedPhoto = canvas.toDataURL('image/jpeg', 0.7)
            resolve(compressedPhoto)
          } catch (error) {
            reject(error)
          }
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = reader.result as string
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  // Handle multiple photo uploads at once
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    setUploadProgress(0)
    
    const remainingSlots = 6 - photos.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    const totalFiles = filesToProcess.length
    
    const newPhotos: string[] = []
    
    for (let i = 0; i < filesToProcess.length; i++) {
      try {
        const compressedPhoto = await processImage(filesToProcess[i])
        newPhotos.push(compressedPhoto)
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      } catch (error) {
        console.error('Error processing image:', error)
      }
    }
    
    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos])
    }
    
    setUploading(false)
    setUploadProgress(0)
    
    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  // Drag & Drop handlers (Desktop)
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    console.log('🎯 Started dragging photo:', index + 1)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    console.log(`📦 Dropping photo ${draggedIndex + 1} at position ${dropIndex + 1}`)

    // Reorder photos array
    const newPhotos = [...photos]
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(dropIndex, 0, draggedPhoto)

    setPhotos(newPhotos)
    setDraggedIndex(null)
    setDragOverIndex(null)
    
    console.log('✅ Photos reordered! New order:', newPhotos.map((_, i) => i + 1))
  }

  // ✅ Touch handlers for MOBILE drag support
  const touchStartRef = useRef<{ index: number; startY: number; startX: number } | null>(null)
  
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0]
    touchStartRef.current = { index, startY: touch.clientY, startX: touch.clientX }
    setDraggedIndex(index)
    console.log('📱 Touch started on photo:', index + 1)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null || draggedIndex === null) return
    
    const touch = e.touches[0]
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
    
    // Find which photo slot we're over
    for (const el of elements) {
      const photoIndex = el.getAttribute('data-photo-index')
      if (photoIndex !== null) {
        const idx = parseInt(photoIndex)
        if (idx !== draggedIndex) {
          setDragOverIndex(idx)
        }
        break
      }
    }
  }
  
  const handleTouchEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      console.log(`📱 Touch drop: ${draggedIndex + 1} → ${dragOverIndex + 1}`)
      
      // Reorder photos array
      const newPhotos = [...photos]
      const [draggedPhoto] = newPhotos.splice(draggedIndex, 1)
      newPhotos.splice(dragOverIndex, 0, draggedPhoto)
      setPhotos(newPhotos)
      
      console.log('✅ Photos reordered via touch!')
    }
    
    touchStartRef.current = null
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleComplete = () => {
    if (photos.length >= 2 && bio.trim()) {
      onComplete({ photos, bio })
    }
  }

  const canComplete = photos.length >= 2 && bio.trim()

  return (
    <div 
      className="flex flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-y-auto overflow-x-hidden"
      style={{ 
        minHeight: viewportHeight ? `${viewportHeight}px` : '100vh',
        paddingBottom: '120px'  // ✅ Extra space for buttons
      }}
    >
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Allow multiple file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />

      <div className="flex-1 flex flex-col p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= 3 ? 'bg-[#4ade80]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              📸
            </motion.div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              {t('onboarding.photos.title')}
            </h1>
            <p className="text-[#a8d5ba] text-base">
              {t('onboarding.photos.subtitle')}
            </p>
            <div className={`text-xl font-bold mt-2 ${photos.length >= 2 ? 'text-[#4ade80]' : 'text-amber-400'}`}>
              {photos.length}/6 {isRTL ? 'תמונות' : 'photos'} {photos.length >= 2 && '✓'}
            </div>
          </motion.div>

          {/* Upload Progress */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-[#1a4d3e]/70 rounded-2xl p-4 border border-[#4ade80]/30"
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 text-[#4ade80] animate-spin" />
                <span className="text-white font-medium">{t('onboarding.photos.uploadingPhoto')}</span>
                <span className={`text-[#4ade80] font-bold ${isRTL ? 'mr-auto' : 'ml-auto'}`}>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e]"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Photo Grid - WITH DRAG & DROP! */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  data-photo-index={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  layout
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={() => setDraggedIndex(null)}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`relative aspect-square rounded-2xl overflow-hidden bg-[#1a4d3e]/50 border-2 transition-all cursor-move touch-none ${
                    draggedIndex === index
                      ? 'border-[#4ade80] opacity-50 scale-95'
                      : dragOverIndex === index
                      ? 'border-[#4ade80] scale-105 shadow-lg shadow-[#4ade80]/50'
                      : 'border-[#4ade80]/30'
                  }`}
                >
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-10"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                  
                  {/* Main Photo Badge */}
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#4ade80] text-[#0d2920] text-xs font-bold py-1 text-center">
                      Main Photo ⭐
                    </div>
                  )}
                  
                  {/* Drag Indicator */}
                  {draggedIndex === index && (
                    <div className="absolute inset-0 bg-[#4ade80]/20 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-4xl"
                      >
                        👆
                      </motion.div>
                    </div>
                  )}
                  
                  {/* Drop Zone Indicator */}
                  {dragOverIndex === index && draggedIndex !== index && (
                    <div className="absolute inset-0 bg-[#4ade80]/30 flex items-center justify-center border-2 border-dashed border-[#4ade80]">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-4xl"
                      >
                        📍
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add Photo Button - Enhanced */}
            {photos.length < 6 && !uploading && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-[#4ade80]/40 bg-[#1a4d3e]/30 hover:bg-[#1a4d3e]/50 hover:border-[#4ade80]/60 flex flex-col items-center justify-center transition-all"
              >
                <ImagePlus className="h-10 w-10 text-[#4ade80] mb-1" />
                <span className="text-xs text-[#4ade80] font-medium">
                  {photos.length === 0 ? 'Add Photos' : 'Add More'}
                </span>
              </motion.button>
            )}
          </div>

          {/* Hint for multiple selection */}
          {photos.length < 2 && !uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center"
            >
              <p className="text-amber-400 text-sm">
                💡 Tip: You can select multiple photos at once from your gallery!
              </p>
            </motion.div>
          )}
          
          {/* Hint for drag and drop */}
          {photos.length >= 2 && !uploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-3 text-center"
            >
              <p className="text-[#4ade80] text-sm font-medium" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {t('onboarding.photos.dragHint')}
              </p>
            </motion.div>
          )}

          {/* Bio Input */}
          <div className="mb-6" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            <label className="text-white/80 text-sm font-semibold mb-2 block">
              {t('onboarding.bio.title')}
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('onboarding.bio.placeholder')}
              maxLength={200}
              className="bg-[#1a4d3e]/50 border-[#4ade80]/20 text-white rounded-xl min-h-28 resize-none focus:border-[#4ade80] focus:ring-[#4ade80]"
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            />
            <div className={`text-xs text-white/40 mt-1 ${isRTL ? 'text-left' : 'text-right'}`}>
              {bio.length}/200
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-4">
            <Button
              onClick={onBack}
              variant="outline"
              disabled={uploading}
              className="flex-1 h-14 rounded-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10"
            >
              {t('onboarding.back')}
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!canComplete || uploading}
              className="flex-1 h-14 rounded-full bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className={`h-5 w-5 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('onboarding.photos.uploadingPhoto')}
                </>
              ) : (
                isRTL ? '🎉 סיום' : 'Complete 🎉'
              )}
            </Button>
          </div>

          {/* Validation Status */}
          {!canComplete && !uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white/50 text-sm pb-4"
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              {photos.length < 2 && <span>{isRTL ? 'הוסף לפחות 2 תמונות • ' : 'Add at least 2 photos • '}</span>}
              {!bio.trim() && <span>{t('onboarding.bio.placeholder')}</span>}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
