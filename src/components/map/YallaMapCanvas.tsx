'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Crosshair,
  Navigation,
  Users,
  Calendar,
  X,
  Compass,
  List,
  Layers,
  MapPin,
  ExternalLink,
  Radio,
  Shield,
  Clock,
  Sparkles,
  CloudSun,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { MapVenue, MapFilterCategory } from '@/lib/venues/types';

interface YallaMapCanvasProps {
  initialVenues: MapVenue[];
  initialStats: {
    totalVenues: number;
    liveMatches: number;
    todayMatches: number;
  };
  locale?: string;
}

declare global {
  interface Window {
    L: any;
  }
}

// Sound FX generator using Web Audio API
class MapAudioEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playRadarPing() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1080, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {}
  }

  playSelectBeacon() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.19);
    } catch {}
  }
}

const audioFX = new MapAudioEffects();

// Top Football Capitals for instant fly-to
const TOP_CAPITALS = [
  { name: 'الرياض', nameEn: 'Riyadh', flag: '🇸🇦', lat: 24.7136, lng: 46.6753, zoom: 11 },
  { name: 'مدريد', nameEn: 'Madrid', flag: '🇪🇸', lat: 40.4531, lng: -3.6883, zoom: 12 },
  { name: 'برشلونة', nameEn: 'Barcelona', flag: '🇪🇸', lat: 41.3809, lng: 2.1228, zoom: 12 },
  { name: 'لندن', nameEn: 'London', flag: '🇬🇧', lat: 51.556, lng: -0.2796, zoom: 11 },
  { name: 'الدوحة', nameEn: 'Doha', flag: '🇶🇦', lat: 25.4208, lng: 51.4903, zoom: 11 },
  { name: 'القاهرة', nameEn: 'Cairo', flag: '🇪🇬', lat: 30.0691, lng: 31.3122, zoom: 11 },
  { name: 'ميلانو', nameEn: 'Milan', flag: '🇮🇹', lat: 45.4781, lng: 9.124, zoom: 12 },
  { name: 'ميونخ', nameEn: 'Munich', flag: '🇩🇪', lat: 48.2188, lng: 11.6247, zoom: 12 },
];

