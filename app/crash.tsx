// Crash.tsx
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
  TextInput,
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

if (Platform.OS === "web" && typeof window !== "undefined") {
  const alreadyReloaded = sessionStorage.getItem("crash_reloaded");
  if (!alreadyReloaded) {
    sessionStorage.setItem("crash_reloaded", "1");
    window.location.reload();
  }
}



const Crash: React.FC = () => {
  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : Math.min(screenWidth, 470);

  const styles = createStyles(fixedWidth, screenHeight);

  const [resetKey, setResetKey] = useState(0);
  const [phase, setPhase] = useState<"idle" | "countdown" | "flight" | "crash">("idle");
  const [count, setCount] = useState(3);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [active, setActive] = useState(true);
  const [engine, setEngine] = useState<CrashEngine | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [lastMultiplier, setLastMultiplier] = useState(1);
  const [pastCoeffs, setPastCoeffs] = useState<number[]>([]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"Gifts" | "Stars" | "TON">("Gifts");

  const [webReady, setWebReady] = useState(Platform.OS !== "web");


  // bottom sheet states
  const [starsAmount, setStarsAmount] = useState("");
  const [tonAmount, setTonAmount] = useState("");
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoValue, setAutoValue] = useState("2.0");

  const rotation = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const spin = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 60000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        })
      );
      spin.start();
      return () => {
        spin.stop();
        rotation.setValue(0);
      };
    }, [rotation])
  );

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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

  useEffect(() => {
    if (Platform.OS !== "web") return;
  
    const handleReady = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setWebReady(true);
        }, 120); // можно увеличить до 200–250 мс, если надо
      });
    };
  
    if (document.readyState === "complete") {
      handleReady();
    } else {
      window.addEventListener("load", handleReady);
      return () => window.removeEventListener("load", handleReady);
    }
  }, []);
  

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

  useEffect(() => {
    if (!active || phase !== "countdown") return;
    if (count > 0) {
      const timer = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPhase("flight");
    }
  }, [count, phase, active]);


  // 🔁 Автоматический цикл краша при загрузке страницы
useEffect(() => {
  if (!active) return;

  // Если всё закончилось — сразу новый раунд
  if (phase === "idle" || phase === "crash") {
    const restart = setTimeout(() => {
      setCount(3);
      setPhase("countdown");
    }, 5000); // через секунду после краша новый отсчёт
    return () => clearTimeout(restart);
  }
}, [phase, active]);


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

  useEffect(() => {
    if (phase !== "crash") return;
  
    const final = Number(lastMultiplier.toFixed(2));
  
    if (final > 1) {
      setPastCoeffs((prev) => {
        const next = [...prev, final];
        return next.slice(-12);
      });
    }
  
    // Останавливаем текущий движок
    if (engine) {
      cancelAnimationFrame((engine as any)._frameId);
      engine.state = CrashEngineState.Over;
      setEngine(null);
    }
  
    if (Platform.OS === "web") {
      const vz = document.getElementById("vzryv-container");
      if (vz) vz.innerHTML = "";
    }
  
    // ⚡ Через 1.5 секунды перезапускаем страницу (или перерисовываем компонент)
// ⚡ Мягкий сброс без полной перезагрузки страницы
const reloadTimer = setTimeout(() => {
  // очистка Lottie и движка
  if (Platform.OS === "web") {
    const vz = document.getElementById("vzryv-container");
    if (vz) vz.innerHTML = "";
  }

  if (engine) {
    engine.destroy();
    setEngine(null);
  }

  // просто пересоздать игру с новым key
  setResetKey((k) => k + 1);
  setPhase("idle");
  setCount(3);
  setPastCoeffs([]); // можно очищать историю
}, 1200);

  
    return () => clearTimeout(reloadTimer);
  }, [phase]);
  

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

  // Подход: прямой вызов, без requestAnimationFrame
  const handleStart = () => {
    setShowBottomSheet(true);
  };

  if (!fontLoaded) return null;

  const bottomSheetHeightRatio = isDesktop ? 0.5 : 0.6;

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

