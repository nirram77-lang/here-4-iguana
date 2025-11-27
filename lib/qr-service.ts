import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

export interface QRData {
  type: 'iguana_checkin'
  venueId: string
  venueName: string
  timestamp: number
}

// ✅ Configuration for deployment
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000'
const APP_PROTOCOL = process.env.NEXT_PUBLIC_APP_PROTOCOL || 'http'

/**
 * Generate check-in URL for QR code
 */
export function generateCheckInURL(venueId: string): string {
  return `${APP_PROTOCOL}://${APP_DOMAIN}/checkin/${venueId}`
}

/**
 * Generate QR code for venue check-in
 * Returns base64 image and data URL
 */
export async function generateVenueQRCode(
  venueId: string,
  venueName: string
): Promise<{ dataURL: string; base64: string }> {
  try {
    // ✅ NEW: Create URL instead of JSON
    const checkInURL = generateCheckInURL(venueId)
    
    console.log('🔗 QR URL:', checkInURL)

    // Generate QR code as data URL
    const dataURL = await QRCode.toDataURL(checkInURL, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 512,
      margin: 2,
      color: {
        dark: '#0d2920',  // Iguana dark green
        light: '#FFFFFF'
      }
    })

    // Extract base64 from data URL
    const base64 = dataURL.split(',')[1]

    console.log('✅ QR code generated for venue:', venueName)

    return { dataURL, base64 }
  } catch (error) {
    console.error('❌ Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Generate QR code as PNG buffer (for server-side download)
 */
export async function generateVenueQRCodeBuffer(
  venueId: string,
  venueName: string
): Promise<Buffer> {
  try {
    const checkInURL = generateCheckInURL(venueId)

    const buffer = await QRCode.toBuffer(checkInURL, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#0d2920',
        light: '#FFFFFF'
      }
    })

    return buffer
  } catch (error) {
    console.error('❌ Error generating QR buffer:', error)
    throw new Error('Failed to generate QR code buffer')
  }
}

/**
 * ✅ NEW: Extract venue ID from check-in URL
 */
export function extractVenueIdFromURL(url: string): string | null {
  try {
    // Match pattern: http(s)://domain/checkin/{venueId}
    const match = url.match(/\/checkin\/([^/?]+)/)
    return match ? match[1] : null
  } catch (error) {
    console.error('❌ Error extracting venue ID:', error)
    return null
  }
}

/**
 * Validate scanned QR data (backwards compatible with JSON)
 */
export function validateQRData(qrContent: string): QRData | null {
  try {
    // ✅ NEW: Check if it's a URL
    if (qrContent.startsWith('http://') || qrContent.startsWith('https://')) {
      const venueId = extractVenueIdFromURL(qrContent)
      
      if (!venueId) {
        console.warn('⚠️ Invalid check-in URL')
        return null
      }
      
      // Return QRData format for compatibility
      return {
        type: 'iguana_checkin',
        venueId,
        venueName: '', // Will be fetched from Firestore
        timestamp: Date.now()
      }
    }
    
    // ✅ OLD: Backwards compatibility with JSON format
    const data = JSON.parse(qrContent) as QRData

    // Validate structure
    if (
      data.type !== 'iguana_checkin' ||
      !data.venueId ||
      !data.venueName ||
      !data.timestamp
    ) {
      console.warn('⚠️ Invalid QR data structure')
      return null
    }

    // Check if QR is not too old (e.g., 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    if (data.timestamp < thirtyDaysAgo) {
      console.warn('⚠️ QR code is too old')
      return null
    }

    console.log('✅ QR data validated:', data.venueName)
    return data
  } catch (error) {
    console.error('❌ Error validating QR data:', error)
    return null
  }
}

/**
 * Create printable QR code HTML template
 */
export function createPrintableQRTemplate(
  qrDataURL: string,
  venueName: string,
  venueAddress: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>IGUANA BAR - ${venueName} - QR Code</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #1a4d3e 0%, #0d2920 100%);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          text-align: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 60px;
          border-radius: 30px;
          border: 3px solid #4ade80;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .logo {
          font-size: 80px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 48px;
          font-weight: 900;
          margin: 0 0 10px 0;
          color: #4ade80;
          letter-spacing: 2px;
        }
        .tagline {
          font-size: 24px;
          margin: 0 0 40px 0;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }
        .qr-container {
          background: white;
          padding: 30px;
          border-radius: 20px;
          display: inline-block;
          margin: 30px 0;
          box-shadow: 0 10px 40px rgba(74, 222, 128, 0.3);
        }
        .qr-code {
          width: 400px;
          height: 400px;
          display: block;
        }
        .venue-name {
          font-size: 36px;
          font-weight: 700;
          margin: 30px 0 10px 0;
          color: white;
        }
        .venue-address {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 40px;
        }
        .instructions {
          font-size: 28px;
          margin: 30px 0;
          padding: 30px;
          background: rgba(74, 222, 128, 0.1);
          border-radius: 15px;
          border: 2px solid rgba(74, 222, 128, 0.3);
        }
        .step {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 15px 0;
        }
        .step-number {
          background: #4ade80;
          color: #0d2920;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 20px;
        }
        .footer {
          margin-top: 40px;
          font-size: 18px;
          color: rgba(255, 255, 255, 0.5);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🦎</div>
        <h1>IGUANA BAR</h1>
        <div class="tagline">Meet. Match. Mingle.</div>
        
        <div class="qr-container">
          <img src="${qrDataURL}" alt="QR Code" class="qr-code">
        </div>
        
        <div class="venue-name">${venueName}</div>
        <div class="venue-address">📍 ${venueAddress}</div>
        
        <div class="instructions">
          <div class="step">
            <div class="step-number">1</div>
            <div>Open I4IGUANA app</div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div>Scan this QR code</div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div>Start matching!</div>
          </div>
        </div>
        
        <div class="footer">
          Powered by I4IGUANA - The Proximity Dating Revolution
        </div>
      </div>
    </body>
    </html>
  `
}
