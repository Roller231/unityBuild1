import * as React from "react";
import Svg, {
  Rect,
  G,
  Defs,
  RadialGradient,
  Stop,
  Path,
} from "react-native-svg";

const OrangeBtn = (props: any) => (
  <Svg
    width="100%"
    height="100%"
    viewBox="0 0 343 64"
    fill="none"
    {...props}
  >
    <G>
      {/* Основное тело кнопки */}
      <Rect width="343" height="64" rx="32" fill="#D35100" />
      <Rect
        x="0.5"
        y="0.5"
        width="342"
        height="63"
        rx="31.5"
        stroke="#D35100"
      />
      <Rect
        width="343"
        height="56"
        rx="28"
        y="0"
        fill="url(#grad)"
      />

      {/* Блики */}
      <Path
        d="M26.7749 9.149C29.3141 11.9928 23.0904 11.4106 19.1754 14.9063C15.2605 18.4019 15.1368 24.6516 12.5976 21.8078C10.0584 18.964 11.1737 13.8249 15.0887 10.3293C19.0036 6.8337 24.2357 6.3052 26.7749 9.149Z"
        fill="white"
        opacity={0.25}
      />
      <Path
        d="M319.387 28.8901C316.3 26.6518 317.509 32.7846 314.428 37.0332C311.346 41.2818 305.141 42.0373 308.227 44.2757C311.314 46.5141 316.313 44.8844 319.395 40.6358C322.476 36.3872 322.473 31.1285 319.387 28.8901Z"
        fill="white"
        opacity={0.25}
      />
    </G>

    <Defs>
      <RadialGradient
        id="grad"
        cx="0"
        cy="0"
        r="1"
        gradientTransform="matrix(252 34 -23 106 60 18)"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0" stopColor="#E9CA2C" />
        <Stop offset="0.66" stopColor="#FF8800" />
      </RadialGradient>
    </Defs>
  </Svg>
);

export default OrangeBtn;
