import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import OrangeBtn from "../components/OrangeBtn";
import CaseResultModal from "../components/CaseResultModal";
import CaseOpenAnimation from "../components/CaseOpenAnimation";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const CaseScreen = () => {
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<null | number>(null);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);

    // имитация выигрыша
    const winAmount = parseFloat((Math.random() * 0.3 + 0.05).toFixed(2));

    setTimeout(() => {
      setOpening(false);
      setResult(winAmount);
    }, 3000);
  };

  return (
    <LinearGradient colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />

      <View style={styles.container}>
        <Text style={styles.title}>FREE 2.0</Text>

        <CaseOpenAnimation active={opening} />

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.openButton, { width: screenWidth * 0.85 }]}
          onPress={handleOpen}
          disabled={opening}
        >
          <OrangeBtn width="100%" height="100%" style={StyleSheet.absoluteFillObject as any} />
          <Text style={styles.openText}>{opening ? "Opening..." : "OPEN"}</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>WHAT’S INSIDE?</Text>
      </View>

      {result !== null && (
        <CaseResultModal amount={result} onClose={() => setResult(null)} />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { alignItems: "center", justifyContent: "center", width: "100%" },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 30,
    letterSpacing: 1,
  },
  openButton: {
    height: 70,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 30,
  },
  openText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
    position: "absolute",
  },
  subtitle: { color: "#C4BED4", fontSize: 16, letterSpacing: 1 },
});

export default CaseScreen;
