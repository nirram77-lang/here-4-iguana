import { IMAGE_CONFIG, ERROR_MESSAGES } from './constants';

// Constants for image processing
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 0.8;

/**
 * Aggressive compression for mobile
 */
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Validate file size - תוקן כאן!
    if (file.size > IMAGE_CONFIG.maxSize) {
      reject(new Error(ERROR_MESSAGES.UPLOAD_SIZE_ERROR));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          QUALITY
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * Upload image to Cloudinary with progress tracking
 */
export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Show compression progress
    if (onProgress) onProgress(10);

    // Compress image first
    const compressedFile = await compressImage(file);

    const originalSize = (file.size / 1024 / 1024).toFixed(2);
    const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
    console.log(`📸 Compressed: ${originalSize}MB → ${compressedSize}MB`);

    if (onProgress) onProgress(30);

    const formData = new FormData();
    formData.append('file', compressedFile);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'i4iguana_photos');

    if (onProgress) onProgress(50);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dy2dfq8jd';
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (onProgress) onProgress(90);

    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.UPLOAD_ERROR);
    }

    const data = await response.json();

    if (onProgress) onProgress(100);

    console.log('✅ Upload successful:', data.secure_url);
    return data.secure_url;

  } catch (error) {
    console.error('❌ Upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(ERROR_MESSAGES.UPLOAD_ERROR);
  }
};