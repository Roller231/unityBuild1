import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { BlurView } from "expo-blur";

// Иконка токена (замени на свою)
import TonIcon from "../icons/ton.svg";


import {

  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

import * as Font from "expo-font";


// ===== Импорт иконок =====
import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import IconGift from "../components/icons/gift.png";
import IconStar from "../components/icons/star.svg";
import IconTon from "../components/icons/ton.svg";
import IconCopy from "../components/icons/copy.svg";



const BalanceButton = ({ onPress }: { onPress?: () => void }) => {

  const [fontLoaded, setFontLoaded] = useState(false);


  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Bold": require("../../fonts/SF-Pro-Display-Bold.otf"),
  
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  
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
    fontSize: 18,
    marginHorizontal: 6,
    fontFamily: "SF-Pro-Bold"
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
