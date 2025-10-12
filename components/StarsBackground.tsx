import React, { useEffect, useRef, useMemo, useState } from "react";
import { View, Animated, Dimensions, StyleSheet, ScaledSize } from "react-native";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

const StarsBackground = () => {
  const platform = useTelegramPlatform();

  // ✅ детектим платформу
  const isDesktop =
    platform === "tdesktop" ||
    platform === "macos";

  // 🔹 локальный стейт для width/height (чтобы реагировать на ресайз)
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  // ✅ добавляем тип ScaledSize в колбэк
  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => setDimensions(window);
    const sub = Dimensions.addEventListener("change", onChange);
    return () => sub.remove?.();
  }, []);

  // 💻 фиксируем ширину на десктопе, 📱 берем реальную ширину на телефонах
  const canvasWidth = isDesktop ? 470 : dimensions.width;
  const canvasHeight = dimensions.height;

  // 🪐 создаём звёзды один раз, пересоздаём только если меняется ширина/высота
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }).map(() => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
      })),
    [canvasWidth, canvasHeight]
  );

  const animations = useRef(stars.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = animations.map((anim, i) => {
      const { speed } = stars[i];
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 10000 / speed,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [animations, stars]);

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { alignItems: "center", justifyContent: "center" },
      ]}
    >
      <View
        style={{
          width: canvasWidth,
          height: canvasHeight,
          overflow: "hidden",
        }}
      >
        {stars.map((star, i) => {
          const translateY = animations[i].interpolate({
            inputRange: [0, 1],
            outputRange: [star.y, -10],
          });

          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                top: 0,
                left: star.x,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                backgroundColor: "white",
                opacity: star.opacity,
                transform: [{ translateY }],
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

export default StarsBackground;
