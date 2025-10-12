import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

const StarsBackground = () => {
  const stars = Array.from({ length: 60 }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 0.5 + 0.3,
  }));

  const animations = useRef(
    stars.map(() => new Animated.Value(0))
  ).current;

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
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
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
  );
};

export default StarsBackground;
