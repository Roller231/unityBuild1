import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Image
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { CrashEngine, CrashEngineState } from "../components/CrashEngine";
import CrashGraph from "../components/CrashGraph";
import Svg, { Text as SvgText } from "react-native-svg";
import OrangeBtn from "../components/OrangeBtn";
import * as Font from "expo-font";
import BetItem from "../components/BetItem";
import StarsBackground from "../components/StarsBackground";

import ava from "../components/icons/AvatarTest.svg";

import Venus from "../components/icons/Venus.svg";


const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const Crash = () => {
  const [phase, setPhase] = useState<"countdown" | "flight" | "crash">(
    "countdown"
  );
  const [count, setCount] = useState(3);
  const [multiplier, setMultiplier] = useState(1.0);
  const [engine, setEngine] = useState<CrashEngine | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  // ====== Загружаем шрифт SF Pro Heavy ======
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  // ===== Countdown phase =====
  useEffect(() => {
    if (phase === "countdown" && count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else if (count === 0) {
      setPhase("flight");
    }
  }, [count, phase]);

  // ===== Flight phase =====
  useEffect(() => {
    if (phase === "flight") {
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

      return () => clearInterval(interval);
    }
  }, [phase]);

  // ===== Reset after crash =====
  useEffect(() => {
    if (phase === "crash") {
      setTimeout(() => {
        setMultiplier(1.0);
        setCount(3);
        setPhase("countdown");
      }, 2000);
    }
  }, [phase]);

  if (!fontLoaded) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <StarsBackground />

          {/* 🌍 Планета на фоне */}
  <Image
    source={Venus}
    style={styles.planetBackground}
    resizeMode="contain"
  />

        {/* === Верхняя половина: график или отсчёт === */}
        <View style={styles.topSection}>
          {phase === "countdown" &&
            (Platform.OS === "web" ? (
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
            ) : (
              <MaskedView
                maskElement={
                  <View
                    style={{ justifyContent: "center", alignItems: "center" }}
                  >
                    <Text
                      style={[
                        styles.countdownText,
                        { color: "black", fontFamily: "SF-Pro-Heavy" },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                }
              >
                <View
                  style={{
                    height: 200,
                    width: "100%",
                    backgroundColor: "transparent",
                  }}
                />
              </MaskedView>
            ))}

          {phase === "flight" && <CrashGraph engine={engine} />}

          {phase === "crash" && <Text style={styles.crashText}>💥</Text>}
        </View>

        {/* === Нижняя половина: кнопка и ставки === */}
        <View style={styles.bottomSection}>
          {/* === Кнопка PLACE BET === */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.betButton}
            onPress={() => console.log("PLACE BET")}
          >
            <OrangeBtn
              width="100%"
              height="100%"
              style={StyleSheet.absoluteFillObject as any}
            />
            <Svg
              height="100%"
              width="100%"
              style={StyleSheet.absoluteFillObject}
            >
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
              >
                PLACE BET
              </SvgText>
            </Svg>
          </TouchableOpacity>

          {/* === Меню ставок со скроллом === */}
          <View style={styles.betsContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 60 }}
              style={styles.betsScroll}
            >
              <BetItem
                avatar={ava}
                username="Crazy Frog"
                betAmount={4.38}
                multiplier={1.24}
                total={100}
                state="win"
                isGift={true}
              />
                            <BetItem
                avatar={ava}
                username="Crazy Frog"
                betAmount={4.38}
                multiplier={1.24}
                total={100}
                state="win"
                isGift={true}
              />
              <BetItem
                avatar={ava}
                username="MoonSun"
                betAmount={5.12}
                multiplier={1.42}
                total={0.0}
                state="lose"
                isGift={false}
              />
              <BetItem
                avatar={ava}
                username="MegaMan"
                betAmount={3.42}
                multiplier={2.21}
                total={120.5}
                state="win"
                isGift={true}
              />
              <BetItem
                avatar={ava}
                username="GoldMiner"
                betAmount={1.24}
                multiplier={1.13}
                total={0.0}
                state="lose"
                isGift={false}
              />
              <BetItem
                avatar={ava}
                username="Blazer"
                betAmount={2.88}
                multiplier={1.56}
                total={0.0}
                state="active"
                isGift={true}
              />
                            <BetItem
                avatar={ava}
                username="Blazer"
                betAmount={2.88}
                multiplier={1.56}
                total={5}
                state="active"
                isGift={true}
              />
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({


  planetBackground: {
      position: "absolute",
      top: screenHeight * 0.09,   // 🔹 немного отступа сверху (~3% высоты экрана)
      left: screenWidth * 0.01,   // 🔹 немного отступа слева (~5% ширины экрана)
      width: screenWidth * 0.07,  // 🔹 ширина планеты = 18% ширины экрана
      height: screenWidth * 0.07, // 🔹 чтобы была пропорциональной
      opacity: 0.6,               // 🔹 лёгкая прозрачность
      zIndex: 0,                  // 🔹 под всеми элементами
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
    gap: 10, // ⬇️ меньше отступ между кнопкой и списком
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
    width: screenWidth * 0.9,
    height: Platform.OS === "web" ? 80 : screenHeight * 0.065,
    borderRadius: 32,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
    shadowColor: "rgba(17, 13, 45, 0.68)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
    alignSelf: "center",
  },
  betsContainer: {
    width: "90%",
    borderRadius: 16,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "transparent",
    borderWidth: 0,
    flex: 1, // ✅ чтобы растягивалось под скролл
    overflow: "hidden",
  },
  betsScroll: {
    maxHeight: screenHeight * 0.35, // ✅ ограничение высоты скролла
  },
});

export default Crash;
