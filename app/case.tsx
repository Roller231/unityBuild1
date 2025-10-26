import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Text as SvgText } from "react-native-svg";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard, { DropItem } from "../components/Buttons/GiftCard";
import CustomBottomSheet from "../components/CustomBottomSheet";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CaseRoulette from "../components/CaseRoulette";
import * as Font from "expo-font";
import { useFocusEffect } from "@react-navigation/native";

import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import OrangePng from "../components/icons/OrangePng.png"; // ✅ новый PNG

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const sampleDrops: DropItem[] = [
  { id: "1", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 6000.05 },
  { id: "2", name: "Silver Coin", icon: require("../components/icons/Oran.svg"), rarity: "rare", price: 0.15 },
  { id: "3", name: "Golden Ring", icon: require("../components/icons/VenusP.png"), rarity: "epic", price: 0.35 },
  { id: "4", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
  { id: "5", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 6000.05 },
  { id: "6", name: "Silver Coin", icon: require("../components/icons/Oran.svg"), rarity: "rare", price: 0.15 },
  { id: "7", name: "Golden Ring", icon: require("../components/icons/VenusP.png"), rarity: "epic", price: 0.35 },
  { id: "8", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
  { id: "9", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 6000.05 },
  { id: "10", name: "Silver Coin", icon: require("../components/icons/Oran.svg"), rarity: "rare", price: 0.15 },
  { id: "11", name: "Golden Ring", icon: require("../components/icons/VenusP.png"), rarity: "epic", price: 0.35 },
  { id: "12", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
  { id: "1", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 6000.05 },
  { id: "2", name: "Silver Coin", icon: require("../components/icons/Oran.svg"), rarity: "rare", price: 0.15 },
  { id: "3", name: "Golden Ring", icon: require("../components/icons/VenusP.png"), rarity: "epic", price: 0.35 },
  { id: "4", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
  { id: "5", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 6000.05 },
  { id: "6", name: "Silver Coin", icon: require("../components/icons/Oran.svg"), rarity: "rare", price: 0.15 },
  { id: "7", name: "Golden Ring", icon: require("../components/icons/VenusP.png"), rarity: "epic", price: 0.35 },
  { id: "8", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
  { id: "9", name: "Bronze Coin", icon: require("../components/icons/cat.png"), rarity: "common", price: 6000.05 },
  { id: "10", name: "Silver Coin", icon: require("../components/icons/Oran.svg"), rarity: "rare", price: 0.15 },
  { id: "11", name: "Golden Ring", icon: require("../components/icons/VenusP.png"), rarity: "epic", price: 0.35 },
  { id: "12", name: "Diamond Crown", icon: require("../components/icons/cat.png"), rarity: "legendary", price: 0.7 },
];

const Case = () => {
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const animation = useState(new Animated.Value(0))[0];
  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);
  const [openMenu, setOpenMenu] = useState(false);

  // 🎡 рулетка
  const [spinning, setSpinning] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [result, setResult] = useState<DropItem | null>(null);

  // принудительная перерисовка кнопки
  const [btnKey, setBtnKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setBtnKey((k) => k + 1);
    }, [])
  );

  // шрифт
  const [fontLoaded, setFontLoaded] = useState(false);
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

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
    setSpinning(false);
    setResult(null);
  };

  const handleSpin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const randomItem = sampleDrops[Math.floor(Math.random() * sampleDrops.length)];
    setTimeout(() => setResultId(randomItem.id), 200);
  };

  const handleFinish = (item: DropItem) => {
    setSpinning(false);
    setResult(item);
  };

  if (!fontLoaded) return null;

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
        onClose={() => {
          setOpenMenu(false);
          setSpinning(false);
        }}
        heightRatio={0.9}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetContent}>

          <CaseRoulette
  title="MEGA CASE OPENING"
  items={sampleDrops}
  active={spinning}
  resultId={resultId}
  onFinish={handleFinish}
  onSpin={handleSpin} // 👈 добавили
  spinning={spinning}
/>



            {result && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>
                  🎉 You won {result.price.toFixed(2)} 💎
                </Text>
              </View>
            )}
          </View>

          {/* === Кнопка SPIN === */}
          <View style={styles.bottomButtonContainer}>
           
          </View>
        </View>
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
  sheetContainer: { flex: 1, justifyContent: "space-between" },
  sheetContent: { alignItems: "center", paddingTop: 10 },
  sheetTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 20 },
  betButton: {
    height: Platform.OS === "web" ? 80 : 70,
    borderRadius: 35,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(17, 13, 45, 0.68)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
    alignSelf: "center",
  },
  bottomButtonContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
  },
  resultBox: {
    marginTop: 30,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: "#1F0248",
    borderRadius: 20,
  },
  resultText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});

export default Case;