{/* Краш-граф поверх всех слоёв */}
{phase === "flight" && (
  <View style={styles.graphOverlay}>
    <CrashGraph
      engine={engine}
      active={active && phase === "flight"}
      onMultiplierChange={(m) => {
        setCurrentMultiplier(m);
        setLastMultiplier(m);
      }}
    />
  </View>
)}

        {/* === ВЕРХНЯЯ ЧАСТЬ === */}
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
                  fontFamily: "SF‑Pro‑Heavy",
                  fontSize: isDesktop ? 180 : screenWidth * 0.3,
                  zIndex: 5,
                }}
              >
                {count}
              </Text>
            </View>
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
        </View>

        {/* === НИЖНЯЯ ЧАСТЬ === */}
        <View style={styles.bottomSection}>
          <HistoryBar
            history={[...pastCoeffs, currentMultiplier]}
            activeIndex={pastCoeffs.length}
          />

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
                fontFamily="SF‑Pro‑Heavy"
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
                fontFamily="SF‑Pro‑Heavy"
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

      <CustomBottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        heightRatio={bottomSheetHeightRatio}
      >
        <ScrollView
          contentContainerStyle={styles.bottomSheetContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <Text style={styles.sheetTitle}>Enter amount</Text>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {[
              { key: "Gifts", label: "Gifts", icon: giftIcon },
              { key: "Stars", label: "Stars", icon: starIcon },
              { key: "TON", label: "TON", icon: tonIcon },
            ].map(({ key, label, icon }) => {
              const activeTab = selectedTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tabButton, activeTab && styles.tabButtonActive, { flex: 1 }]}
                  onPress={() => setSelectedTab(key as "Gifts" | "Stars" | "TON")}
                  activeOpacity={0.9}
                >
                  <View style={styles.tabContent}>
                    <Text style={[styles.tabText, activeTab && styles.tabTextActive]}>
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

          {/* Content */}
          {selectedTab === "Gifts" && (
            <View style={{ marginTop: 32, alignItems: "center" }}>
              <Text style={{ color: "#aaa" }}>🎁 Inventory is empty (coming soon)</Text>
            </View>
          )}

          {(selectedTab === "Stars" || selectedTab === "TON") && (
            <View style={{ marginTop: 30, width: "100%", alignItems: "center" }}>
              <Text style={styles.inputLabel}>
                {selectedTab === "Stars" ? "Amount of Stars" : "Amount of TON"}
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#777"
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={selectedTab === "Stars" ? starsAmount : tonAmount}
                  onChangeText={(text) =>
                    selectedTab === "Stars" ? setStarsAmount(text) : setTonAmount(text)
                  }
                />
                <Animated.Image
                  source={selectedTab === "Stars" ? starIcon : tonIcon}
                  resizeMode="contain"
                  style={styles.inputIcon}
                />
              </View>

              <View style={styles.autoRow}>
                <TouchableOpacity
                  style={[styles.checkbox, autoCashout && styles.checkboxActive]}
                  onPress={() => setAutoCashout((prev) => !prev)}
                />
                <Text style={styles.autoLabel}>Auto cashout</Text>

                <View style={styles.autoValueRow}>
                  <TouchableOpacity
                    onPress={() =>
                      setAutoValue((prev) =>
                        Math.max(1, parseFloat(prev) - 0.1).toFixed(1)
                      )
                    }
                  >
                    <Text style={styles.autoControl}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.autoInput}
                    value={autoValue}
                    keyboardType="numeric"
                    onChangeText={setAutoValue}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      setAutoValue((prev) => (parseFloat(prev) + 0.1).toFixed(1))
                    }
                  >
                    <Text style={styles.autoControl}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.placeButton, { width: fixedWidth * 0.85 }]}
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
                    fontFamily="SF‑Pro‑Heavy"
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
                    fontFamily="SF‑Pro‑Heavy"
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
            </View>
          )}
        </ScrollView>
      </CustomBottomSheet>
    </View>
  );
};

