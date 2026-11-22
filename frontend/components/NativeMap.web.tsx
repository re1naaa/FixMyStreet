import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";

export const PROVIDER_GOOGLE = "google";

const DEFAULT_CENTER: [number, number] = [42.602636, 20.902977];
const LEAFLET_VERSION = "1.9.4";

declare global {
  interface Window { L?: any }
}

let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => { leafletPromise = null; reject(new Error("Leaflet failed to load")); };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function zoomFor(delta?: number) {
  if (!delta) return 12;
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
}

export const MapView = forwardRef<any, any>(function WebMapView({ style, initialRegion, children, onPress, onRegionChangeComplete }: any, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const handlers = useRef({ onPress, onRegionChangeComplete });
  handlers.current = { onPress, onRegionChangeComplete };
  const initialRef = useRef(initialRegion);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    animateToRegion(region: any, duration = 700) {
      mapRef.current?.flyTo([region.latitude, region.longitude], zoomFor(region.latitudeDelta), { duration: duration / 1000 });
    },
  }), []);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const region = initialRef.current;
      const center: [number, number] = region?.latitude ? [region.latitude, region.longitude] : DEFAULT_CENTER;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(center, zoomFor(region?.latitudeDelta));
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (event: any) => handlers.current.onPress?.({ nativeEvent: { coordinate: { latitude: event.latlng.lat, longitude: event.latlng.lng } } }));
      map.on("moveend", () => {
        const c = map.getCenter();
        handlers.current.onRegionChangeComplete?.({ latitude: c.lat, longitude: c.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      });
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(containerRef.current);
      setReady(true);
    }).catch(() => {});
    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    React.Children.forEach(children, (child: any) => {
      if (!child?.props?.coordinate) return;
      const { coordinate, pinColor, draggable, title, onPress: onMarkerPress, onDragEnd } = child.props;
      const color = pinColor || "#6D5DFC";
      const size = draggable ? 26 : 20;
      const icon = L.divIcon({
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 6px ${color}33,0 6px 14px rgba(21,18,59,.35);box-sizing:border-box"></div>`,
      });
      const marker = L.marker([coordinate.latitude, coordinate.longitude], { icon, draggable: !!draggable }).addTo(layer);
      if (title) marker.bindTooltip(title);
      if (onMarkerPress) marker.on("click", () => onMarkerPress());
      if (onDragEnd) marker.on("dragend", () => {
        const p = marker.getLatLng();
        onDragEnd({ nativeEvent: { coordinate: { latitude: p.lat, longitude: p.lng } } });
      });
    });
  }, [ready, children]);

  if (typeof document === "undefined") return <View style={style} />;

  return React.createElement("div", {
    ref: containerRef,
    style: { position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#E9E6FB", zIndex: 0, ...(style || {}) },
  });
});

export function Marker(_props: any) { return null; }
