import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard, { DropItem } from "../components/Buttons/GiftCard";
import CustomBottomSheet from "../components/CustomBottomSheet";
import CaseResultModal from "../components/CaseResultModal";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";

import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import TonIcon from "../components/icons/ton.svg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// === пример моковых DropItem (имитация бэкенда)
const sampleDrops: DropItem[] = [
  {
    id: "1",
    name: "Bronze Coin",
    icon: require("../components/icons/cat.png"),
    rarity: "common",
    price: 0.05,
  },
  {
    id: "2",
    name: "Silver Coin",
    icon: require("../components/icons/cat.png"),
    rarity: "rare",
    price: 0.15,
  },
  {
    id: "3",
    name: "Golden Ring",
    icon: require("../components/icons/cat.png"),
    rarity: "epic",
    price: 0.35,
  },
  {
    id: "4",
    name: "Diamond Crown",
    icon: require("../components/icons/cat.png"),
    rarity: "legendary",
    price: 0.7,
  },
];

const Case = () => {
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const animation = useState(new Animated.Value(0))[0];
  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);
  const [onlineCount, setOnlineCount] = useState(234);

  const [selectedGift, setSelectedGift] = useState<any>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [showResult, setShowResult] = useState(false);

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
      Animated.timing(flagAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flagAnim, {
        toValue: 50,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLanguage((prev) => (prev === "ru" ? "en" : "ru"));
      setCurrentFlag((prev) => (prev === "ru" ? "en" : "ru"));
      Animated.timing(flagAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleGiftPress = (gift: { price: string; gradientColors: string[] }) => {
    setSelectedGift({
      ...gift,
      drops: sampleDrops,
    });
    setOpenMenu(true);
  };

  const handleOpenCase = () => {
    setOpenMenu(false);
    setTimeout(() => setShowResult(true), 400);
  };

  return (
    <LinearGradient colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />

      <View style={[styles.wrapper, { width: fixedWidth }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          pinchGestureEnabled={false}
          scrollEnabled
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

          {/* 💠 Переключатель */}
          <View style={[styles.switchContainer, { width: switchWidth }]}>
            <Animated.View
              style={[styles.switchHighlight, { transform: [{ translateX }] }]}
            />
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
                    {tab.toUpperCase()}
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

      {/* === Нижнее меню с дропами === */}
      <CustomBottomSheet visible={openMenu} onClose={() => setOpenMenu(false)} heightRatio={0.8}>
        {selectedGift && (
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={styles.caseTitle}>🎁 CASE {selectedGift.price} TON</Text>

            {/* Верхняя лента */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.topScroll}
              contentContainerStyle={styles.topScrollInner}
            >
              {selectedGift.drops.map((item: DropItem) => (
                <View
                  key={item.id}
                  style={[styles.dropCard, styles[`rarity_${item.rarity}`]]}
                >
                  <Image source={item.icon} style={styles.dropIcon} resizeMode="contain" />
                  <View style={styles.dropPrice}>
                    <Image source={TonIcon} style={styles.tonIcon} />
                    <Text style={styles.dropPriceText}>{item.price.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.subtitle}>WHAT’S INSIDE?</Text>

            {/* Нижняя сетка */}
            <View style={styles.grid}>
              {selectedGift.drops.map((item: DropItem) => (
                <View key={item.id} style={styles.gridItem}>
                  <Image source={item.icon} style={styles.gridIcon} />
                  <Text style={styles.gridText}>{item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.openCaseBtn} onPress={handleOpenCase}>
              <Text style={styles.openCaseText}>OPEN CASE</Text>
            </TouchableOpacity>
          </View>
        )}
      </CustomBottomSheet>

      {showResult && (
        <CaseResultModal
          amount={parseFloat(selectedGift?.price || "0")}
          onClose={() => setShowResult(false)}
        />
      )}
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

  // === BottomSheet ===
  caseTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 10 },
  topScroll: { marginBottom: 20 },
  topScrollInner: { paddingHorizontal: 10, gap: 8 },
  dropCard: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: "#1F0248",
    justifyContent: "center",
    alignItems: "center",
  },
  dropIcon: { width: 36, height: 36 },
  dropPrice: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 3,
  },
  tonIcon: { width: 10, height: 10, tintColor: "#00AEEF" },
  dropPriceText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  rarity_common: { borderWidth: 1, borderColor: "#555" },
  rarity_rare: { borderWidth: 1, borderColor: "#4BC0FF" },
  rarity_epic: { borderWidth: 1, borderColor: "#B24CFF" },
  rarity_legendary: { borderWidth: 1, borderColor: "#FFD700" },

  subtitle: {
    color: "#C4BED4",
    fontSize: 16,
    marginBottom: 12,
    marginTop: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "90%",
    rowGap: 12,
  },
  gridItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#1F0248",
    alignItems: "center",
    justifyContent: "center",
  },
  gridIcon: { width: 34, height: 34, marginBottom: 4 },
  gridText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  openCaseBtn: {
    marginTop: 20,
    backgroundColor: "#6B3FD8",
    paddingVertical: 12,
    paddingHorizontal: 60,
    borderRadius: 100,
  },
  openCaseText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});

export default Case;
