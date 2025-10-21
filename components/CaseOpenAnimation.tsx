import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Easing } from "react-native";

const CaseOpenAnimation = ({ active }: { active: boolean }) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spin.stopAnimation();
      spin.setValue(0);
    }
  }, [active]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.caseBox}>
      <Animated.View style={[styles.inner, { transform: [{ rotate }] }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  caseBox: {
    width: 140,
    height: 140,
    backgroundColor: "#1F0248",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#9028FF",
  },
  inner: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#6B3FD8",
  },
});

export default CaseOpenAnimation;
