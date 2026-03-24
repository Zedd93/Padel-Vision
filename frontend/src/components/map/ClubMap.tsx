import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ClubMarker {
  id: string;
  name: string;
  slug: string;
  city: string;
  lat: number;
  lng: number;
  isLive: boolean;
  viewers?: number;
  courts?: number;
}

const DEMO_CLUBS: ClubMarker[] = [
  { id: '1', name: 'Racket Club Katowice', slug: 'racket-club', city: 'Katowice', lat: 50.2649, lng: 19.0238, isLive: true, viewers: 342, courts: 6 },
  { id: '2', name: 'Padel Kraków', slug: 'padel-krakow', city: 'Kraków', lat: 50.0647, lng: 19.945, isLive: true, viewers: 187, courts: 4 },
  { id: '3', name: 'Smash Arena Warszawa', slug: 'smash-arena', city: 'Warszawa', lat: 52.2297, lng: 21.0122, isLive: false, courts: 8 },
  { id: '4', name: 'Court Masters Gdańsk', slug: 'court-masters', city: 'Gdańsk', lat: 54.352, lng: 18.6466, isLive: false, courts: 3 },
  { id: '5', name: 'Viva Padel Poznań', slug: 'viva-padel', city: 'Poznań', lat: 52.4064, lng: 16.9252, isLive: false, courts: 5 },
  { id: '6', name: 'Padel Wrocław', slug: 'padel-wroclaw', city: 'Wrocław', lat: 51.1079, lng: 17.0385, isLive: false, courts: 4 },
  { id: '7', name: 'Ace Padel Łódź', slug: 'ace-padel', city: 'Łódź', lat: 51.7592, lng: 19.456, isLive: false, courts: 3 },
  { id: '8', name: 'Silesia Padel', slug: 'silesia-padel', city: 'Gliwice', lat: 50.2945, lng: 18.6714, isLive: false, courts: 4 },
  { id: '9', name: 'Padel Zone Lublin', slug: 'padel-zone', city: 'Lublin', lat: 51.2465, lng: 22.5684, isLive: false, courts: 2 },
  { id: '10', name: 'Net Point Szczecin', slug: 'net-point', city: 'Szczecin', lat: 53.4285, lng: 14.5528, isLive: false, courts: 3 },
];

function createPopupContent(club: ClubMarker) {
  return `
    <div style="font-family: 'DM Sans', sans-serif; min-width: 200px; padding: 4px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        ${club.isLive ? '<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239,68,68,0.2); color: #ef4444; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;">&#9679; LIVE</span>' : ''}
        <span style="font-size: 10px; color: #888;">${club.city}</span>
      </div>
      <p style="font-weight: 700; font-size: 14px; color: #C8FF00; margin: 0 0 4px 0;">${club.name}</p>
      <div style="display: flex; gap: 12px; font-size: 11px; color: #aaa;">
        <span>${club.courts} kort&oacute;w</span>
        ${club.isLive ? `<span style="color: #ef4444;">${club.viewers} widz&oacute;w</span>` : ''}
      </div>
      <a href="/club/${club.slug}" style="display: block; margin-top: 8px; text-align: center; background: #C8FF00; color: #000; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 8px; text-decoration: none;">
        Zobacz kanał
      </a>
    </div>
  `;
}

function createMarkerIcon(isLive: boolean) {
  const color = isLive ? '#ef4444' : '#C8FF00';
  const pulse = isLive
    ? `<circle cx="12" cy="12" r="12" fill="${color}" opacity="0.3"><animate attributeName="r" from="12" to="20" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite"/></circle>`
    : '';

  return L.divIcon({
    html: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      ${pulse}
      <circle cx="20" cy="20" r="10" fill="${color}" stroke="#0B0C10" stroke-width="3"/>
      ${isLive ? '<circle cx="20" cy="20" r="4" fill="white"/>' : ''}
    </svg>`,
    className: 'club-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

interface ClubMapProps {
  filter: 'all' | 'live';
  selectedClubName?: string | null;
  onClubSelect?: (club: ClubMarker) => void;
}

export function ClubMap({ filter, selectedClubName, onClubSelect }: ClubMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [52.0, 19.5],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Add/update markers when filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current.clear();

    const clubs = filter === 'live' ? DEMO_CLUBS.filter((c) => c.isLive) : DEMO_CLUBS;

    clubs.forEach((club) => {
      const marker = L.marker([club.lat, club.lng], {
        icon: createMarkerIcon(club.isLive),
      }).addTo(map);

      marker.bindPopup(createPopupContent(club), {
        className: 'glass-popup',
        closeButton: false,
      });

      marker.on('click', () => {
        onClubSelect?.(club);
      });

      markersRef.current.set(club.name, marker);
    });
  }, [filter, onClubSelect]);

  // Fly to selected club and open its popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedClubName) return;

    const marker = markersRef.current.get(selectedClubName);
    if (!marker) return;

    const latLng = marker.getLatLng();
    map.flyTo(latLng, 10, { duration: 0.8 });

    // Open popup after flyTo animation completes
    setTimeout(() => {
      marker.openPopup();
    }, 900);
  }, [selectedClubName]);

  return <div ref={mapRef} className="h-full w-full" />;
}
