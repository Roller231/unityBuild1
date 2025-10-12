import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard from "../components/Buttons/GiftCard";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";

const Case = () => {
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const animation = useState(new Animated.Value(0))[0];

  const platform = useTelegramPlatform();
  const isDesktop =
    platform === "tdesktop" ||
    platform === "macos" ||
    platform === "webk" ||
    platform === "weba" ||
    platform === "web";

  const fixedWidth = isDesktop ? 470 : undefined;

  const handleSwitch = (tab: "paid" | "free") => {
    setActiveTab(tab);
    Animated.timing(animation, {
      toValue: tab === "paid" ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const switchWidth = fixedWidth ? fixedWidth * 0.9 : "90%";
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (fixedWidth ? fixedWidth * 0.9 : 360) / 2],
  });

  const toggleLanguage = () => setLanguage((prev) => (prev === "ru" ? "en" : "ru"));
  const handleBalancePress = () => console.log("Balance clicked!");

  return (
    <LinearGradient colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />

      <View style={[styles.wrapper, fixedWidth && { width: fixedWidth }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          pinchGestureEnabled={false}
        >
          {/* ===== Верхняя панель ===== */}
          <View style={styles.topBar}>
            <TouchableWithoutFeedback onPress={toggleLanguage}>
              <View style={styles.langButton}>
                <Image
                  source={language === "ru" ? FlagRU : FlagEN}
                  style={styles.flagIcon}
                  resizeMode="contain"
                />
              </View>
            </TouchableWithoutFeedback>

            <BalanceButton onPress={handleBalancePress} />
          </View>

          {/* ===== Средняя панель ===== */}
          <View style={styles.middlePanel}>
            {/* 💜 Кнопка подписки */}
            <View style={styles.subscribeButton}>
              <View style={styles.subscribeContent}>
                <Image
                  source={require("../components/icons/cat.png")}
                  style={styles.subscribeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.subscribeText}>Subscribe To Us</Text>
              </View>
            </View>

            {/* 🌟 Онлайн + История подарков */}
            <View style={styles.giftHistoryWrapper}>
              {/* 👤 Онлайн */}
              <View style={styles.onlineCircle}>
                <View style={styles.onlineInner}>
                  <Image
                    source={require("../components/icons/user.svg")}
                    style={styles.userIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.onlineText}>234</Text>
                </View>
              </View>

              {/* 🎁 История подарков — теперь обрезается */}
              <View style={styles.giftHistoryMask}>
                <View style={styles.giftHistoryContainer}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View key={i} style={styles.inactiveCircle}>
                      <Image
                        source={require("../components/icons/gift.png")}
                        style={styles.giftIcon}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 💠 Переключатель */}
            <View
              style={[
                styles.switchContainer,
                fixedWidth && { width: fixedWidth * 0.9 },
              ]}
            >
              <Animated.View
                style={[styles.switchHighlight, { transform: [{ translateX }] }]}
              />
              <TouchableWithoutFeedback onPress={() => handleSwitch("paid")}>
                <View style={styles.switchButton}>
                  <Text
                    style={[
                      styles.switchText,
                      activeTab === "paid" && styles.switchTextActive,
                    ]}
                  >
                    Paid
                  </Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleSwitch("free")}>
                <View style={styles.switchButton}>
                  <Text
                    style={[
                      styles.switchText,
                      activeTab === "free" && styles.switchTextActive,
                    ]}
                  >
                    Free
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>

          {/* ===== Сетка подарков ===== */}
          <View style={styles.giftGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
  <GiftCard
    key={index}
    price={activeTab === "paid" ? "0.5" : "0.1"}
    gradientColors={
      activeTab === "paid"
        ? [
            "rgba(0, 0, 0, 0)",        // прозрачный верх
            "rgba(0, 255, 100, 0.2)", // 💚 зелёный переход
            "rgba(0, 255, 100, 0.85)",  // насыщенный зелёный низ
          ]
        : [
            "rgba(0, 0, 0, 0)",        // прозрачный верх
            "rgba(255, 60, 60, 0.1)",  // ❤️ лёгкий полупрозрачный красный
            "rgba(255, 0, 0, 0.85)",   // насыщенный красный низ
          ]
    }
  />
))}

          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, alignItems: "center" },
  wrapper: {
    flex: 1,
    alignSelf: "center",
  },
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 150,
  },
  topBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20
  },
  langButton: {
    backgroundColor: "#1F0248",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  flagIcon: { width: 28, height: 28, borderRadius: 14 },
  middlePanel: { alignItems: "center", width: "100%", marginBottom: 20 },

  subscribeButton: {
    width: "90%",
    height: 60,
    borderRadius: 100,
    backgroundColor: "#6B3FD8",
    justifyContent: "center",
    marginBottom: 20,
  },
  subscribeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  subscribeIcon: { width: 26, height: 26, marginRight: 8 },

  giftHistoryWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },

  // 👇 контейнер с обрезкой справа
  giftHistoryMask: {
    flexDirection: "row",
    overflow: "hidden", // ✅ всё, что выходит за пределы — просто обрезается
    flexShrink: 1,
  },
  

  giftHistoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
  },

  onlineCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "rgba(60, 0, 120, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineInner: { flexDirection: "row", alignItems: "center", gap: 4 },
  userIcon: { width: 20, height: 20 },
  onlineText: { color: "#00FF66", fontWeight: "700", fontSize: 14 },

  inactiveCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  giftIcon: { width: 24, height: 24, opacity: 0.4 },

  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    height: 56,
    borderRadius: 100,
    borderWidth: 1.2,
    borderColor: "#9028FF",
    backgroundColor: "#1F0248",
    overflow: "hidden",
    paddingHorizontal: 0,
  },
  switchHighlight: {
    position: "absolute",
    width: "50%",
    height: "100%",
    borderRadius: 100,
    backgroundColor: "#9028FF",
  },
  switchButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  switchText: { color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: "600" },
  switchTextActive: { color: "#fff", fontWeight: "700" },

  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 6,
  },
});

export default Case;