export default function YallaMapCanvas({
  initialVenues,
  initialStats,
  locale = 'ar',
}: YallaMapCanvasProps) {
  const isRtl = locale === 'ar';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseTileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [venues, setVenues] = useState<MapVenue[]>(initialVenues);
  const [selectedVenue, setSelectedVenue] = useState<MapVenue | null>(null);
  const [activeCategory, setActiveCategory] = useState<MapFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showListView, setShowListView] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'voyager'>('dark');
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'matches' | 'navigation'>('overview');

  // Sync sound settings
  useEffect(() => {
    audioFX.enabled = soundEnabled;
  }, [soundEnabled]);

  // 1. Dynamically load Leaflet script & CSS once on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    cssLink.crossOrigin = '';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Filter venues based on search, category & radius
  const filteredVenues = useMemo(() => {
    let result = [...venues];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.nameAr.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.cityAr.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.countryAr.toLowerCase().includes(q) ||
          v.teamName.toLowerCase().includes(q)
      );
    }

    if (activeCategory === 'stadium') {
      result = result.filter((v) => v.category === 'stadium');
    } else if (activeCategory === 'club') {
      result = result.filter((v) => Boolean(v.teamSlug));
    } else if (activeCategory === 'live') {
      result = result.filter((v) => v.nextMatch?.isLive);
    } else if (activeCategory === 'today') {
      result = result.filter((v) => Boolean(v.nextMatch));
    }

    // Radius filter when user location is available
    if (userLocation && selectedRadiusKm !== null) {
      result = result.filter((v) => (v.distanceKm ?? 999999) <= selectedRadiusKm);
    }

    // Sort by distance if user location is available
    if (userLocation) {
      result.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
    }

    return result;
  }, [venues, searchQuery, activeCategory, userLocation, selectedRadiusKm]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    // Center map around Middle East / Europe intersection initially
    const map = L.map(mapContainerRef.current, {
      center: [28.0, 42.0],
      zoom: 4,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
    });

    // Tile providers: Dark Matter by default
    const darkTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }
    );

    darkTile.addTo(map);
    baseTileLayerRef.current = darkTile;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  // Handle Map Style (Dark / Satellite / Voyager)
  const changeMapStyle = (style: 'dark' | 'satellite' | 'voyager') => {
    setMapStyle(style);
    if (!mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;
    const L = window.L;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let newLayer;
    if (style === 'satellite') {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      );
    } else if (style === 'voyager') {
      newLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      );
    } else {
      newLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      );
    }

    newLayer.addTo(map);
    baseTileLayerRef.current = newLayer;
  };

  // Select venue handler with sound
  const handleSelectVenue = useCallback((venue: MapVenue) => {
    setSelectedVenue(venue);
    setShowListView(false);
    audioFX.playSelectBeacon();

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([venue.latitude, venue.longitude], 14, {
        animate: true,
        duration: 1.4,
      });
    }
  }, []);

  // 3. Render Custom Markers with glowing luxury badges
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !window.L) return;

    const L = window.L;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    filteredVenues.forEach((venue) => {
      const isSelected = selectedVenue?.id === venue.id;
      const isLive = venue.nextMatch?.isLive;
      const hasTodayMatch = Boolean(venue.nextMatch);

      let markerHtml = '';

      if (isLive) {
        // Red Pulsing High-Tech Beacon for Live Matches
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-red-500 opacity-60"></span>
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-red-600/40 blur-sm"></span>
            <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-red-700 via-rose-600 to-red-500 text-white shadow-xl shadow-red-500/60 border-2 border-white transition-all transform group-hover:scale-125 ${
              isSelected ? 'scale-125 ring-4 ring-red-400' : ''
            }">
              <span class="text-xs font-black">🔴</span>
            </div>
            <div class="absolute -top-7 px-2.5 py-0.5 rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg border border-red-300 uppercase tracking-wider whitespace-nowrap animate-bounce">
              مباشر ${venue.nextMatch?.minute ? venue.nextMatch.minute + "'" : ''}
            </div>
          </div>
        `;
      } else if (hasTodayMatch) {
        // Golden / Emerald Match Day Beacon
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute inline-flex h-9 w-9 animate-pulse rounded-full bg-amber-400 opacity-50"></span>
            <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-amber-500 text-white shadow-lg shadow-emerald-500/50 border-2 border-amber-300 transition-all transform group-hover:scale-125 ${
              isSelected ? 'scale-125 ring-4 ring-amber-400' : ''
            }">
              <span class="text-xs font-bold">⚽</span>
            </div>
            <div class="absolute -bottom-5 px-2 py-0.2 rounded-full bg-slate-900/95 text-[9px] font-bold text-amber-300 border border-amber-500/40 shadow whitespace-nowrap">
              اليوم
            </div>
          </div>
        `;
      } else {
        // Luxury Emerald Stadium Pin
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-950/90 border-2 border-emerald-400 text-emerald-400 shadow-xl shadow-emerald-500/20 transition-all transform group-hover:scale-125 ${
              isSelected
                ? 'scale-125 ring-4 ring-emerald-400 bg-emerald-500 text-slate-950 font-black'
                : 'hover:border-emerald-300 hover:text-white'
            }">
              <span class="text-[12px]">🏟️</span>
            </div>
          </div>
        `;
      }

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-venue-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([venue.latitude, venue.longitude], { icon });

      marker.on('click', () => {
        handleSelectVenue(venue);
      });

      // Glassmorphic rich tooltip
      marker.bindTooltip(
        `<div class="text-right font-sans p-1.5 bg-slate-950/95 text-white rounded-xl border border-slate-700/80 shadow-2xl">
          <div class="font-black text-xs text-white">${isRtl ? venue.nameAr : venue.name}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${isRtl ? venue.cityAr : venue.city} • <span class="text-emerald-400 font-bold">${venue.teamName}</span></div>
          <div class="text-[9px] text-slate-400 flex items-center gap-1 mt-1">
            <span>👥 ${venue.capacity.toLocaleString('en-US')}</span>
            ${venue.distanceKm !== undefined ? `<span>• 📍 ${venue.distanceKm} كم</span>` : ''}
          </div>
        </div>`,
        { direction: 'top', offset: [0, -14], opacity: 1 }
      );

      layer.addLayer(marker);
    });
  }, [filteredVenues, selectedVenue, isRtl, handleSelectVenue]);

  // 4. Geolocation GPS activation with Radar Pulse & Precision Circle
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert(isRtl ? 'الموقع الجغرافي غير مدعوم في متصفحك' : 'Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    audioFX.playRadarPing();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy });
        setLocating(false);

        // Fetch / recalculate distances from API
        fetch(`/api/map/venues?lat=${latitude}&lng=${longitude}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.venues) {
              setVenues(data.venues);
            }
          })
          .catch(() => {});

        if (mapInstanceRef.current && window.L) {
          const L = window.L;
          const map = mapInstanceRef.current;

          map.flyTo([latitude, longitude], 12, {
            animate: true,
            duration: 1.8,
          });

          // Draw / update GPS accuracy circle
          if (userAccuracyCircleRef.current) {
            userAccuracyCircleRef.current.setLatLng([latitude, longitude]);
            userAccuracyCircleRef.current.setRadius(accuracy || 1500);
          } else {
            userAccuracyCircleRef.current = L.circle([latitude, longitude], {
              radius: accuracy || 1500,
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: 0.12,
              weight: 1.5,
              dashArray: '4, 6',
            }).addTo(map);
          }

          // Draw user pulsing radar beacon
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const userHtml = `
              <div class="relative flex items-center justify-center">
                <span class="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-cyan-400 opacity-60"></span>
                <span class="absolute inline-flex h-8 w-8 rounded-full bg-cyan-500/30 blur-sm"></span>
                <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 text-white shadow-2xl shadow-cyan-500/80 border-2 border-white">
                  <div class="w-2.5 h-2.5 rounded-full bg-white shadow"></div>
                </div>
              </div>
            `;
            const userIcon = L.divIcon({
              html: userHtml,
              className: 'user-pin',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });
            userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
              .addTo(map)
              .bindTooltip(isRtl ? '📍 موقعك الحالي' : '📍 You are here', { permanent: true, direction: 'top' });
          }
        }
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err);
        alert(
          isRtl
            ? 'تعذر تحديد موقعك الحالي. يرجى تفعيل إذن الوصول للموقع (GPS) في المتصفح.'
            : 'Could not access your GPS location. Please allow location permissions in your browser.'
        );
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  // Fly to top capital
  const handleFlyToCapital = (cap: typeof TOP_CAPITALS[0]) => {
    audioFX.playRadarPing();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cap.lat, cap.lng], cap.zoom, {
        animate: true,
        duration: 1.6,
      });
    }
  };

  // Copy GPS Coordinates
  const handleCopyCoords = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-4.5rem)] bg-slate-950 overflow-hidden font-sans select-none">
      {/* MAP CANVAS */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* TOP FLOATING SEARCH, FILTERS & CAPITALS BAR */}
      <div className="absolute top-4 inset-x-0 mx-auto max-w-4xl px-3 z-30 pointer-events-none">
        <div className="space-y-2.5 pointer-events-auto">
          {/* Main Search Row */}
          <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-2xl border border-slate-700/60 shadow-2xl rounded-2xl p-1.5 text-white transition-all ring-1 ring-white/10">
            <div className="flex items-center flex-1 px-3 gap-2.5">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isRtl
                    ? 'ابحث عن ملعب، نادي، مدينة، أو دولة...'
                    : 'Search stadium, club, city, or country...'
                }
                className="w-full bg-transparent border-none outline-none text-sm md:text-base text-white placeholder-slate-400 py-1.5 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* GPS My Location Button */}
            <button
              onClick={handleLocateUser}
              disabled={locating}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 shadow-lg ${
                userLocation
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-cyan-500/20 ring-2 ring-cyan-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-emerald-500/30'
              }`}
              title={isRtl ? 'تفعيل نظام GPS وتحديد موقعي' : 'Enable GPS and find my location'}
            >
              <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin text-white' : ''}`} />
              <span className="hidden sm:inline">
                {locating
                  ? isRtl
                    ? 'جارِ تحديد الـ GPS...'
                    : 'Locating GPS...'
                  : userLocation
                  ? isRtl
                    ? '📍 موقعي نشط'
                    : '📍 GPS Locked'
                  : isRtl
                  ? '📍 موقعي (GPS)'
                  : '📍 My GPS'}
              </span>
            </button>

            {/* Map Style Switcher (Dark / Satellite / Voyager) */}
            <div className="flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-slate-700/60 shrink-0">
              <button
                onClick={() => changeMapStyle('dark')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapStyle === 'dark'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isRtl ? 'الوضع الليلي الداكن' : 'Night Pitch (Dark)'}
              >
                🌙
              </button>
              <button
                onClick={() => changeMapStyle('satellite')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mapStyle === 'satellite'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={isRtl ? 'أقمار صناعية واقعية للملاعب' : 'Photorealistic Satellite'}
              >
                🛰️
              </button>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-xs font-bold transition-all shrink-0 bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60"
              title={isRtl ? 'المؤثرات الصوتية للرادار' : 'Radar audio effects'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* List Toggle Button */}
            <button
              onClick={() => setShowListView(!showListView)}
              className={`p-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                showListView
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/60'
              }`}
              title={isRtl ? 'دليل القائمة' : 'Directory list'}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Pills (Horizontal Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: isRtl ? '🌐 كل الملاعب' : '🌐 All Venues', count: venues.length },
              {
                id: 'live',
                label: isRtl ? '🔴 مباريات جارية الآن' : '🔴 Live Now',
                count: initialStats.liveMatches,
                highlight: true,
              },
              {
                id: 'today',
                label: isRtl ? '📅 مباريات اليوم' : "📅 Today's Matches",
                count: initialStats.todayMatches,
              },
              { id: 'stadium', label: isRtl ? '🏟️ ملاعب رئيسية' : '🏟️ Stadiums' },
              { id: 'club', label: isRtl ? '🛡️ مقرات الأندية' : '🛡️ Clubs' },
            ].map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as MapFilterCategory)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-md backdrop-blur-xl ${
                    active
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-500/30 ring-2 ring-emerald-400'
                      : cat.highlight && cat.count && cat.count > 0
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                      : 'bg-slate-950/80 text-slate-300 border border-slate-700/50 hover:bg-slate-900'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.count !== undefined && cat.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        active
                          ? 'bg-slate-950 text-white'
                          : cat.highlight
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Top Capitals Quick Jump Bar */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] text-slate-400 font-bold px-1 shrink-0 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              {isRtl ? 'انتقال سريع:' : 'Quick Jump:'}
            </span>
            {TOP_CAPITALS.map((cap) => (
              <button
                key={cap.nameEn}
                onClick={() => handleFlyToCapital(cap)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-900/75 hover:bg-slate-800/90 text-slate-300 border border-slate-700/40 backdrop-blur whitespace-nowrap transition-all"
              >
                <span>{cap.flag}</span>
                <span>{isRtl ? cap.name : cap.nameEn}</span>
              </button>
            ))}
          </div>

          {/* GPS Radius Filter Pills (Shown only when user location is locked) */}
          {userLocation && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 animate-in fade-in duration-300">
              <span className="text-[11px] text-cyan-400 font-bold px-1 shrink-0 flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" />
                {isRtl ? 'نطاق البحث حولي:' : 'Radius around me:'}
              </span>
              {[
                { label: isRtl ? 'الكل' : 'All', km: null },
                { label: '50 كم', km: 50 },
                { label: '100 كم', km: 100 },
                { label: '300 كم', km: 300 },
                { label: '1,000 كم', km: 1000 },
              ].map((rad) => {
                const isSelected = selectedRadiusKm === rad.km;
                return (
                  <button
                    key={rad.label}
                    onClick={() => setSelectedRadiusKm(rad.km)}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900/80 text-cyan-300 border border-cyan-800/40 hover:bg-slate-800'
                    }`}
                  >
                    {rad.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FLOATING SUMMARY DOCK */}
      <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto z-20 pointer-events-none">
        <div className="inline-flex items-center gap-3 bg-slate-950/85 backdrop-blur-2xl border border-slate-700/60 rounded-2xl px-4 py-2.5 text-xs text-slate-300 shadow-2xl pointer-events-auto ring-1 ring-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white">
              {isRtl ? 'خريطة يلا سبورت' : 'Yalla Sport Map'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-emerald-400 font-bold">{filteredVenues.length}</span>{' '}
            {isRtl ? 'موقع رياضي معروض' : 'venues shown'}
          </div>
          {initialStats.liveMatches > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>{initialStats.liveMatches}</span> {isRtl ? 'مباشر الآن' : 'live now'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* VENUE LIST SIDEBAR / DRAWER MODAL */}
      {showListView && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-40 flex flex-col transition-all">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">
                {isRtl ? 'دليل الملاعب والأندية' : 'Venues & Stadiums Directory'}
              </h2>
            </div>
            <button
              onClick={() => setShowListView(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
            {filteredVenues.map((venue) => {
              const isSelected = selectedVenue?.id === venue.id;
              return (
                <div
                  key={venue.id}
                  onClick={() => handleSelectVenue(venue)}
                  className={`pt-2.5 first:pt-0 cursor-pointer group transition-all p-2 rounded-xl ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/50'
                      : 'hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700/60 shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-emerald-400">
                          {isRtl ? venue.nameAr : venue.name}
                        </h3>
                        {venue.distanceKm !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 shrink-0 font-medium">
                            {venue.distanceKm} {isRtl ? 'كم' : 'km'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {isRtl ? venue.cityAr : venue.city} • {venue.teamName}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-400" />
                          {venue.capacity.toLocaleString('en-US')}
                        </span>
                        {venue.nextMatch?.isLive && (
                          <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-bold animate-pulse">
                            مباشر {venue.nextMatch.homeScore}-{venue.nextMatch.awayScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredVenues.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                {isRtl ? 'لا توجد نتائج تطابق بحثك' : 'No venues matching your search'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SELECTED VENUE LUXURY BOTTOM SHEET / DRAWER */}
      {selectedVenue && (
        <div className="absolute inset-x-0 bottom-0 max-w-2xl mx-auto z-40 p-2 sm:p-4 animate-in slide-in-from-bottom duration-300">
          <div className="relative bg-slate-950/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-white ring-1 ring-white/10">
            {/* Header / Cover Image */}
            <div className="relative h-48 sm:h-56 w-full overflow-hidden">
              <img
                src={selectedVenue.imageUrl}
                alt={selectedVenue.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedVenue(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur transition-all border border-slate-700/60"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Distance Badge if available */}
              {selectedVenue.distanceKm !== undefined && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 text-xs font-bold backdrop-blur shadow-lg shadow-cyan-950/50">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>
                    {isRtl ? `على بعد ${selectedVenue.distanceKm} كم` : `${selectedVenue.distanceKm} km away`}
                  </span>
                </div>
              )}

              {/* Title & Tier Badge Overlay */}
              <div className="absolute bottom-3 inset-x-4 text-right">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏟️</span>
                    <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {isRtl ? selectedVenue.nameAr : selectedVenue.name}
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    UEFA Elite ⭐⭐⭐⭐⭐
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 drop-shadow mt-0.5">
                  {selectedVenue.name} • {isRtl ? selectedVenue.cityAr : selectedVenue.city}،{' '}
                  {isRtl ? selectedVenue.countryAr : selectedVenue.country} {selectedVenue.countryCode}
                </p>
              </div>
            </div>

            {/* Tab navigation inside drawer */}
            <div className="flex items-center border-b border-slate-800/80 px-4 bg-slate-900/40 text-xs font-bold">
              <button
                onClick={() => setActiveDrawerTab('overview')}
                className={`py-2.5 px-3 border-b-2 transition-all ${
                  activeDrawerTab === 'overview'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {isRtl ? '📋 تفاصيل الملعب' : '📋 Stadium Specs'}
              </button>
              <button
                onClick={() => setActiveDrawerTab('matches')}
                className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeDrawerTab === 'matches'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>{isRtl ? '⚽ المباريات' : '⚽ Fixtures'}</span>
                {selectedVenue.nextMatch?.isLive && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                )}
              </button>
              <button
                onClick={() => setActiveDrawerTab('navigation')}
                className={`py-2.5 px-3 border-b-2 transition-all ${
                  activeDrawerTab === 'navigation'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {isRtl ? '🧭 الملاحة والمسار' : '🧭 Navigation'}
              </button>
            </div>

            {/* Body Content */}
            <div className="p-4 sm:p-5 space-y-4">
              {activeDrawerTab === 'overview' && (
                <>
                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-900/60 rounded-2xl border border-slate-800 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {isRtl ? 'السعة الرسمية' : 'Capacity'}
                      </div>
                      <div className="text-sm font-black text-emerald-400 mt-0.5">
                        {selectedVenue.capacity.toLocaleString('en-US')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {isRtl ? 'أرضية الملعب' : 'Pitch Surface'}
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5">
                        {selectedVenue.surface || (isRtl ? 'عشب هجين طبيعي' : 'Hybrid Grass')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {isRtl ? 'سنة التدشين' : 'Inauguration'}
                      </div>
                      <div className="text-sm font-black text-slate-300 mt-0.5">
                        {selectedVenue.openedYear}
                      </div>
                    </div>
                  </div>

                  {/* Club info & GPS coords row */}
                  <div className="flex items-center justify-between text-xs p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-400">{isRtl ? 'النادي المستضيف:' : 'Home Club:'}</span>
                      <span className="font-bold text-white">{selectedVenue.teamName}</span>
                    </div>

                    <button
                      onClick={() => handleCopyCoords(selectedVenue.latitude, selectedVenue.longitude)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                      title={isRtl ? 'نسخ إحداثيات GPS' : 'Copy GPS coordinates'}
                    >
                      {copiedCoords ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{selectedVenue.latitude.toFixed(4)}, {selectedVenue.longitude.toFixed(4)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {activeDrawerTab === 'matches' && (
                <div className="space-y-3">
                  {selectedVenue.nextMatch ? (
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        selectedVenue.nextMatch.isLive
                          ? 'bg-red-950/40 border-red-500/60 text-white'
                          : 'bg-emerald-950/40 border-emerald-500/50 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-2.5">
                        <span className="flex items-center gap-1.5">
                          {selectedVenue.nextMatch.isLive ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                              <span className="text-red-400 font-black">
                                {isRtl ? 'مباراة جارية الآن' : 'Match Live Now'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">
                                {isRtl ? 'مباراة اليوم' : "Today's Match"}
                              </span>
                            </>
                          )}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {selectedVenue.nextMatch.competition}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-center py-1">
                        <div className="flex-1 font-bold text-sm sm:text-base truncate">
                          {selectedVenue.nextMatch.homeTeam}
                        </div>
                        <div className="px-3.5 py-1.5 bg-slate-900 rounded-xl font-mono text-base font-black border border-slate-700">
                          {selectedVenue.nextMatch.isLive
                            ? `${selectedVenue.nextMatch.homeScore ?? 0} - ${
                                selectedVenue.nextMatch.awayScore ?? 0
                              }`
                            : new Date(selectedVenue.nextMatch.kickoffAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                        </div>
                        <div className="flex-1 font-bold text-sm sm:text-base truncate">
                          {selectedVenue.nextMatch.awayTeam}
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        <Link
                          href={`/matches/${selectedVenue.nextMatch.matchId}`}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-md"
                        >
                          <span>{isRtl ? 'مركز المباراة والبث المباشر' : 'Match Center & Live Stream'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
                      {isRtl
                        ? 'لا توجد مباريات مجدولة اليوم على هذا الملعب. يمكنك متابعة جدول الدوري القادم.'
                        : 'No fixtures scheduled at this stadium today.'}
                    </div>
                  )}
                </div>
              )}

              {activeDrawerTab === 'navigation' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    {isRtl
                      ? 'اختر تطبيق الملاحة المفضل لديك للحصول على الاتجاهات الدقيقة ومسار القيادة إلى الملعب مباشرة:'
                      : 'Choose your preferred GPS navigation app to get turn-by-turn driving directions to the stadium:'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Google Maps */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.latitude},${selectedVenue.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs transition-all shadow"
                    >
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span>Google Maps</span>
                    </a>

                    {/* Apple Maps */}
                    <a
                      href={`https://maps.apple.com/?daddr=${selectedVenue.latitude},${selectedVenue.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs transition-all shadow"
                    >
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>Apple Maps</span>
                    </a>

                    {/* Waze */}
                    <a
                      href={`https://waze.com/ul?ll=${selectedVenue.latitude},${selectedVenue.longitude}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs transition-all shadow"
                    >
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>Waze</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Master Action Button */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.latitude},${selectedVenue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{isRtl ? 'الملاحة السريعة إلى الملعب' : 'Direct Navigation to Stadium'}</span>
                </a>

                {selectedVenue.teamSlug && (
                  <Link
                    href={`/teams/${selectedVenue.teamSlug}`}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all shrink-0"
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">{isRtl ? 'ملف النادي' : 'Club Profile'}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
