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

import ava from "../components/icons/AvatarTest.svg";
import Venus from "../components/icons/Venus.svg";

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
      }, 2000);
      return () => clearTimeout(resetTimer);
    }
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

        {/* 🌍 Планета адаптивная */}
        <Image
          source={Venus}
          style={[
            styles.planetBackground,
            isDesktop ? styles.planetDesktop : styles.planetMobile,
          ]}
          resizeMode="contain"
        />

        {/* === Верхняя часть === */}
        <View style={styles.topSection}>
          {phase === "countdown" && (
            <Text
              style={{
                ...(styles.countdownText as any),
                background:
                  "linear-gradient(180deg, #FFAF4D 24.49%, #FFF7A7 57.14%, #FFAF4D 77.55%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "SF-Pro-Heavy",
              }}
            >
              {count}
            </Text>
          )}

          {phase === "flight" && (
            <CrashGraph engine={engine} active={active && phase === "flight"} />
          )}

          {phase === "crash" && <Text style={styles.crashText}>💥</Text>}
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
