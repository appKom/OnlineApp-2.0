import { useWindowDimensions } from "react-native";
import Svg, { Defs, G, Line, LinearGradient, Rect, Stop } from "react-native-svg";

export const FELT_BASE_LIGHT = "#07523A";
export const FELT_BASE_DARK = "#043728";

export function CasinoFeltBackground({ darkMode }: { darkMode: boolean }) {
  const { height } = useWindowDimensions();
  return (
    <Svg pointerEvents="none" width="100%" height={height + 120} style={{ position: "absolute", top: 0, left: 0 }}>
      <Defs>
        <LinearGradient id="sharedFeltGradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={darkMode ? "#064732" : "#0A6245"} />
          <Stop offset="0.52" stopColor={darkMode ? "#053C2B" : "#075039"} />
          <Stop offset="1" stopColor={darkMode ? "#02271D" : "#043A2A"} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#sharedFeltGradient)" />
      <G opacity={darkMode ? 0.045 : 0.06}>
        {Array.from({ length: 24 }, (_, index) => (
          <Line key={index} x1={index * 26 - 150} y1="0" x2={index * 26 + 150} y2="100%" stroke="#F5E9C7" strokeWidth="1" />
        ))}
      </G>
      <Rect x="0" y="0" width="100%" height="100%" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="18" />
    </Svg>
  );
}
