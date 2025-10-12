import React from "react";
import { View, Text, Image, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { BlurView } from "expo-blur";

// Иконка токена (замени на свою)
import TonIcon from "../icons/ton.png";

const BalanceButton = ({ onPress }: { onPress?: () => void }) => {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      {/* 🔹 Внешняя белая обводка */}
      <View style={styles.outerGlow}>
        <BlurView intensity={30} tint="light" style={styles.container}>
          <View style={styles.iconCircle}>
            <Image source={TonIcon} style={styles.icon} resizeMode="contain" />
          </View>

          <Text style={styles.text}>0.00</Text>

          <View style={styles.plusCircle}>
            <Text style={styles.plus}>＋</Text>
          </View>
        </BlurView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  // 🔹 Обводка вокруг всей кнопки
  outerGlow: {
    borderRadius: 5000,
    padding: 0.5, // отступ между рамкой и кнопкой
    backgroundColor: "rgba(255,255,255,0.25)", // белая полупрозрачная рамка
    shadowColor: "#ffffff",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },

  // 🔹 Основной фон кнопки
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    gap: 4,
    borderRadius: 100,
    backgroundColor: "rgba(120, 60, 200, 0.4)", // фиолетовый полупрозрачный
    overflow: "hidden",
  },

  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0098EA", // TON голубой
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  icon: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },

  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginHorizontal: 6,
  },

  plusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#A36BFF",
    justifyContent: "center",
    alignItems: "center",
  },
  plus: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: -2,
  },
});

export default BalanceButton;
