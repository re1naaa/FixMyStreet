import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";

const GOOGLE_KEY = "AIzaSyAaW-uFHBSP96SkH0O13_7_XVBziS9JDYU";
const FALLBACK_LOCATIONS = [
  { latitude: 42.602636, longitude: 20.902977, name: "Kosovo" },
  { latitude: 42.662914, longitude: 21.165222, name: "Prishtina" },
  { latitude: 42.2167, longitude: 20.7397, name: "Prizren" },
  { latitude: 42.891, longitude: 20.865, name: "Mitrovica" },
];

export const PROVIDER_GOOGLE = "google";

export function MapView({ style, initialRegion, children }: any) {
  const [failed, setFailed] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const scriptId = "fixmystreet-google-maps";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const timeout = window.setTimeout(() => setFailed(true), 9000);
    const onLoad = () => {
      window.clearTimeout(timeout);
      setFailed(false);
    };
    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      return () => { window.clearTimeout(timeout); existing.removeEventListener("load", onLoad); };
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&v=beta&libraries=maps3d`;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", () => { window.clearTimeout(timeout); setFailed(true); }, { once: true });
    document.head.appendChild(script);
    return () => window.clearTimeout(timeout);
  }, []);

  const location = useMemo(() => {
    if (initialRegion?.latitude && initialRegion?.longitude) {
      return { latitude: initialRegion.latitude, longitude: initialRegion.longitude, name: "Kosovo" };
    }
    return FALLBACK_LOCATIONS[fallbackIndex];
  }, [initialRegion, fallbackIndex]);

  if (typeof document === "undefined") return <View style={style} />;

  const fallback = FALLBACK_LOCATIONS[(fallbackIndex + 1) % FALLBACK_LOCATIONS.length];
  const mapUrl = failed
    ? `https://www.google.com/maps?q=${fallback.latitude},${fallback.longitude}&z=12&output=embed`
    : `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_KEY}&center=${location.latitude},${location.longitude}&zoom=12&maptype=satellite`;

  return React.createElement("div", { ref: frameRef, style: { position: "relative", width: "100%", height: "100%", borderRadius: 22, overflow: "hidden" } },
    React.createElement("iframe", {
      title: "FixMyStreet Kosovo Google Map",
      src: mapUrl,
      style: { width: "100%", height: "100%", border: 0 },
      allowFullScreen: true,
      loading: "eager",
      referrerPolicy: "no-referrer-when-downgrade",
      onLoad: () => { if (!failed) setFallbackIndex(0); },
    }),
    React.createElement("div", { style: { position: "absolute", left: 12, bottom: 94, background: "rgba(16,29,53,.92)", color: "white", borderRadius: 10, padding: "8px 10px", fontSize: 11, fontFamily: "system-ui" } }, failed ? `Fallback: ${fallback.name}` : "Google Maps • Kosovo"),
  );
}

export function Marker(_props: any) {
  return null;
}
