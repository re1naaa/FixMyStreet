import React, { forwardRef, useEffect, useImperativeHandle, useRef, useMemo, useState } from "react";
import { View } from "react-native";

const KOSOVO_LOCATIONS = [
  { latitude: 42.602636, longitude: 20.902977, name: "Kosovo" },
  { latitude: 42.662914, longitude: 21.165222, name: "Prishtina" },
  { latitude: 42.2167, longitude: 20.7397, name: "Prizren" },
  { latitude: 42.891, longitude: 20.865, name: "Mitrovica" },
  { latitude: 42.6596, longitude: 20.2898, name: "Peja" },
  { latitude: 42.4638, longitude: 21.4696, name: "Gjilan" },
];

export const PROVIDER_GOOGLE = "google";

declare global {
  interface Window { L?: any }
}

export const MapView = forwardRef<any, any>(function WebMapView({ style, initialRegion, children, onPress, onRegionChangeComplete }: any, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const [fallbackIndex] = useState(() => Math.floor(Math.random() * KOSOVO_LOCATIONS.length));
  const location = useMemo(() => initialRegion?.latitude && initialRegion?.longitude
    ? { latitude: initialRegion.latitude, longitude: initialRegion.longitude, name: "Kosovo" }
    : KOSOVO_LOCATIONS[fallbackIndex], [initialRegion, fallbackIndex]);

  useImperativeHandle(ref, () => ({
    animateToRegion(region: any, duration = 700) {
      if (mapRef.current) {
        mapRef.current.flyTo([region.latitude, region.longitude], 14, { duration: duration / 1000 });
      }
    },
  }), []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-js";
    const initialize = () => {
      if (!containerRef.current || !window.L) return;
      if (mapRef.current) mapRef.current.remove();
      const center = initialRegion ? [initialRegion.latitude, initialRegion.longitude] : [42.602636, 20.902977];
      const map = window.L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(center, initialRegion?.latitudeDelta ? 11 : 12);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      if (onPress) {
        map.on("click", (event: any) => onPress({ nativeEvent: { coordinate: { latitude: event.latlng.lat, longitude: event.latlng.lng } } }));
      }
      if (onRegionChangeComplete) {
        map.on("moveend", () => {
          const c = map.getCenter();
          onRegionChangeComplete({ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        });
      }

      markerRefs.current = [];
      React.Children.forEach(children, (child: any) => {
        if (!child?.props?.coordinate) return;
        const coordinate = child.props.coordinate;
        const color = child.props.pinColor || "#3478F6";
        const marker = window.L.circleMarker([coordinate.latitude, coordinate.longitude], {
          radius: child.props.draggable ? 9 : 7,
          color: "#FFFFFF",
          weight: 2,
          fillColor: color,
          fillOpacity: 1,
        }).addTo(map);
        if (child.props.title) marker.bindPopup(child.props.title);
        if (child.props.onPress) marker.on("click", () => child.props.onPress());
        markerRefs.current.push(marker);
      });

      window.setTimeout(() => map.invalidateSize(), 50);
    };

    if (window.L) {
      initialize();
      return () => mapRef.current?.remove();
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", initialize, { once: true });
    return () => {
      script?.removeEventListener("load", initialize);
      mapRef.current?.remove();
    };
  }, [initialRegion?.latitude, initialRegion?.longitude, children]);

  if (typeof document === "undefined") return <View style={style} />;

  return React.createElement("div", {
    ref: containerRef,
    style: { position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: 18, background: "#E5E5EA", ...(style || {}) },
  });
});

export function Marker(_props: any) { return null; }
