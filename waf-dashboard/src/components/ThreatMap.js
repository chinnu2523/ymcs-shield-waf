import React from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { ShieldAlert } from "lucide-react";

/**
 * ThreatMap provides an authentic SVG geographical visualization 
 * of cyber-attacks powered by react-simple-maps.
 */

// Geographic dataset stored natively in our build
const geoUrl = "/world-110m.json";

export default function ThreatMap({ threats }) {
  // ISO-based precise coordinate centroids [longitude, latitude]
  const coordinates = {
    "US": [-95.7129, 37.0902],
    "IN": [78.9629, 20.5937],
    "RU": [105.3188, 61.5240],
    "CN": [104.1954, 35.8617],
    "BR": [-51.9253, -14.2350],
    "GB": [-3.4359, 55.3781],
    "DE": [10.4515, 51.1657],
    "FR": [2.2137, 46.2276],
    "JP": [138.2529, 36.2048],
    "KP": [127.5101, 40.3399],
  };

  // Convert IP to a deterministic [long, lat] backup if country matches fail
  const fallbackCoords = (ip) => {
    if (!ip) return [0, 0];
    const octets = ip.split('.').map(Number);
    if (octets.length !== 4) return [0, 0];
    const longitude = -180 + ((octets[0] + octets[1]) * 1.40625) % 360;
    const latitude = -90 + ((octets[2] + octets[3]) * 0.703125) % 180;
    return [longitude, latitude];
  };

  const activeMarkers = threats
    .filter(t => t.country !== "Localhost")
    .map(t => ({
      ...t,
      coords: coordinates[t.country] || fallbackCoords(t.ip)
    }))
    .slice(0, 15);

  return (
    <div className="glass-panel h-full relative overflow-hidden group hover-tilt stagger-3 flex flex-col items-center justify-center pt-8">
      
      {/* Decorative Title Block */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-3">
        <ShieldAlert className="text-danger animate-pulse" size={14} />
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/90">
          Global Threat Vector Live Map
        </h3>
      </div>

      <ComposableMap 
        projection="geoMercator" 
        style={{ width: "100%", height: "100%", maxHeight: "250px" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(0, 242, 255, 0.05)"
                stroke="var(--primary)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "rgba(0, 242, 255, 0.2)" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {activeMarkers.map((marker, idx) => (
          <Marker key={`marker-${idx}`} coordinates={marker.coords}>
            <g className="animate-ping" style={{ opacity: 0.6 }}>
              <circle r={3} fill="var(--danger)" />
            </g>
            <circle r={1.5} fill="#ff0033" />
          </Marker>
        ))}
      </ComposableMap>

      {/* Decorative Overlay */}
      <div className="absolute bottom-4 right-6 text-right">
        <div className="text-[9px] font-mono text-danger font-bold uppercase tracking-widest">
          Active Mitigations: {activeMarkers.length}
        </div>
      </div>
    </div>
  );
}