const createStyles = (fixedWidth: number, screenHeight: number) =>
  StyleSheet.create({
    textInput: {
      flex: 1,
      color: "#fff",
      fontSize: fixedWidth * 0.045,
      textAlign: "center",
      ...(Platform.OS === "web" ? { outline: "none" } : {}),
    } as any,

    autoInput: {
      color: "#fff",
      fontSize: fixedWidth * 0.04,
      width: fixedWidth * 0.12,
      textAlign: "center",
      ...(Platform.OS === "web" ? { outline: "none" } : {}),
    } as any,

    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderColor: "#6B3FD8",
      borderWidth: 2,
      borderRadius: 100,
      width: fixedWidth * 0.8,
      height: screenHeight * 0.06,
      paddingHorizontal: 16,
      marginBottom: 20,
    },

    tabRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      width: "100%",
      paddingHorizontal: fixedWidth * 0.05,
      marginBottom: 10,
    },

    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: screenHeight * 0.012,
      marginHorizontal: 4,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: "#6B3FD8",
      backgroundColor: "transparent",
    },

    tabButtonActive: {
      backgroundColor: "#6B3FD8",
      borderColor: "#6B3FD8",
    },

    tabContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    tabIcon: {
      width: fixedWidth * 0.05,
      height: fixedWidth * 0.05,
      marginLeft: 6,
    },

    tabText: {
      color: "white",
      fontSize: Math.min(fixedWidth * 0.045, 18),
      fontFamily: "SF‑Pro‑Semibold",
      fontWeight: "600",
    },

    tabTextActive: { color: "white" },

    inputIcon: {
      width: fixedWidth * 0.06,
      height: fixedWidth * 0.06,
      marginLeft: 8,
    },

    inputLabel: { color: "#fff", fontSize: 18, marginBottom: 8 },

    autoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: fixedWidth * 0.85,
      marginTop: 12,
      marginBottom: 16,
    },

    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: "#6B3FD8",
      marginRight: 8,
    },

    checkboxActive: { backgroundColor: "#6B3FD8" },
    autoLabel: { color: "#fff", fontSize: 16, flex: 1 },
    autoValueRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#2B1B59",
      borderRadius: 100,
      paddingHorizontal: 10,
      height: 36,
    },
    autoControl: { color: "#fff", fontSize: 20, paddingHorizontal: 8 },

    placeButton: {
      height: Platform.OS === "web" ? 80 : screenHeight * 0.065,
      borderRadius: 32,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "rgba(17, 13, 45, 0.3)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 10,
      alignSelf: "center",
      marginTop: 20,
    },

    sheetTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 20,
    },
    bottomSheetContainer: { flex: 1, padding: 10, alignItems: "center" },
    betsScrollContainer: {
      alignItems: "center",
      justifyContent: "flex-start",
      paddingBottom: 120,
    },
    planetBackground: { position: "absolute", opacity: 0.6, zIndex: 0 },
    container: {
      flex: 1,
      backgroundColor: "#1B003B",
      alignItems: "center",
      alignSelf: "center",
      maxWidth: fixedWidth,
    },
    graphOverlay: {
      position: "absolute",
      top: screenHeight * 0.08, // 🔹 немного ниже, чтобы не залезал на планету
      left: 0,
      width: "100%",
      height: screenHeight * 0.36, // 🔹 уменьшенная высота
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3,
      pointerEvents: "none", // 🔹 чтобы не блокировал касания
    },
    
    
    topSection: {
      height: screenHeight * 0.5,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    centered: { alignItems: "center", justifyContent: "center", width: "100%" },
    bottomSection: {
      height: screenHeight * 0.5,
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 10,
    },
    countdownText: { fontSize: 150, fontWeight: "900", textAlign: "center" },
    betButton: {
      height: Platform.OS === "web" ? 80 : screenHeight * 0.065,
      borderRadius: 32,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
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
