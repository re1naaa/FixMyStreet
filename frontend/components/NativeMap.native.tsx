import { Text, View } from "react-native";
import MapView, { Marker as RNMarker, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "../constants/colors";

export { MapView, PROVIDER_GOOGLE };

function pinColorOf(pinColor: string | undefined) {
  return pinColor || colors.accent;
}

export function Marker({ badge, dot, pinColor, children, ...props }: any) {
  const color = pinColorOf(pinColor);
  if (dot) {
    return (
      <RNMarker {...props}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: color,
            borderWidth: 3,
            borderColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        />
      </RNMarker>
    );
  }
  if (badge !== undefined && badge !== null) {
    const label = badge === "" || badge === 0 ? "" : String(badge);
    return (
      <RNMarker {...props}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              minWidth: 30,
              height: 30,
              borderRadius: 15,
              paddingHorizontal: 6,
              backgroundColor: color,
              borderWidth: 3,
              borderColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            {label ? <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>{label}</Text> : null}
          </View>
          <View
            style={{
              width: 0,
              height: 0,
              marginTop: -3,
              borderLeftWidth: 5,
              borderRightWidth: 5,
              borderTopWidth: 7,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderTopColor: color,
            }}
          />
        </View>
      </RNMarker>
    );
  }
  return <RNMarker {...props} pinColor={color}>{children}</RNMarker>;
}
