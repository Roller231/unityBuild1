import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import * as Font from "expo-font";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export interface BetItemProps {
  avatar: any;
  username: string;
  betAmount: number | null;
  multiplier: number | null;      // cashout multiplier
  total: number | null;           // profit or loss
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

  const scale =
    screenHeight < 700
      ? 0.8
      : screenHeight < 850
      ? 0.9
      : isDesktop
      ? 1.05
      : 1;

  // Load fonts
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

  // Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!fontsLoaded) return null;

  // Color of total based on state
  const getTotalStyle = () => {
    switch (state) {
      case "win":
        return { color: "#4EFF7B" };
      case "lose":
        return { color: "#FF4D4D" };
      default:
        return { color: "#FFFFFF" };
    }
  };

  // safe numbers
  const safeBet = Number(betAmount ?? 0).toFixed(2);
  let displayTotal: number;

if (state === "win") {
  // ставка + прибыль
  displayTotal = Number(betAmount ?? 0) + Number(total ?? 0);
} else if (state === "lose") {
  // проигрыш → показать только ставку (абсолют)
  displayTotal = Math.abs(Number(betAmount ?? 0));
} else {
  // активная → показать ставку
  displayTotal = Number(betAmount ?? 0);
}

const safeTotal = displayTotal.toFixed(2);


  // multiplier rules:
  // win → real multiplier
  // lose → 0
  // active → 0
  const displayMultiplier =
    state === "win" ? Number(multiplier ?? 0) : 0;

  const safeMult = displayMultiplier.toFixed(2);

  // multiplier color
  const multiplierColor =
    state === "win"
      ? "#4EFF7B"
      : state === "lose"
      ? "#FF4D4D"
      : "#FFFFFF";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateX: slideAnim }],
          width: fixedWidth,
          height: 64 * scale,
          alignSelf: "center",
        },
      ]}
    >
      {/* LEFT */}
      <View style={styles.left}>
        <Image
          source={avatar}
          style={[
            styles.avatar,
            {
              width: 38 * scale,
              height: 38 * scale,
              borderRadius: 19 * scale,
            },
          ]}
        />

        <View>
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
            />

            <Text
              style={[
                styles.subBet,
                { fontFamily: "SF-Pro-Regular", fontSize: 13 * scale },
              ]}
            >
              {safeBet}
            </Text>

            {/* MULTIPLIER (always shown as x0.00 except win) */}
            <Text
              style={{
                color: multiplierColor,
                fontFamily: "SF-Pro-Regular",
                fontSize: 13 * scale,
              }}
            >
              x{safeMult}
            </Text>
          </View>
        </View>
      </View>

      {/* RIGHT */}
      <View style={styles.right}>
        <Image
          source={require("./icons/ton.svg")}
          style={{ width: 26 * scale, height: 26 * scale }}
        />

        <Text
          style={[
            styles.totalText,
            getTotalStyle(),
            { fontFamily: "SF-Pro-Regular", fontSize: 18 * scale },
          ]}
        >
          {safeTotal}
        </Text>

        {isGift ? (
          <Image
            source={require("./icons/giftStavka.svg")}
            style={{
              width: 30 * scale,
              height: 30 * scale,
              marginLeft: 4 * scale,
            }}
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
    fontSize: 13,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  totalText: {
    fontSize: 18,
    letterSpacing: -0.24,
  },

  dash: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 18,
  },
});

export default BetItem;
