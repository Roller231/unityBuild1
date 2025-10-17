import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Image,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";
import { CrashEngine, CrashEngineState } from "../components/CrashEngine";
import CrashGraph from "../components/CrashGraph";
import Svg, { Text as SvgText } from "react-native-svg";
import OrangeBtn from "../components/OrangeBtn";
import * as Font from "expo-font";
import BetItem from "../components/BetItem";
import StarsBackground from "../components/StarsBackground";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform"; // ✅ добавлено

import vzryv from "../components/icons/vzryv.json";

import LottieView from "lottie-react-native";
import lottieWeb from "lottie-web";

import ava from "../components/icons/AvatarTest.svg";
import Venus from "../components/icons/Venus.svg";

import { Animated, Easing } from "react-native"; // 👈 добавить импорт
import bliks from "../components/icons/bliks.svg";


const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const Crash = () => {
  const platform = useTelegramPlatform(); // ✅ определяем платформу
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : screenWidth; // ✅ фикс для desktop

  const [phase, setPhase] = useState<"idle" | "countdown" | "flight" | "crash">("idle");
  const [count, setCount] = useState(3);
  const [multiplier, setMultiplier] = useState(1.0);
  const [engine, setEngine] = useState<CrashEngine | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [active, setActive] = useState(true);


// === Планета вращается ===
const rotation = useState(new Animated.Value(0))[0];

useEffect(() => {
  Animated.loop(
    Animated.timing(rotation, {
      toValue: 1,
      duration: 60000, // один оборот за 60 секунд
      easing: Easing.linear,
      useNativeDriver: true,
    })
  ).start();
}, []);

const rotateInterpolate = rotation.interpolate({
  inputRange: [0, 1],
  outputRange: ["0deg", "360deg"],
});




  // === Загружаем шрифт ===
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  // === При потере фокуса вырубаем движок ===
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      console.log("▶️ Crash screen active");
      return () => {
        console.log("⏸ Crash screen paused");
        setActive(false);
        setPhase("idle");
        setEngine(null);
        setMultiplier(1.0);
        setCount(3);
      };
    }, [])
  );

  // === Countdown phase ===
  useEffect(() => {
    if (!active || phase !== "countdown") return;
    if (count > 0) {
      const timer = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase("flight");
    }
  }, [count, phase, active]);

  // === Flight phase ===
  useEffect(() => {
    if (!active || phase !== "flight") return;
    const e = new CrashEngine();
    e.onResize(600, 400);
    e.startTime = Date.now();
    e.state = CrashEngineState.Active;
    setEngine(e);

    const interval = setInterval(() => {
      e.tick();
      setMultiplier(e.multiplier);
      if (e.multiplier >= 3.0) {
        e.state = CrashEngineState.Over;
        clearInterval(interval);
        setPhase("crash");
      }
    }, 100);

    return () => {
      clearInterval(interval);
      e.state = CrashEngineState.Over;
    };
  }, [phase, active]);

  // === Reset after crash ===
  useEffect(() => {
    if (phase === "crash") {
      const resetTimer = setTimeout(() => {
        setMultiplier(1.0);
        setCount(3);
        setPhase("idle");
      }, 500);
      return () => clearTimeout(resetTimer);
    }
  }, [phase]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (phase !== "crash") return;
  
    const container = document.getElementById("vzryv-container");
    if (!container) return;
  
    const anim = lottieWeb.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: vzryv,
    });
  
    anim.setSpeed(1.4);
    return () => anim.destroy();
  }, [phase]);
  

  // === Нажатие кнопки PLACE BET ===
  const handleStart = () => {
    if (phase === "idle") setPhase("countdown");
  };

  if (!fontLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#1B003B" }}>  {/* 👈 Добавили фон сюда */}
      <View
        style={[
          styles.container,
          isDesktop && { width: fixedWidth, borderRadius: 25, overflow: "hidden" },
        ]}
      >
        <StarsBackground />

        <Animated.Image
  source={Venus}
  style={[
    styles.planetBackground,
    isDesktop
      ? {
          top: 30,
          left: 30,
          width: 130,
          height: 130,
        }
      : {
          top: screenHeight * 0.04,
          left: screenWidth * 0.07,
          width: screenWidth * 0.25,
          height: screenWidth * 0.25,
        },
    {
      transform: [{ rotate: rotateInterpolate }],
    },
  ]}
  resizeMode="contain"
/>



        {/* === Верхняя часть === */}
        <View style={styles.topSection}>
        {phase === "countdown" && (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      overflow: "hidden",
    }}
  >
    {/* === Вращающийся фон с bliks.svg === */}
    <Animated.Image
      source={bliks}
      resizeMode="contain"
      style={{
        position: "absolute",
        opacity: 0.15,
        transform: [{ rotate: rotateInterpolate }],
        top: "50%",
        left: "50%",
        width: isDesktop ? 650 : screenWidth * 1.3, // 💥 чуть больше экрана
        height: isDesktop ? 650 : screenWidth * 1.3, // 💥 чтобы сияние выходило за края
        marginLeft: isDesktop ? -325 : -(screenWidth * 0.65),
        marginTop: isDesktop ? -325 : -(screenWidth * 0.65),
      }}
    />

    {/* === Цифра отсчёта === */}
    <Text
      style={{
        ...(styles.countdownText as any),
        background:
          "linear-gradient(180deg, #FFAF4D 24.49%, #FFF7A7 57.14%, #FFAF4D 77.55%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontFamily: "SF-Pro-Heavy",
        fontSize: isDesktop ? 180 : screenWidth * 0.3, // 🔥 чуть больше цифра
        zIndex: 5,
      }}
    >
      {count}
    </Text>
  </View>
)}




          {phase === "flight" && (
            <CrashGraph engine={engine} active={active && phase === "flight"} />
          )}

