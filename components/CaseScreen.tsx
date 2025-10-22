import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import OrangeBtn from "../components/OrangeBtn";
import CaseResultModal from "../components/CaseResultModal";
import CaseRoulette from "../components/CaseRoulette"; // 🔹 рулетка

const { width: screenWidth } = Dimensions.get("window");

// 🎁 Моковые дропы
const sampleDrops = [
  { id: "1", icon: require("../components/icons/cat.png"), price: 0.05 },
  { id: "2", icon: require("../components/icons/cat.png"), price: 0.1 },
  { id: "3", icon: require("../components/icons/gift.png"), price: 0.2 },
  { id: "4", icon: require("../components/icons/Venus.svg"), price: 0.35 },
  { id: "5", icon: require("../components/icons/cat.png"), price: 0.7 },
  { id: "6", icon: require("../components/icons/Venus.svg"), price: 0.5 },
];

const CaseScreen = () => {
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<null | { id: string; price: number }>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);

    // 🎲 Имитируем ответ от бэка — выбираем случайный дроп
    const randomItem = sampleDrops[Math.floor(Math.random() * sampleDrops.length)];

    // ✅ Добавляем короткую задержку, чтобы активировать рулетку корректно
    setTimeout(() => {
      setTargetId(randomItem.id);
    }, 150);
  };

  const handleFinish = (item: { id: string; price: number }) => {
    setOpening(false);
    setResult(item);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FREE 2.0</Text>

      {/* 🎡 Рулетка */}
      <CaseRoulette
        items={sampleDrops}
        resultId={targetId || undefined}
        active={opening}
        onFinish={handleFinish}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.openButton, { width: screenWidth * 0.85 }]}
        onPress={handleOpen}
        disabled={opening}
      >
        <OrangeBtn width="100%" height="100%" style={StyleSheet.absoluteFillObject as any} />
        <Text style={styles.openText}>{opening ? "SPINNING..." : "OPEN"}</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>WHAT’S INSIDE?</Text>

      {/* 🎉 Результат */}
      {result && (
        <CaseResultModal
          amount={result.price}
          onClose={() => setResult(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "transparent",
    paddingBottom: 40,
  },
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
