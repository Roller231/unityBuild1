import React, { useEffect, useRef, useMemo } from "react";
import { View, Animated, Dimensions, StyleSheet } from "react-native";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform"; // ✅ добавили

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const StarsBackground = () => {
  const platform = useTelegramPlatform();

  // ✅ ограничиваем ширину на Telegram Desktop/Web
  const isDesktop =
    platform === "tdesktop" ||
    platform === "macos" ||
    platform === "webk" ||
    platform === "weba" ||
    platform === "web";

  const canvasWidth = isDesktop ? 470 : screenWidth;
  const canvasHeight = screenHeight;

  // Используем useMemo, чтобы звёзды создавались один раз (не на каждом рендере)
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }).map(() => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.3,
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
        {
          alignItems: "center",
        },
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
                opacity: Math.random() * 0.8 + 0.2,
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
