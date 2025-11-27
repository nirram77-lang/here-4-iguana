"use client"

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateQRData, QRData } from '@/lib/qr-service'
import jsQR from 'jsqr'

interface QRScannerProps {
  onScanSuccess: (data: QRData) => void
  onClose: () => void
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    startCamera()
    
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      console.log('📷 Starting camera...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
        setError(null)
        console.log('✅ Camera started')
        
        // Start scanning
        scanQRCode()
      }
    } catch (err: any) {
      console.error('❌ Camera error:', err)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      console.log('📷 Camera stopped')
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setCameraActive(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        if (code) {
          console.log('📸 QR Code detected:', code.data)
          
          // Validate QR data
          const qrData = validateQRData(code.data)
          
          if (qrData) {
            console.log('✅ Valid Iguana Bar QR code')
            setScanning(true)
            
            // Success animation, then callback
            setTimeout(() => {
              onScanSuccess(qrData)
            }, 500)
            
            return // Stop scanning
          } else {
            console.warn('⚠️ Invalid QR code - not an Iguana Bar code')
            setError('Invalid QR code. Please scan an Iguana Bar code.')
            
            // Clear error after 2 seconds
            setTimeout(() => setError(null), 2000)
          }
        }
      }
      
      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(scan)
    }
    
    scan()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <h1 className="text-white text-2xl font-bold">
              Scan QR Code
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Video Preview */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Scanning frame */}
          <motion.div
            animate={scanning ? { scale: 0.95, opacity: 0 } : {}}
            transition={{ duration: 0.3 }}
            className="relative w-64 h-64"
          >
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#4ade80]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#4ade80]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#4ade80]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#4ade80]" />
            
            {/* Scanning line animation */}
            {cameraActive && !scanning && (
              <motion.div
                animate={{ y: [0, 256, 0] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#4ade80] to-transparent opacity-50"
              />
            )}
          </motion.div>

          {/* Success animation - Elegant Iguana + Checkmark */}
          {scanning && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#4ade80]/20 via-[#22c55e]/10 to-transparent"
            >
              {/* Single elegant ripple */}
              <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ 
                  scale: [0, 2.5],
                  opacity: [0.6, 0]
                }}
                transition={{ 
                  duration: 1.2,
                  ease: "easeOut"
                }}
                className="absolute w-64 h-64 rounded-full border-4 border-[#4ade80]"
              />

              {/* Center container */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ 
                  scale: [0, 1.2, 1],
                  rotate: 0
                }}
                transition={{ 
                  duration: 0.5,
                  ease: "easeOut"
                }}
                className="relative flex items-center justify-center"
              >
                {/* Green checkmark background */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center"
                  style={{
                    boxShadow: '0 0 40px rgba(74, 222, 128, 0.6), 0 0 80px rgba(34, 197, 94, 0.3)'
                  }}
                >
                  {/* Elegant checkmark */}
                  <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-white"
                  >
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                      <motion.path
                        d="M5 13l4 4L19 7"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
                      />
                    </svg>
                  </motion.div>
                </motion.div>

                {/* Small elegant iguana on top */}
                <motion.div
                  initial={{ scale: 0, y: -20, opacity: 0 }}
                  animate={{ 
                    scale: 1,
                    y: -50,
                    opacity: 1
                  }}
                  transition={{ 
                    delay: 0.4,
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  className="absolute z-10"
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      y: [0, -3, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-6xl filter drop-shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 4px 12px rgba(74, 222, 128, 0.5))'
                    }}
                  >
                    🦎
                  </motion.div>
                </motion.div>

                {/* Subtle sparkles */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      scale: 0,
                      x: 0,
                      y: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      scale: [0, 1, 0],
                      x: Math.cos((i / 4) * Math.PI * 2) * 80,
                      y: Math.sin((i / 4) * Math.PI * 2) * 80,
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: 0.5 + i * 0.05,
                      ease: "easeOut"
                    }}
                    className="absolute w-2 h-2 rounded-full bg-[#4ade80]"
                    style={{
                      boxShadow: '0 0 10px #4ade80'
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          {error ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl mb-4"
            >
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </motion.div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-3">
                <Camera className="h-5 w-5 text-[#4ade80]" />
                <span className="text-white text-sm font-medium">
                  {cameraActive ? 'Point camera at QR code' : 'Starting camera...'}
                </span>
              </div>
              
              <p className="text-white/60 text-sm">
                🦎 Look for the Iguana Bar QR code at the venue entrance
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