{phase === "crash" && (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      overflow: "hidden",
    }}
  >
    {/* Взрывная анимация */}
    {Platform.OS === "web" ? (
      <div
        id="vzryv-container"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: isDesktop ? 500 : screenWidth * 1.1,
          height: isDesktop ? 500 : screenWidth * 1.1,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
    ) : (
      <LottieView
        source={vzryv}
        autoPlay
        loop={false}
        style={{
          width: isDesktop ? 400 : screenWidth * 1.1,
          height: isDesktop ? 400 : screenWidth * 1.1,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: [{ translateX: -200 }, { translateY: -200 }],
          zIndex: 10,
        }}
      />
    )}
  </View>
)}
        </View>

        {/* === Нижняя часть === */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.betButton, { width: fixedWidth * 0.9 }]}
            onPress={handleStart}
          >
            <OrangeBtn
              width="100%"
              height="100%"
              style={StyleSheet.absoluteFillObject as any}
            />
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
              <SvgText
                fill="none"
                stroke="#D35100"
                strokeWidth={5}
                fontSize={25}
                fontFamily="SF-Pro-Heavy"
                fontWeight="900"
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                letterSpacing={2.5}
              >
                PLACE BET
              </SvgText>
              <SvgText
                fill="#FFF"
                fontSize={25}
                fontFamily="SF-Pro-Heavy"
                fontWeight="900"
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                letterSpacing={2.5}

              >
                PLACE BET
              </SvgText>
            </Svg>
          </TouchableOpacity>

          <View style={[styles.betsContainer, { width: fixedWidth * 0.9 }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 80,
                minHeight: screenHeight * 0.4,
              }}
              style={styles.betsScroll}
            >
              <BetItem
                avatar={ava}
                username="Crazy Frog"
                betAmount={4.38}
                multiplier={1.24}
                total={100}
                state="win"
                isGift
              />
              <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />
                            <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />
                            <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />
                            <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />
                            <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />
                            <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />
                            <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />
                            <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
              />

            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
};

// === Стили ===
const styles = StyleSheet.create({
  planetBackground: {
    position: "absolute",
    opacity: 0.6,
    zIndex: 0,
  },
  planetMobile: {
    top: screenHeight * 0.09,
    left: screenWidth * 0.07,
    width: screenWidth * 0.13,
    height: screenWidth * 0.13,
  },
  planetDesktop: {
    top: 100,
    left: 40,
    width: 120,
    height: 120,
  },
  container: {
    flex: 1,
    backgroundColor: "#1B003B",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topSection: {
    height: screenHeight * 0.5,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: {
    height: screenHeight * 0.5,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    paddingTop: 10,
  },
  countdownText: {
    fontSize: 150,
    fontWeight: "900",
    textAlign: "center",
  },
  crashText: {
    color: "#FF4D4D",
    fontSize: 72,
    fontWeight: "800",
  },
  betButton: {
    height: Platform.OS === "web" ? 80 : screenHeight * 0.065,
    borderRadius: 32,
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
  betsContainer: {
    borderRadius: 16,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "transparent",
    flex: 1,
    overflow: "hidden",
  },
  betsScroll: {
    maxHeight: screenHeight * 0.35,
  },
});

export default Crash;
