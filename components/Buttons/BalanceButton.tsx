import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { BlurView } from "expo-blur";
import * as Font from "expo-font";

// ❗ SVG оставляем как у тебя
import TonIcon from "../icons/ton.svg";

import { useUser } from "../UserContext";

const BalanceButton = ({ onPress }: { onPress?: () => void }) => {
  const { user } = useUser();                 // 🔥 Данные пользователя
  const balance = user?.balance ?? 0;         // 🔥 Берём баланс, если нет — 0

  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      "SF-Pro-Bold": require("../../fonts/SF-Pro-Display-Bold.otf"),
    }).then(() => setFontLoaded(true));
  }, []);

  if (!fontLoaded) return null;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      {/* 🔹 Внешняя белая обводка */}
      <View style={styles.outerGlow}>
        <BlurView intensity={30} tint="light" style={styles.container}>
          
          {/* Иконка TON */}
          <View style={styles.iconCircle}>
            {/* SVG используем как компонент, НЕ как Image */}
            <Image source={TonIcon} style={{ width: 22, height: 22 }} />

          </View>

          {/* 🔥 Реальный баланс пользователя */}
          <Text style={styles.text}>{balance.toFixed(2)}</Text>

          {/* Крестик расширения (пополнить) */}
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
    padding: 0.5,
    backgroundColor: "rgba(255,255,255,0.25)",
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
    backgroundColor: "rgba(120, 60, 200, 0.4)",
    overflow: "hidden",
  },

  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0098EA",
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginHorizontal: 6,
    fontFamily: "SF-Pro-Bold",
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
