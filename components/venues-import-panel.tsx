'use client'

/**
 * 🦎 I4IGUANA - Venues Import Admin Panel
 * 
 * Import venues from Google Places for any city in Israel
 * Full CRUD for venues management
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, Search, RefreshCw, Check, X, Loader2,
  Download, Trash2, Eye, EyeOff, Building2, Globe,
  Star, Users, Filter, ChevronDown
} from 'lucide-react'
import {
  ISRAEL_CITIES,
  VENUE_TYPES,
  VenueType,
  ImportedVenue,
  CityConfig,
  searchGooglePlaces,
  convertGooglePlaceToVenue,
  saveVenuesToFirebase,
  getImportedVenues,
  toggleVenueActive,
  deleteVenue,
  getVenueTypeLabel,
  getImportStats,
  GooglePlaceResult
} from '@/lib/google-places-import'

interface VenuesImportPanelProps {
  onMessage?: (type: 'success' | 'error', text: string) => void
}

export default function VenuesImportPanel({ onMessage }: VenuesImportPanelProps) {
  // Selection state
  const [selectedCity, setSelectedCity] = useState<CityConfig | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<VenueType[]>(['bar', 'night_club'])
  const [radius, setRadius] = useState(5000)
  
  // Search results
  const [searchResults, setSearchResults] = useState<ImportedVenue[]>([])
  const [selectedVenues, setSelectedVenues] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  
  // Existing venues
  const [existingVenues, setExistingVenues] = useState<ImportedVenue[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [filterCity, setFilterCity] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  
  // Stats
  const [stats, setStats] = useState<{
    total: number
    active: number
    byCity: Record<string, number>
    byType: Record<string, number>
  } | null>(null)
  
  // UI state
  const [activeView, setActiveView] = useState<'import' | 'manage'>('import')
  const [saving, setSaving] = useState(false)

  // Load existing venues and stats on mount
  useEffect(() => {
    loadExistingVenues()
    loadStats()
  }, [])

  const loadExistingVenues = async () => {
    setLoadingExisting(true)
    try {
      const venues = await getImportedVenues()
      setExistingVenues(venues)
    } catch (err) {
      console.error('Failed to load venues:', err)
      onMessage?.('error', 'Failed to load existing venues')
    } finally {
      setLoadingExisting(false)
    }
  }

  const loadStats = async () => {
    try {
      const s = await getImportStats()
      setStats(s)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleSearch = async () => {
    if (!selectedCity) {
      onMessage?.('error', 'Please select a city')
      return
    }
    
    if (selectedTypes.length === 0) {
      onMessage?.('error', 'Please select at least one venue type')
      return
    }
    
    setSearching(true)
    setSearchResults([])
    setSelectedVenues(new Set())
    
    try {
      const results = await searchGooglePlaces(
        selectedCity.lat,
        selectedCity.lng,
        radius,
        selectedTypes
      )
      
      // Convert to our format
      const venues = results.map(r => 
        convertGooglePlaceToVenue(r, selectedCity.name, selectedCity.country)
      )
      
      // Filter out already imported venues
      const existingIds = new Set(existingVenues.map(v => v.id))
      const newVenues = venues.filter(v => !existingIds.has(v.id))
      
      setSearchResults(newVenues)
      
      if (newVenues.length === 0 && venues.length > 0) {
        onMessage?.('success', `Found ${venues.length} venues, but all already imported!`)
      } else {
        onMessage?.('success', `Found ${newVenues.length} new venues (${venues.length - newVenues.length} already imported)`)
      }
      
      // Auto-select bars and clubs
      const autoSelect = new Set<string>()
      newVenues.forEach(v => {
        if (v.types.includes('bar') || v.types.includes('night_club')) {
          autoSelect.add(v.id)
        }
      })
      setSelectedVenues(autoSelect)
      
    } catch (err: any) {
      console.error('Search failed:', err)
      onMessage?.('error', err.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleImport = async () => {
    if (selectedVenues.size === 0) {
      onMessage?.('error', 'Please select venues to import')
      return
    }
    
    setSaving(true)
    
    try {
      const venuesToImport = searchResults.filter(v => selectedVenues.has(v.id))
      const saved = await saveVenuesToFirebase(venuesToImport)
      
      onMessage?.('success', `✅ Imported ${saved} venues to Firebase!`)
      
      // Refresh existing venues
      await loadExistingVenues()
      await loadStats()
      
      // Clear search results
      setSearchResults([])
      setSelectedVenues(new Set())
      
    } catch (err: any) {
      console.error('Import failed:', err)
      onMessage?.('error', err.message || 'Import failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleVenueSelection = (id: string) => {
    const newSelected = new Set(selectedVenues)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedVenues(newSelected)
  }

  const selectAll = () => {
    setSelectedVenues(new Set(searchResults.map(v => v.id)))
  }

  const clearSelection = () => {
    setSelectedVenues(new Set())
  }

  const handleToggleActive = async (venue: ImportedVenue) => {
    try {
      await toggleVenueActive(venue.id, !venue.active)
      // Update local state
      setExistingVenues(prev => 
        prev.map(v => v.id === venue.id ? { ...v, active: !v.active } : v)
      )
      await loadStats()
      onMessage?.('success', `${venue.name} ${venue.active ? 'disabled' : 'enabled'}`)
    } catch (err) {
      onMessage?.('error', 'Failed to update venue')
    }
  }

  const handleDelete = async (venue: ImportedVenue) => {
    if (!confirm(`Delete "${venue.name}"? This cannot be undone.`)) return
    
    try {
      await deleteVenue(venue.id)
      setExistingVenues(prev => prev.filter(v => v.id !== venue.id))
      await loadStats()
      onMessage?.('success', `Deleted ${venue.name}`)
    } catch (err) {
      onMessage?.('error', 'Failed to delete venue')
    }
  }

  // Filter existing venues
  const filteredVenues = existingVenues.filter(v => {
    if (filterCity !== 'all' && v.city !== filterCity) return false
    if (filterActive === 'active' && !v.active) return false
    if (filterActive === 'inactive' && v.active) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4">
          <Building2 className="w-6 h-6 mb-1 opacity-80" />
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
          <div className="text-purple-200 text-sm">Total Venues</div>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4">
          <Check className="w-6 h-6 mb-1 opacity-80" />
          <div className="text-2xl font-bold">{stats?.active || 0}</div>
          <div className="text-green-200 text-sm">Active</div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4">
          <Globe className="w-6 h-6 mb-1 opacity-80" />
          <div className="text-2xl font-bold">{Object.keys(stats?.byCity || {}).length}</div>
          <div className="text-blue-200 text-sm">Cities</div>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-4">
          <MapPin className="w-6 h-6 mb-1 opacity-80" />
          <div className="text-2xl font-bold">{ISRAEL_CITIES.length}</div>
          <div className="text-orange-200 text-sm">Available Cities</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('import')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeView === 'import'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🔍 Import New Venues
        </button>
        <button
          onClick={() => setActiveView('manage')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeView === 'manage'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          📋 Manage Venues ({existingVenues.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* IMPORT VIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeView === 'import' && (
        <div className="space-y-4">
          {/* City Selection */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-400" />
              Select City 🇮🇱
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {ISRAEL_CITIES.map(city => (
                <button
                  key={city.name}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedCity?.name === city.name
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {city.nameHe}
                </button>
              ))}
            </div>
          </div>

          {/* Venue Types */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-400" />
              Venue Types
            </h3>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(VENUE_TYPES) as [VenueType, typeof VENUE_TYPES[VenueType]][]).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => {
                    if (selectedTypes.includes(key)) {
                      setSelectedTypes(prev => prev.filter(t => t !== key))
                    } else {
                      setSelectedTypes(prev => [...prev, key])
                    }
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    selectedTypes.includes(key)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              Search Radius: {radius / 1000} km
            </h3>
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>1 km</span>
              <span>5 km</span>
              <span>10 km</span>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={searching || !selectedCity}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {searching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching Google Places...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search {selectedCity?.name || 'City'}
              </>
            )}
          </button>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  Found {searchResults.length} New Venues
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map(venue => {
                  const typeInfo = getVenueTypeLabel(venue.types)
                  return (
                    <div
                      key={venue.id}
                      onClick={() => toggleVenueSelection(venue.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                        selectedVenues.has(venue.id)
                          ? 'bg-green-500/20 border border-green-500'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        selectedVenues.has(venue.id) ? 'bg-green-500' : 'bg-gray-600'
                      }`}>
                        {selectedVenues.has(venue.id) && <Check className="w-4 h-4" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          <span>{typeInfo.icon}</span>
                          {venue.name}
                        </div>
                        <div className="text-sm text-gray-400">{venue.address}</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          {venue.rating || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">{typeInfo.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={saving || selectedVenues.size === 0}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Import {selectedVenues.size} Selected Venues
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MANAGE VIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeView === 'manage' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 bg-gray-800 rounded-xl p-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">City</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="bg-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="all">All Cities</option>
                {[...new Set(existingVenues.map(v => v.city))].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 block mb-1">Status</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
                className="bg-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="all">All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <button
              onClick={loadExistingVenues}
              disabled={loadingExisting}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2 self-end"
            >
              <RefreshCw className={`w-4 h-4 ${loadingExisting ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Venues List */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-4">
              {filteredVenues.length} Venues
            </h3>
            
            {loadingExisting ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredVenues.map(venue => {
                  const typeInfo = getVenueTypeLabel(venue.types)
                  return (
                    <div
                      key={venue.id}
                      className={`p-3 rounded-lg flex items-center gap-3 ${
                        venue.active ? 'bg-gray-700' : 'bg-gray-700/50 opacity-60'
                      }`}
                    >
                      <div className="text-2xl">{typeInfo.icon}</div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{venue.name}</div>
                        <div className="text-sm text-gray-400 truncate">{venue.address}</div>
                        <div className="text-xs text-gray-500">
                          {venue.city} • {typeInfo.label} • ⭐ {venue.rating || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(venue)}
                          className={`p-2 rounded-lg transition-colors ${
                            venue.active
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                          }`}
                          title={venue.active ? 'Disable' : 'Enable'}
                        >
                          {venue.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(venue)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                
                {filteredVenues.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No venues found. Import some!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
