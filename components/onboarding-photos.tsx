"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, Loader2, ImagePlus, Camera } from "lucide-react"

interface OnboardingPhotosProps {
  onComplete: (data: { photos: string[], bio: string }) => void  // ✅ Removed name - already saved!
  onBack: () => void
}

export default function OnboardingPhotos({ onComplete, onBack }: OnboardingPhotosProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [bio, setBio] = useState("")  // ✅ Removed name state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // ✅ NEW: Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // ✅ FIX: Process multiple photos at once
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

  // ✅ FIX: Handle multiple photo uploads at once
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

  // ✅ NEW: Drag & Drop handlers
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

    // ✅ Reorder photos array
    const newPhotos = [...photos]
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(dropIndex, 0, draggedPhoto)

    setPhotos(newPhotos)
    setDraggedIndex(null)
    setDragOverIndex(null)
    
    console.log('✅ Photos reordered! New order:', newPhotos.map((_, i) => i + 1))
  }

  const handleComplete = () => {
    // ✅ Name already saved in Name Entry screen!
    if (photos.length >= 2 && bio.trim()) {
      onComplete({ photos, bio })
    }
  }

  const canComplete = photos.length >= 2 && bio.trim()

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#1a4d3e] via-[#0d2920] to-[#051410] relative overflow-hidden">
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

      {/* ✅ FIX: Allow multiple file selection */}
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
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="text-6xl mb-4"
            >
              📸
            </motion.div>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Show yourself!
            </h1>
            <p className="text-[#a8d5ba] text-base">
              Add at least 2 photos (you can select multiple at once!)
            </p>
            <div className={`text-xl font-bold mt-2 ${photos.length >= 2 ? 'text-[#4ade80]' : 'text-amber-400'}`}>
              {photos.length}/6 photos {photos.length >= 2 && '✓'}
            </div>
          </motion.div>

          {/* Upload Progress */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-[#1a4d3e]/70 rounded-2xl p-4 border border-[#4ade80]/30"
            >
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 text-[#4ade80] animate-spin" />
                <span className="text-white font-medium">Uploading photos...</span>
                <span className="text-[#4ade80] font-bold ml-auto">{uploadProgress}%</span>
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

          {/* Photo Grid - ✅ NOW WITH DRAG & DROP! */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
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
                  className={`relative aspect-square rounded-2xl overflow-hidden bg-[#1a4d3e]/50 border-2 transition-all cursor-move ${
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
          
          {/* ✅ NEW: Hint for drag and drop */}
          {photos.length >= 2 && !uploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-3 text-center"
            >
              <p className="text-[#4ade80] text-sm font-medium">
                👆 Drag & drop photos to reorder! First photo = Main profile photo ⭐
              </p>
            </motion.div>
          )}

          {/* ✅ Name field removed - already entered in Name Entry screen! */}

          {/* Bio Input */}
          <div className="mb-6">
            <label className="text-white/80 text-sm font-semibold mb-2 block">
              About You
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a bit about yourself..."
              maxLength={200}
              className="bg-[#1a4d3e]/50 border-[#4ade80]/20 text-white rounded-xl min-h-28 resize-none focus:border-[#4ade80] focus:ring-[#4ade80]"
            />
            <div className="text-right text-xs text-white/40 mt-1">
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
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!canComplete || uploading}
              className="flex-1 h-14 rounded-full bg-[#4ade80] hover:bg-[#3bc970] text-[#0d2920] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                'Complete 🎉'
              )}
            </Button>
          </div>

          {/* Validation Status */}
          {!canComplete && !uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white/50 text-sm pb-4"
            >
              {photos.length < 2 && <span>Add at least 2 photos • </span>}
              {!bio.trim() && <span>Write something about yourself</span>}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
