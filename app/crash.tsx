import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { CrashEngine, CrashEngineState } from "../components/CrashEngine";
import CrashGraph from "../components/CrashGraph";
import Svg, { Text as SvgText } from "react-native-svg";
import OrangeBtn from "../components/OrangeBtn";
import * as Font from "expo-font";
import BetItem from "../components/BetItem";
import StarsBackground from "../components/StarsBackground";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import HistoryBar from "../components/HistoryBar";

import vzryv from "../components/icons/vzryv.json";
import LottieView from "lottie-react-native";
import lottieWeb from "lottie-web";

import ava from "../components/icons/AvatarTest.svg";
import Venus from "../components/icons/Venus.svg";
import bliks from "../components/icons/bliks.svg";



import giftIcon from "../components/icons/gift.png";
import starIcon from "../components/icons/star.svg";
import tonIcon from "../components/icons/ton.svg";


import CustomBottomSheet from "../components/CustomBottomSheet";


const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

const Crash: React.FC = () => {
  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : screenWidth;

  // === resetKey для перерисовки ===
  const [resetKey, setResetKey] = useState(0);

  const [phase, setPhase] = useState<"idle" | "countdown" | "flight" | "crash">("idle");
  const [count, setCount] = useState(3);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [active, setActive] = useState(true);
  const [engine, setEngine] = useState<CrashEngine | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [lastMultiplier, setLastMultiplier] = useState(1); // ✅ добавлено
  const [pastCoeffs, setPastCoeffs] = useState<number[]>([]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const [selectedTab, setSelectedTab] = useState<"Gifts" | "Stars" | "TON">("Gifts");


  // === вращение планеты ===
// === вращение планеты ===
const rotation = useRef(new Animated.Value(0)).current;

useFocusEffect(
  useCallback(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // при входе в экран — запуск
    spin.start();

    return () => {
      // при выходе — сброс, чтобы заново запустилось при возвращении
      rotation.stopAnimation(() => rotation.setValue(0));
    };
  }, [rotation])
);



  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // === загрузка шрифта ===
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF-Pro-Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
        "SF-Pro-Semibold": require("../fonts/SF-Pro-Display-Semibold.otf"),

      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  // === focus ===
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => {
        setActive(false);
        setPhase("idle");
        setEngine(null);
        setCount(3);
      };
    }, [])
  );

  // === отсчёт ===
  useEffect(() => {
    if (!active || phase !== "countdown") return;
    if (count > 0) {
      const timer = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase("flight");
    }
  }, [count, phase, active]);

  // === сохранение истории в localStorage ===
  useEffect(() => {
    if (Platform.OS === "web") {
      localStorage.setItem("crash_history", JSON.stringify(pastCoeffs));
    }
  }, [pastCoeffs]);

  useEffect(() => {
    if (Platform.OS === "web") {
      const saved = localStorage.getItem("crash_history");
      if (saved) setPastCoeffs(JSON.parse(saved));
    }
  }, []);

  // === полёт ===
  useEffect(() => {
    if (!active || phase !== "flight") return;
    const e = new CrashEngine();
    e.onResize(600, 400);
    e.startTime = Date.now();
    e.state = CrashEngineState.Active;
    setEngine(e);

    let frameId: number;
    const tick = () => {
      e.tick();
      if (e.multiplier >= 2.0) {
        e.state = CrashEngineState.Over;
        setPhase("crash");
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      e.state = CrashEngineState.Over;
    };
  }, [phase, active]);

  // === взрыв и перезапуск ===
  useEffect(() => {
    if (phase !== "crash") return;

    const final = Number(lastMultiplier.toFixed(2)); // ✅ фикс: берём последний актуальный множитель
    if (final > 1) {
      setPastCoeffs((prev) => {
        const next = [...prev, final];
        return next.slice(-12); // последние 12
      });
    }

    const restartTimer = setTimeout(() => {
      console.log("♻️ Перезапуск Crash после взрыва...");
      setResetKey((k) => k + 1);
    }, 2000);

    if (engine) {
      cancelAnimationFrame((engine as any)._frameId);
      engine.state = CrashEngineState.Over;
      setEngine(null);
    }

    if (Platform.OS === "web") {
      const vz = document.getElementById("vzryv-container");
      if (vz) vz.innerHTML = "";
    }

    return () => clearTimeout(restartTimer);
  }, [phase]);

  // === web-взрыв ===
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (phase !== "crash" || !active) return;

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
    anim.addEventListener("complete", () => anim.destroy());
    return () => anim.destroy();
  }, [phase, active]);

  const handleStart = () => {
    setShowBottomSheet(true); // показать bottom sheet
  };

  if (!fontLoaded) return null;

  return (
    <View key={resetKey} style={{ flex: 1, backgroundColor: "#1B003B" }}>
      <View
        style={[
          styles.container,
          isDesktop && { width: fixedWidth, borderRadius: 25, overflow: "hidden" },
        ]}
      >
        <StarsBackground />

        {/* вращающаяся планета */}
        <Animated.Image
          source={Venus}
          style={[
            styles.planetBackground,
            isDesktop
              ? { top: 30, left: 30, width: 130, height: 130 }
              : {
                  top: screenHeight * 0.04,
                  left: screenWidth * 0.07,
                  width: screenWidth * 0.25,
                  height: screenWidth * 0.25,
                },
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
          resizeMode="contain"
        />

        {/* верхняя часть */}
        <View style={styles.topSection}>
          {phase === "countdown" && (
            <View style={styles.centered}>
              <Animated.Image
                source={bliks}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  opacity: 0.15,
                  transform: [{ rotate: rotateInterpolate }],
                  top: "50%",
                  left: "50%",
                  width: isDesktop ? 650 : screenWidth * 1.3,
                  height: isDesktop ? 650 : screenWidth * 1.3,
                  marginLeft: isDesktop ? -325 : -(screenWidth * 0.65),
                  marginTop: isDesktop ? -325 : -(screenWidth * 0.65),
                }}
              />
              <Text
                style={{
                  ...(styles.countdownText as any),
                  background:
                    "linear-gradient(180deg, #FFAF4D 24.49%, #FFF7A7 57.14%, #FFAF4D 77.55%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "SF-Pro-Heavy",
                  fontSize: isDesktop ? 180 : screenWidth * 0.3,
                  zIndex: 5,
                }}
              >
                {count}
              </Text>
            </View>
          )}

          {phase === "flight" && (
            <CrashGraph
              engine={engine}
              active={active && phase === "flight"}
              onMultiplierChange={(m) => {
                setCurrentMultiplier(m);
                setLastMultiplier(m); // ✅ сохраняем актуальный множитель
              }}
            />
          )}

          {phase === "crash" && (
            <View style={styles.centered}>
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
                    zIndex: 9999,
                    background: "transparent",
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
                    backgroundColor: "transparent",
                    zIndex: 9999,
                  }}
                />
              )}
            </View>
          )}


