import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard from "../components/Buttons/GiftCard";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";



import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";

const { width: screenWidth } = Dimensions.get("window");

const Case = () => {
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const animation = useState(new Animated.Value(0))[0];

  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);


  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : screenWidth;

  const handleSwitch = (tab: "paid" | "free") => {
    setActiveTab(tab);
    Animated.timing(animation, {
      toValue: tab === "paid" ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const switchWidth = fixedWidth * 0.9;
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, switchWidth / 2],
  });

  const toggleLanguage = () => {
    // анимация вылета старого флага вверх
    Animated.sequence([
      Animated.timing(flagAnim, {
        toValue: -50, // поднимаем старый флаг вверх
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flagAnim, {
        toValue: 50, // опускаем "новый" флаг снизу
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // меняем язык после вылета старого флага
      setLanguage((prev) => (prev === "ru" ? "en" : "ru"));
      setCurrentFlag((prev) => (prev === "ru" ? "en" : "ru"));
  
      // анимация вылета нового флага вверх (в центр)
      Animated.timing(flagAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };
  
  const handleBalancePress = () => console.log("Balance clicked!");

  // ✅ вычисляем ширину карточек (2 в ряд)
  const contentWidth = switchWidth;
  const cardSpacing = 10;
  const cardWidth = (contentWidth - cardSpacing) / 2;

  // 🚫 отключаем масштабирование/ресайз
  useEffect(() => {
    const metaTag = document.querySelector('meta[name="viewport"]');
    if (metaTag) {
      metaTag.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "viewport";
      newMeta.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
      document.head.appendChild(newMeta);
    }

    // блокировка ресайза окна (на десктопе)
    const preventResize = (e: Event) => {
      e.preventDefault();
      return false;
    };
    window.addEventListener("resize", preventResize);
    return () => window.removeEventListener("resize", preventResize);
  }, []);

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
            outputRange: [0, 1, 0], // плавное появление/исчезание
          }),
        },
      ]}
      resizeMode="contain"
    />
  </View>
</TouchableWithoutFeedback>


            <BalanceButton onPress={handleBalancePress} />
          </View>

          {/* ===== Средняя панель ===== */}
          <View style={styles.middlePanel}>
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

            <View style={styles.giftHistoryWrapper}>
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
            <View style={[styles.switchContainer, { width: switchWidth }]}>
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
          <View style={[styles.giftGrid, { width: contentWidth }]}>
            {Array.from({ length: 9 }).map((_, index) => (
              <GiftCard
                key={index}
                price={activeTab === "paid" ? "0.5" : "0.1"}
                cardWidth={cardWidth}
                gradientColors={
                  activeTab === "paid"
                    ? [
                        "rgba(0, 0, 0, 0)",
                        "rgba(0, 255, 100, 0.25)",
                        "rgba(0, 255, 100, 0.85)",
                      ]
                    : [
                        "rgba(0, 0, 0, 0)",
                        "rgba(255, 60, 60, 0.2)",
                        "rgba(255, 0, 0, 0.85)",
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
  wrapper: { flex: 1, alignSelf: "center" },
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
    marginTop: 40,
  },
  langButton: {
    backgroundColor: "#1F0248",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
    overflow: "hidden", // ✅ чтобы флаг не вылезал за рамку при анимации
    height: 40,
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  
  flagIcon: { width: 28, height: 28, borderRadius: 1 },
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
    width: "90%", // ✅ вместо 100%
    alignSelf: "center", // ✅ добавляем
    marginBottom: 20,
    gap: 12,
  },
  
  giftHistoryMask: {
    flexDirection: "row",
    overflow: "hidden",
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
    backgroundColor: "#1F0248",
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
    backgroundColor: "#1F0248",
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
    justifyContent: "space-between",
    rowGap: 10,
    marginTop: 10,
  },
});

export default Case;
