import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from "react-native";
import Confetti from "react-confetti";

const CaseResultModal = ({
  amount,
  onClose,
}: {
  amount: number;
  onClose: () => void;
}) => {
  // === Используем Dimensions с автообновлением ===
  const [windowSize, setWindowSize] = useState(Dimensions.get("window"));
  const { width, height } = windowSize;

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setWindowSize(window);
    });
    return () => sub?.remove();
  }, []);

  return (
    <View style={styles.overlay}>
      {/* 🎉 Конфетти — только для web */}
      {Platform.OS === "web" && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={250}
          gravity={0.15}
          wind={0.01}
          recycle={false}
          opacity={0.9}
          tweenDuration={4500}
        />
      )}

      <View style={[styles.modal, { width: width * 0.85 }]}>
        <Text style={styles.title}>Congratulations!</Text>

        <View style={styles.rewardBox}>
          <Text style={styles.rewardText}>+{amount.toFixed(2)} 💎</Text>
        </View>

        <Pressable style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Ok</Text>
        </Pressable>
      </View>
    </View>
  );
};

// === Стили ===
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    paddingVertical: 40,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: "#352851",
    zIndex: 10,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
  },
  rewardBox: {
    backgroundColor: "#1F0248",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginBottom: 24,
  },
  rewardText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#6B3FD8",
    borderRadius: 100,
    paddingHorizontal: 40,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default CaseResultModal;
