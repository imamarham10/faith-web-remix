import { useState, useEffect, useRef } from "react";
import {
  Compass,
  MapPin,
  Loader2,
  Navigation,
  ChevronDown,
  Search,
  LocateFixed,
} from "lucide-react";
import { qiblaAPI } from "~/services/api";

interface CityOption {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

const POPULAR_CITIES: CityOption[] = [
  { name: "Mecca", country: "Saudi Arabia", lat: 21.4225, lng: 39.8262 },
  { name: "Medina", country: "Saudi Arabia", lat: 24.4672, lng: 39.6024 },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.7136, lng: 46.6753 },
  { name: "Jeddah", country: "Saudi Arabia", lat: 21.5433, lng: 39.1728 },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Abu Dhabi", country: "UAE", lat: 24.4539, lng: 54.3773 },
  { name: "Doha", country: "Qatar", lat: 25.2854, lng: 51.5310 },
  { name: "Kuwait City", country: "Kuwait", lat: 29.3759, lng: 47.9774 },
  { name: "Muscat", country: "Oman", lat: 23.5880, lng: 58.3829 },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784 },
  { name: "Ankara", country: "Turkey", lat: 39.9334, lng: 32.8597 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Casablanca", country: "Morocco", lat: 33.5731, lng: -7.5898 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.1390, lng: 101.6869 },
  { name: "Islamabad", country: "Pakistan", lat: 33.6844, lng: 73.0479 },
  { name: "Karachi", country: "Pakistan", lat: 24.8607, lng: 67.0011 },
  { name: "Lahore", country: "Pakistan", lat: 31.5204, lng: 74.3587 },
  { name: "Dhaka", country: "Bangladesh", lat: 23.8103, lng: 90.4125 },
  { name: "Delhi", country: "India", lat: 28.7041, lng: 77.1025 },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  { name: "Hyderabad", country: "India", lat: 17.3850, lng: 78.4867 },
  { name: "Bangalore", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Amman", country: "Jordan", lat: 31.9454, lng: 35.9284 },
  { name: "Baghdad", country: "Iraq", lat: 33.3152, lng: 44.3661 },
  { name: "Tehran", country: "Iran", lat: 35.6892, lng: 51.3890 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
];

interface QiblaData {
  direction: number;
  directionArabic?: number;
  distance?: number;
  distanceKm?: number;
}

export default function QiblaPage() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("Select Location");
  const [qiblaData, setQiblaData] = useState<QiblaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heading, setHeading] = useState<number | null>(null);

  // Location dropdown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const detectCurrentLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationName(`My Location (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`);
        setDetectingLocation(false);
        setShowLocationDropdown(false);
      },
      () => {
        // Default to Mecca
        setLocation({ lat: 21.4225, lng: 39.8262 });
        setLocationName("Mecca, Saudi Arabia");
        setDetectingLocation(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const selectCity = (city: CityOption) => {
    setLocation({ lat: city.lat, lng: city.lng });
    setLocationName(`${city.name}, ${city.country}`);
    setShowLocationDropdown(false);
    setCitySearch("");
  };

  // Fetch Qibla data from API
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setError("");
    qiblaAPI
      .getDirection(location.lat, location.lng)
      .then((res: any) => {
        const data = res.data?.data || res.data;
        if (data) {
          setQiblaData({
            direction: data.direction || 0,
            directionArabic: data.directionArabic || data.direction_arabic,
            distance: data.distance || data.distanceKm,
            distanceKm: data.distanceKm || data.distance_km,
          });
        }
      })
      .catch(() => setError("Failed to fetch Qibla direction"))
      .finally(() => setLoading(false));
  }, [location]);

  // Device orientation for compass
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHeading(e.alpha);
      }
    };

    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation);
      return () => window.removeEventListener("deviceorientation", handleOrientation);
    }
  }, []);

  const qiblaAngle = qiblaData?.direction || 0;
  const distance = qiblaData?.distanceKm || qiblaData?.distance || 0;
  const compassRotation = heading !== null && qiblaAngle !== null ? qiblaAngle - heading : qiblaAngle || 0;

  const filteredCities = citySearch.trim()
    ? POPULAR_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(citySearch.toLowerCase()) ||
          c.country.toLowerCase().includes(citySearch.toLowerCase())
      )
    : POPULAR_CITIES;

  return (
    <div className="bg-gradient-surface min-h-screen">
      {/* Hero */}
      <section className="bg-hero-gradient text-white pattern-islamic">
        <div className="container-faith py-10 md:py-14">
          <div className="flex items-center justify-between gap-8">
            <div className="animate-fade-in-up flex-1">
              {/* Location Selector */}
              <div className="relative mb-4" ref={dropdownRef}>
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-xl border border-white/10"
                >
                  <MapPin size={14} />
                  <span className="max-w-[240px] truncate">{locationName}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showLocationDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showLocationDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-80 max-h-96 bg-white rounded-2xl shadow-2xl border border-border-light z-50 overflow-hidden animate-fade-in-up">
                    {/* Search */}
                    <div className="p-3 border-b border-border-light">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          placeholder="Search city..."
                          className="input-with-left-icon w-full pr-3 py-2.5 text-sm text-text bg-bg rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Detect Location Button */}
                    <button
                      onClick={detectCurrentLocation}
                      disabled={detectingLocation}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary font-medium hover:bg-primary/5 transition-colors border-b border-border-light"
                    >
                      {detectingLocation ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <LocateFixed size={16} />
                      )}
                      {detectingLocation ? "Detecting..." : "Use My Current Location"}
                    </button>

                    {/* City List */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={`${city.name}-${city.country}`}
                          onClick={() => selectCity(city)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/2 transition-colors"
                        >
                          <MapPin size={14} className="text-text-muted shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text truncate">{city.name}</p>
                            <p className="text-xs text-text-muted">{city.country}</p>
                          </div>
                        </button>
                      ))}
                      {filteredCities.length === 0 && (
                        <p className="text-center text-sm text-text-muted py-6">No cities found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair mb-2">
                Qibla Finder
              </h1>
              <p className="text-white/60 text-sm">
                Find the precise direction to the Holy Kaaba
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-faith py-8 md:py-12 max-w-lg mx-auto">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-text-muted text-sm">Getting Qibla direction...</p>
          </div>
        ) : error ? (
          <div className="card-elevated p-8 text-center">
            <Compass size={40} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                if (location) {
                  setLoading(true);
                  setError("");
                  qiblaAPI
                    .getDirection(location.lat, location.lng)
                    .then((res: any) => {
                      const data = res.data?.data || res.data;
                      if (data) {
                        setQiblaData({
                          direction: data.direction || 0,
                          directionArabic: data.directionArabic || data.direction_arabic,
                          distance: data.distance || data.distanceKm,
                          distanceKm: data.distanceKm || data.distance_km,
                        });
                      }
                    })
                    .catch(() => setError("Failed to fetch Qibla direction"))
                    .finally(() => setLoading(false));
                }
              }}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {/* Compass */}
            <div className="card-elevated p-8 sm:p-12 text-center mb-6">
              <div className="relative inline-flex items-center justify-center mb-8">
                {/* Compass Ring */}
                <div className="w-64 h-64 sm:w-72 sm:h-72 relative">
                  {/* Outer ring */}
                  <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full"
                    style={{ transform: `rotate(${-compassRotation}deg)`, transition: "transform 0.3s ease" }}
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="95"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-border"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      className="text-border-light"
                    />

                    {/* Direction markers */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                      const isCardinal = deg % 90 === 0;
                      const labels: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W" };
                      const rad = (deg - 90) * (Math.PI / 180);
                      const x = 100 + 92 * Math.cos(rad);
                      const y = 100 + 92 * Math.sin(rad);

                      return (
                        <g key={deg}>
                          {isCardinal && labels[deg] && (
                            <text
                              x={100 + 75 * Math.cos(rad)}
                              y={100 + 75 * Math.sin(rad)}
                              textAnchor="middle"
                              dominantBaseline="central"
                              className="fill-text-secondary"
                              fontSize="10"
                              fontWeight="600"
                              style={{
                                transform: `rotate(${compassRotation}deg)`,
                                transformOrigin: `${100 + 75 * Math.cos(rad)}px ${100 + 75 * Math.sin(rad)}px`,
                              }}
                            >
                              {labels[deg]}
                            </text>
                          )}
                          <line
                            x1={100 + (isCardinal ? 88 : 90) * Math.cos(rad)}
                            y1={100 + (isCardinal ? 88 : 90) * Math.sin(rad)}
                            x2={x}
                            y2={y}
                            stroke="currentColor"
                            strokeWidth={isCardinal ? "2" : "1"}
                            className={isCardinal ? "text-text-secondary" : "text-border"}
                          />
                        </g>
                      );
                    })}

                    {/* Qibla arrow */}
                    <g>
                      <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="20"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-primary"
                      />
                      <polygon points="100,12 94,24 106,24" fill="currentColor" className="text-primary" />
                    </g>

                    {/* Center dot */}
                    <circle cx="100" cy="100" r="4" fill="currentColor" className="text-primary" />
                  </svg>
                </div>
              </div>

              <p className="text-lg font-semibold text-text mb-1">{qiblaAngle.toFixed(1)}°</p>
              <p className="text-sm text-text-muted">
                {heading !== null ? "Point your device to follow the arrow" : "Qibla direction from your location"}
              </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <Navigation size={18} className="text-primary mx-auto mb-2" />
                <p className="text-xs text-text-muted mb-0.5">Direction</p>
                <p className="text-lg font-bold text-text">{qiblaAngle.toFixed(1)}°</p>
              </div>
              <div className="card p-4 text-center">
                <MapPin size={18} className="text-primary mx-auto mb-2" />
                <p className="text-xs text-text-muted mb-0.5">Distance to Kaaba</p>
                <p className="text-lg font-bold text-text">{Math.round(distance)} km</p>
              </div>
            </div>

            {/* Summary Bar */}
            <div className="mt-6 card-elevated p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-text">{locationName}</p>
                  <p className="text-xs text-text-muted">
                    {location?.lat.toFixed(4)}°, {location?.lng.toFixed(4)}°
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationDropdown(true)}
                className="text-sm text-primary font-medium hover:underline"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
