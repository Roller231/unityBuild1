import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard from "../components/Buttons/GiftCard";

import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";

const { width, height } = Dimensions.get("window");

const Case = () => {
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const animation = useState(new Animated.Value(0))[0];

  const handleSwitch = (tab: "paid" | "free") => {
    setActiveTab(tab);
    Animated.timing(animation, {
      toValue: tab === "paid" ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const switchWidth = width * 0.8; // ширина контейнера
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, switchWidth / 2], // теперь движется ровно на половину
  });
  

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ru" ? "en" : "ru"));
  };

  const handleBalancePress = () => {
    console.log("Balance clicked!");
  };

  return (
    <LinearGradient colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />

      <ScrollView contentContainerStyle={styles.container}>
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
          {/* Кнопка подписки */}
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

          {/* Онлайн + История подарков */}
          <View style={styles.giftHistoryWrapper}>
            {/* 🔹 Онлайн-круг */}
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

            {/* 🎁 История подарков */}
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

          {/* Переключатель */}
 {/* Переключатель */}
 <View style={styles.switchContainer}>
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
            <GiftCard key={index} price={activeTab === "paid" ? "0.5" : "0.1"} />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    alignItems: "center",
    paddingTop: height * 0.05,
    paddingBottom: height * 0.2,
  },

  // 🔹 Верхняя панель
  topBar: {
    width: width * 0.9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.025,
  },
  langButton: {
    backgroundColor: "#1F0248",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  flagIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },

  // 🔹 Средняя часть
  middlePanel: {
    alignItems: "center",
    width: "100%",
    marginBottom: height * 0.04,
  },

  // 💜 Кнопка подписки
  subscribeButton: {
    width: width * 0.9,
    height: height * 0.07,
    borderRadius: 100,
    backgroundColor: "#6B3FD8",
    shadowColor: "#250248",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: height * 0.03,
    justifyContent: "center",
  },
  subscribeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  subscribeIcon: {
    width: 26,
    height: 26,
    marginRight: 8,
  },

  // 🌟 Онлайн + История подарков
  giftHistoryWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.03,
    gap: 12,
  },

  // 👤 Онлайн-круг
  onlineCircle: {
    width: width * 0.16,
    height: width * 0.16,
    borderRadius: (width * 0.16) / 2,
    backgroundColor: "rgba(60, 0, 120, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  userIcon: {
    width: width * 0.05,
    height: width * 0.05,
  },
  onlineText: {
    color: "#00FF66",
    fontWeight: "700",
    fontSize: 14,
  },

  // 🎁 Остальные круги
  giftHistoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
    flexShrink: 1,
  },
  inactiveCircle: {
    width: width * 0.16,
    height: width * 0.16,
    borderRadius: (width * 0.16) / 2,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  giftIcon: {
    width: width * 0.07,
    height: width * 0.07,
    opacity: 0.4,
  },

  // 💠 Переключатель
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    width: width * 0.8,
    height: 48,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#9028FF",
    backgroundColor: "#1F0248", // var(--surface-color-2)
    overflow: "hidden",
    marginTop: height * 0.015,
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
    zIndex: 2, // чтобы текст был поверх highlight
  },
  
  switchText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
  },
  
  switchTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  // 🎁 Сетка подарков
  giftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: width * 0.04,
  },
});

export default Case;