<CustomBottomSheet
  visible={showBottomSheet}
  onClose={() => setShowBottomSheet(false)}
  heightRatio={0.4}
>
  <View style={styles.bottomSheetContainer}>
    <Text style={styles.sheetTitle}>Deposit funds TON</Text>

    {/* Tabs */}
    <View style={styles.tabRow}>
  {[
    { key: "Gifts", label: "Gifts", icon: giftIcon },
    { key: "Stars", label: "Stars", icon: starIcon },
    { key: "TON", label: "TON", icon: tonIcon },
  ].map(({ key, label, icon }) => {
    const active = selectedTab === key;
    return (
      <TouchableOpacity
        key={key}
        style={[styles.tabButton, active && styles.tabButtonActive]}
        onPress={() => setSelectedTab(key as "Gifts" | "Stars" | "TON")}
        activeOpacity={0.8}
      >
        <View style={styles.tabContent}>
          <Text style={[styles.tabText, active && styles.tabTextActive]}>
            {label}
          </Text>
          <Animated.Image
            source={icon}
            resizeMode="contain"
            style={styles.tabIcon}
          />
        </View>
      </TouchableOpacity>
    );
  })}
</View>




    {/* Placeholder content */}
    <View style={{ marginTop: 32 }}>
      <Text style={{ color: "#aaa" }}>
        {selectedTab === "Gifts" && "You have no gifts"}
        {selectedTab === "Stars" && "No stars available"}
        {selectedTab === "TON" && "Wallet not connected"}
      </Text>
    </View>
  </View>
</CustomBottomSheet>


        </View>

        {/* нижняя часть */}
        <View style={styles.bottomSection}>
          <HistoryBar history={[...pastCoeffs, currentMultiplier]} activeIndex={pastCoeffs.length} />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.betButton, { width: fixedWidth * 0.9 }]}
            onPress={handleStart}
          >
            <OrangeBtn width="100%" height="100%" style={StyleSheet.absoluteFillObject as any} />
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
                letterSpacing={3}
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
                letterSpacing={3}
              >
                PLACE BET
              </SvgText>
            </Svg>
          </TouchableOpacity>

          <View style={[styles.betsContainer, { width: fixedWidth * 0.9 }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              pinchGestureEnabled={false}
              scrollEventThrottle={16}
              overScrollMode="always"
              bounces
              contentContainerStyle={[
                styles.betsScrollContainer,
                { width: fixedWidth * 0.9, minHeight: screenHeight * 0.4 },
              ]}
            >
              {[...Array(9)].map((_, i) => (
                <BetItem
                  key={i}
                  avatar={ava}
                  username={i === 0 ? "Crazy Frog" : "MoonSun"}
                  betAmount={5.12}
                  multiplier={1.42}
                  total={i === 0 ? 100 : 0}
                  state={i === 0 ? "win" : "lose"}
                  isGift={i === 0}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
};

// === стили ===
const styles = StyleSheet.create({

  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  
  tabButton: {
    padding: 4,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#6B3FD8",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  
  tabButtonActive: {
    backgroundColor: "#6B3FD8",
    borderColor: "#6B3FD8",
  },
  
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  tabText: {
    color: "white",
    fontSize: 18,
    fontFamily: "SF-Pro-Semibold",
    fontWeight: "600",
    textTransform: "capitalize",
    lineHeight: 23.4,
  },
  
  tabTextActive: {
    color: "white",
  },
  
  tabIcon: {
    width: 22,
    height: 22,
  },
  

  
  
  tabIconWrapper: {
    width: 24,
    height: 24,
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  
  iconBg: {
    width: 22,
    height: 20,
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 0,
  },
  
  iconBgActive: {
    width: 24,
    height: 24,
    backgroundColor: "#0088CC",
    borderRadius: 9999,
  },
  
  
  

  bottomSheetContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
    fontFamily: "SF-Pro-Heavy",

  },

  tabButtonText: {
    color: "#ccc",
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#fff",
  },
  


  betsScrollContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBottom: 120,
    paddingTop: 0,
    gap: 0,
  },
  planetBackground: {
    position: "absolute",
    opacity: 0.6,
    zIndex: 0,
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
  centered: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    overflow: "hidden",
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
});

export default Crash;
