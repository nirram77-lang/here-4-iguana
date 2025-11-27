// app/api/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dy2dfq8jd';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'i4iguana_photos_App';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 API Route: Upload started')
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('   File:', file.name, file.size, 'bytes')

    // Upload to Cloudinary from backend
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    console.log('   Uploading to Cloudinary...')
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Cloudinary error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Upload failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Upload successful:', data.secure_url)

    return NextResponse.json({
      success: true,
      url: data.secure_url,
    });

  } catch (error: any) {
    console.error('❌ API Route error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
