"use client"

/**
 * 🔍 Searchable Select Modal - I4IGUANA
 * 
 * Hollywood-style searchable dropdown with:
 * - Real-time search filtering
 * - Beautiful animations
 * - RTL support
 * - Mobile-friendly bottom sheet design
 */

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Check, ChevronDown } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface SearchableSelectModalProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder: string
  icon?: string
  label?: string
}

export default function SearchableSelectModal({
  value,
  onValueChange,
  options,
  placeholder,
  icon = "📋",
  label
}: SearchableSelectModalProps) {
  const { isRTL } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOptions, setFilteredOptions] = useState(options)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(options)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = options.filter(option => 
        option.toLowerCase().includes(query)
      )
      setFilteredOptions(filtered)
    }
  }, [searchQuery, options])

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  const handleSelect = (option: string) => {
    onValueChange(option)
    setIsOpen(false)
  }

  // Get display value (show selected or placeholder)
  const displayValue = value || placeholder

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-white/10 border border-white/20 text-white h-12 rounded-xl px-4 flex items-center justify-between hover:bg-white/15 transition-colors"
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        <span className={`truncate ${!value ? 'text-white/50' : 'text-white'}`}>
          {displayValue}
        </span>
        <ChevronDown className={`h-5 w-5 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] max-h-[85vh] rounded-t-3xl overflow-hidden"
              style={{ direction: isRTL ? 'rtl' : 'ltr' }}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d2920] via-[#1a4d3e] to-[#0d2920] opacity-95" />
              
              {/* Content */}
              <div className="relative">
                {/* Handle Bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-white/30 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>{icon}</span>
                    {label || placeholder}
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Search Box */}
                <div className="px-5 py-4">
                  <div className="relative">
                    <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-white/50`} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isRTL ? "🔍 חפש..." : "🔍 Search..."}
                      className={`w-full bg-white/10 border border-white/20 rounded-xl py-3 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-white placeholder-white/50 focus:outline-none focus:border-[#4ade80]/50 focus:ring-2 focus:ring-[#4ade80]/20 transition-all`}
                      style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors`}
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Options List */}
                <div className="overflow-y-auto max-h-[50vh] px-3 pb-8">
                  {filteredOptions.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="text-4xl">🔍</span>
                      <p className="text-white/50 mt-2">
                        {isRTL ? 'לא נמצאו תוצאות' : 'No results found'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredOptions.map((option, index) => {
                        const isSelected = option === value
                        return (
                          <motion.button
                            key={option}
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.2 }}
                            onClick={() => handleSelect(option)}
                            className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all ${
                              isSelected 
                                ? 'bg-[#4ade80]/20 border border-[#4ade80]/50' 
                                : 'bg-white/5 hover:bg-white/10 border border-transparent'
                            }`}
                          >
                            <span className={`text-${isRTL ? 'right' : 'left'} ${isSelected ? 'text-[#4ade80] font-semibold' : 'text-white'}`}>
                              {option}
                            </span>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex-shrink-0"
                              >
                                <Check className="h-5 w-5 text-[#4ade80]" />
                              </motion.div>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Safe Area Padding */}
                <div className="h-[env(safe-area-inset-bottom,0px)]" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
