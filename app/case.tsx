import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard, { DropItem } from "../components/Buttons/GiftCard";
import CustomBottomSheet from "../components/CustomBottomSheet";
import CaseScreen from "../components/CaseScreen"; // 🎡 рулетка в шите
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";

const { width: screenWidth } = Dimensions.get("window");

// === пример моковых DropItem (имитация бэкенда)
const sampleDrops: DropItem[] = [
  { id: "1", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 0.05 },
  { id: "2", name: "Silver Coin", icon: require("../components/icons/cat.png"), rarity: "rare", price: 0.15 },
  { id: "3", name: "Golden Ring", icon: require("../components/icons/cat.png"), rarity: "epic", price: 0.35 },
  { id: "4", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
];

const Case = () => {
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const animation = useState(new Animated.Value(0))[0];
  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);
  const [openMenu, setOpenMenu] = useState(false);

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : screenWidth;
  const switchWidth = fixedWidth * 0.9;

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, switchWidth / 2],
  });

  const toggleLanguage = () => {
    Animated.sequence([
      Animated.timing(flagAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
      Animated.timing(flagAnim, { toValue: 50, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      setLanguage((prev) => (prev === "ru" ? "en" : "ru"));
      setCurrentFlag((prev) => (prev === "ru" ? "en" : "ru"));
      Animated.timing(flagAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleGiftPress = () => {
    setOpenMenu(true);
  };

  return (
    <LinearGradient colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />

      <View style={[styles.wrapper, { width: fixedWidth }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          pinchGestureEnabled={false}
        >
          {/* ===== Верхняя панель ===== */}
          <View style={styles.topBar}>
            <TouchableWithoutFeedback onPress={toggleLanguage}>
              <View style={styles.langButton}>
                <Animated.Image
                  source={currentFlag === "ru" ? FlagRU : FlagEN}
                  style={[
                    styles.flagIcon,
                    {
                      transform: [{ translateY: flagAnim }],
                      opacity: flagAnim.interpolate({
                        inputRange: [-50, 0, 50],
                        outputRange: [0, 1, 0],
                      }),
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            </TouchableWithoutFeedback>

            <BalanceButton onPress={() => console.log("Balance clicked")} />
          </View>

          {/* 💠 Переключатель Paid / Free */}
          <View style={[styles.switchContainer, { width: switchWidth }]}>
            <Animated.View style={[styles.switchHighlight, { transform: [{ translateX }] }]} />
            {["paid", "free"].map((tab) => (
              <TouchableWithoutFeedback
                key={tab}
                onPress={() =>
                  Animated.timing(animation, {
                    toValue: tab === "paid" ? 0 : 1,
                    duration: 250,
                    useNativeDriver: false,
                  }).start(() => setActiveTab(tab as any))
                }
              >
                <View style={styles.switchButton}>
                  <Text
                    style={[
                      styles.switchText,
                      activeTab === tab && styles.switchTextActive,
                    ]}
                  >
                    {tab === "paid" ? "Paid" : "Free"}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            ))}
          </View>

          {/* ===== Сетка подарков ===== */}
          <View style={[styles.giftGrid, { width: switchWidth }]}>
            {Array.from({ length: 6 }).map((_, index) => (
              <GiftCard
                key={index}
                price={activeTab === "paid" ? "0.5" : "0.1"}
                cardWidth={(switchWidth - 10) / 2}
                drops={sampleDrops}
                gradientColors={
                  activeTab === "paid"
                    ? ["rgba(0,0,0,0)", "rgba(0,255,100,0.25)", "rgba(0,255,100,0.85)"]
                    : ["rgba(0,0,0,0)", "rgba(255,60,60,0.2)", "rgba(255,0,0,0.85)"]
                }
                onPress={handleGiftPress}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* === BottomSheet с рулеткой === */}
      <CustomBottomSheet
        visible={openMenu}
        onClose={() => setOpenMenu(false)}
        heightRatio={0.9}
      >
        <CaseScreen />
      </CustomBottomSheet>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, alignItems: "center" },
  wrapper: { flex: 1 },
  container: { alignItems: "center", paddingTop: 60, paddingBottom: 150 },
  topBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 40,
  },
  langButton: {
    backgroundColor: "#1F0248",
    borderRadius: 100,
    height: 40,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  flagIcon: { width: 28, height: 28 },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 100,
    borderWidth: 1.2,
    borderColor: "#9028FF",
    backgroundColor: "#1F0248",
    overflow: "hidden",
    marginBottom: 25,
  },
  switchHighlight: {
    position: "absolute",
    width: "50%",
    height: "100%",
    borderRadius: 100,
    backgroundColor: "#9028FF",
  },
  switchButton: { flex: 1, justifyContent: "center", alignItems: "center" },
  switchText: { color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: "600" },
  switchTextActive: { color: "#fff", fontWeight: "700" },
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
});

export default Case;
