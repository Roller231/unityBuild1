import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import * as Font from "expo-font";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface BetItemProps {
  avatar: any;
  username: string;
  betAmount: number;
  multiplier: number;
  total: number;
  state: "win" | "active" | "lose";
  delay?: number;
  isGift?: boolean;
}

const BetItem: React.FC<BetItemProps> = ({
  avatar,
  username,
  betAmount,
  multiplier,
  total,
  state,
  delay = 0,
  isGift = false,
}) => {
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const platform = useTelegramPlatform?.() ?? "web";
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 * 0.9 : screenWidth * 0.9;

  // 🔹 Масштаб элементов внутри карточки (высота, текст, иконки)
  const scale =
    screenHeight < 700
      ? 0.8 // маленькие экраны
      : screenHeight < 850
      ? 0.9 // средние
      : isDesktop
      ? 1.05 // десктоп
      : 1; // стандарт

  // ✅ Загружаем шрифты
  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        "SF-Pro-Regular": require("../fonts/SF-Pro-Display-Regular.otf"),
        "SF-Pro-Bold": require("../fonts/SF-Pro-Display-Bold.otf"),
      });
      setFontsLoaded(true);
    };
    loadFonts();
  }, []);

  // 🟢 Анимация появления
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  // 🎨 Цвет по состоянию
  const getTotalStyle = (): any => {
    switch (state) {
      case "win":
        return { color: "#4EFF7B" };
      case "lose":
        return { color: "#FF4D4D" };
      default:
        return { color: "#FFFFFF" };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateX: slideAnim }],
          width: fixedWidth,
          alignSelf: "center",
          height: 64 * scale, // 🔹 адаптивная высота карточки
        },
      ]}
    >
      {/* ==== Левая часть ==== */}
      <View style={styles.left}>
        <Image
          source={avatar}
          style={[
            styles.avatar,
            { width: 38 * scale, height: 38 * scale, borderRadius: 19 * scale },
          ]}
        />
        <View style={styles.userSection}>
          <Text
            style={[
              styles.username,
              { fontFamily: "SF-Pro-Bold", fontSize: 15 * scale },
            ]}
          >
            {username}
          </Text>

          <View style={styles.subRow}>
            <Image
              source={require("./icons/ton.svg")}
              style={{ width: 20 * scale, height: 20 * scale }}
              resizeMode="contain"
            />
            <Text
              style={[
                styles.subBet,
                { fontFamily: "SF-Pro-Regular", fontSize: 13 * scale },
              ]}
            >
              {betAmount.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.subMultiplier,
                { fontFamily: "SF-Pro-Regular", fontSize: 13 * scale },
              ]}
            >
              x{multiplier.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* ==== Правая часть ==== */}
      <View style={styles.right}>
        <Image
          source={require("./icons/ton.svg")}
          style={{ width: 26 * scale, height: 26 * scale }}
          resizeMode="contain"
        />
        <Text
          style={[
            styles.totalText,
            getTotalStyle(),
            { fontFamily: "SF-Pro-Regular", fontSize: 18 * scale },
          ]}
        >
          {total.toFixed(2)}
        </Text>

        {isGift ? (
          <Image
            source={require("./icons/giftStavka.svg")}
            style={{
              width: 30 * scale,
              height: 30 * scale,
              marginLeft: 4 * scale,
            }}
            resizeMode="contain"
          />
        ) : (
          <Text
            style={[
              styles.dash,
              { fontFamily: "SF-Pro-Regular", fontSize: 18 * scale },
            ]}
          >
            —
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#352851",
    marginVertical: 6,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userSection: {
    flexDirection: "column",
    justifyContent: "center",
  },
  username: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subBet: {
    color: "#C4BED4",
    textAlign: "center",
    fontSize: 13,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 15.6,
    paddingTop: 2,
  },
  subMultiplier: {
    color: "#76DA19",
    fontSize: 13,
    fontWeight: "400",
    paddingTop: 2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "100",
    letterSpacing: -0.24,
  },
  dash: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 18,
    marginLeft: 4,
  },
});

export default BetItem;
