// lib/storage-service.ts
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "./firebase"

/**
 * Upload image to Firebase Storage and return download URL
 */
export async function uploadImage(
  userId: string,
  file: File | Blob,
  fileName?: string
): Promise<string> {
  try {
    const timestamp = Date.now()
    const finalFileName = fileName || `photo_${timestamp}.jpg`
    const storageRef = ref(storage, `users/${userId}/photos/${finalFileName}`)
    
    console.log('📤 Uploading image to Firebase Storage...')
    
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    
    console.log('✅ Image uploaded successfully:', downloadURL)
    
    return downloadURL
  } catch (error) {
    console.error('❌ Error uploading image:', error)
    throw error
  }
}

/**
 * Upload profile photo - wrapper for uploadImage
 */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  return uploadImage(userId, file, `profile_${Date.now()}.jpg`)
}

/**
 * Convert base64 to Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteString = atob(base64.split(',')[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  
  return new Blob([ab], { type: mimeType })
}

/**
 * Upload base64 image to Firebase Storage
 */
export async function uploadBase64Image(
  userId: string,
  base64String: string,
  fileName?: string
): Promise<string> {
  const blob = base64ToBlob(base64String, 'image/jpeg')
  return uploadImage(userId, blob, fileName)
}

/**
 * Delete image from Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl)
    await deleteObject(imageRef)
    console.log('✅ Image deleted successfully')
  } catch (error) {
    console.error('❌ Error deleting image:', error)
    throw error
  }
}

/**
 * Compress and resize image
 */
export function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}