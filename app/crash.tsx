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
  Image,
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

import BalanceButton from "../components/Buttons/BalanceButton";

import userIcon from "../components/icons/user.svg"; // или user.svg — смотри по проекту

import vzryv from "../components/icons/vzryv.json";
import LottieView from "lottie-react-native";
import { init, viewport, swipeBehavior, isTMA } from "@telegram-apps/sdk-react";

import lottieWeb from "lottie-web";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { onLanguageChange } from "@/components/languageEvents";

import ava from "../components/icons/AvatarTest.svg";
import Venus from "../components/icons/Venus.svg";
import bliks from "../components/icons/bliks.svg";

import giftIcon from "../components/icons/gift.png";
import starIcon from "../components/icons/star.svg";
import tonIcon from "../components/icons/ton.svg";

import CustomBottomSheet from "../components/CustomBottomSheet";

const { height: screenHeight, width: screenWidth } = Dimensions.get("window");

// if (Platform.OS === "web" && typeof window !== "undefined") {
//   const alreadyReloaded = sessionStorage.getItem("crash_reloaded");
//   if (!alreadyReloaded) {
//     sessionStorage.setItem("crash_reloaded", "1");
//     window.location.reload();
//   }
// }
export const vibrate = (pattern: number | number[] = 50) => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
};



const Crash: React.FC = () => {

  const [graphKey, setGraphKey] = useState(0);

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : Math.min(screenWidth, 470);
  const scale = (size: number) => size * (fixedWidth / 390);
  const styles = createStyles(fixedWidth, screenHeight, isDesktop);

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

  // 🌍 Переводы
const translations = {
  ru: {
    enterAmount: "Введите сумму",
    gifts: "Внести",
    stars: "Звёзды",
    ton: "TON",
    amountOfStars: "Количество звёзд",
    amountOfTon: "Количество TON",
    autoCashout: "Авто-вывод",
    placeBet: "СДЕЛАТЬ СТАВКУ",
    inventoryEmpty: "🎁 Инвентарь пуст",
  },
  en: {
    enterAmount: "Enter amount",
    gifts: "Gifts",
    stars: "Stars",
    ton: "TON",
    amountOfStars: "Amount of Stars",
    amountOfTon: "Amount of TON",
    autoCashout: "Auto cashout",
    placeBet: "PLACE BET",
    inventoryEmpty: "🎁 Inventory is empty",
  },
} as const;

type Lang = keyof typeof translations;
type TranslationKey = keyof typeof translations["en"];

const useTranslation = (lang: Lang) => (key: TranslationKey) =>
  translations[lang][key];




// ...

const [language, setLanguage] = useState<"ru" | "en">("ru");
const t = useTranslation(language);

useEffect(() => {
  async function initTg() {
    if (await isTMA()) {
      init();

      if (viewport.mount.isAvailable()) {
        await viewport.mount();
        viewport.expand();
      }

      if (viewport.requestFullscreen.isAvailable()) {
        await viewport.requestFullscreen();
      }
    }
  }
  initTg();

}, []);

useEffect(() => {
  const loadLang = async () => {
    const saved = await AsyncStorage.getItem("app_language");
    if (saved === "ru" || saved === "en") setLanguage(saved);
  };
  loadLang();

  const unsub = onLanguageChange((newLang) => {
    if (newLang === "ru" || newLang === "en") setLanguage(newLang);
  });
  return unsub;
}, []);


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
        "SF-Pro-Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
        "SF-Pro-Regular": require("../fonts/SF-Pro-Display-Regular.otf"),
        "SF-Pro-Bold": require("../fonts/SF-Pro-Display-Bold.otf"),
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

// === взрыв и перезапуск ===
// === взрыв и перезапуск ===
useEffect(() => {
  if (phase !== "crash") return;

  const final = Number(lastMultiplier.toFixed(2));

  // 🟣 сохраняем множитель в историю
  if (final > 1) {
    setPastCoeffs((prev) => {
      const next = [...prev, final];
      return next.slice(-12);
    });
  }

  // 💥 Останавливаем движок
  if (engine) {
    cancelAnimationFrame((engine as any)._frameId);
    engine.state = CrashEngineState.Over;
    engine.destroy?.();
    setEngine(null);
  }

  // 💣 Очищаем анимацию взрыва
  if (Platform.OS === "web") {
    const vz = document.getElementById("vzryv-container");
    if (vz) vz.innerHTML = "";
  }

  // ⚡ Перезапуск после короткой паузы
// ⚡ Мягкий перезапуск без пересоздания компонентов
const reloadTimer = setTimeout(() => {
  // 1. Останавливаем текущий движок
  if (engine) {
    engine.destroy?.();
    setEngine(null);
  }

  // 2. Сбрасываем только игровые параметры
  setCurrentMultiplier(1);
  setLastMultiplier(1);

  // 3. Запускаем новый отсчёт
  setPhase("countdown");
  setCount(3);
}, 2000);



  return () => clearTimeout(reloadTimer);
}, [phase]);


  

  
  useFocusEffect(
    useCallback(() => {
      // При фокусе — активируем, как сейчас
      setActive(true);
  
      return () => {
        // 🔁 Когда пользователь УХОДИТ со страницы:
        // сбрасываем всё как при “перезагрузке”
        setActive(false);
        setPhase("idle");
        setCount(3);
        setEngine(null);
        setCurrentMultiplier(1);
        setLastMultiplier(1);
        setPastCoeffs([]);
        setShowBottomSheet(false);
        setResetKey((k) => k + 1); // 🔥 заставит компонент обновиться полностью
      };
    }, [])
  );
  

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

  const bottomSheetHeightRatio = isDesktop ? 0.8 : 0.8;

  return (
    <View key={resetKey} style={{ flex: 1, backgroundColor: "#1B003B" }}>
      <View
        style={[
          styles.container,
          isDesktop && { width: fixedWidth, borderRadius: 25, overflow: "hidden" },
        ]}
      >
        <StarsBackground />
{/* === Верхняя панель: Онлайн + Баланс === */}
{/* === Верхняя панель: Онлайн + Баланс === */}
<View style={styles.topBar}>
  {/* Онлайн капсула */}
{/* Онлайн кнопка в стиле баланса */}
<View style={styles.onlineOuterGlow}>
  <View style={styles.onlineContainer}>
  <Image
          source={require("../components/icons/user.svg")}
          style={styles.userIcon}
          resizeMode="contain"
        />
    <Text style={styles.onlineText}>234</Text>
  </View>
</View>



  {/* Баланс справа */}
  <BalanceButton onPress={() => setShowBottomSheet(true)} />
</View>


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

        {/* === Отдельный контейнер для CrashGraph === */}
<View style={styles.graphContainer}>
  {phase === "flight" && engine && (
    <CrashGraph
      key={graphKey}
      engine={engine}
      active={active && phase === "flight"}
      onMultiplierChange={(m) => {
        setCurrentMultiplier(m);
        setLastMultiplier(m);
      }}
    />
  )}
</View>


{/* Краш-граф поверх всех слоёв */}




        {/* === ВЕРХНЯЯ ЧАСТЬ === */}
<View style={styles.topSection}>
  {/* === Счётчик перед полётом === */}
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
          width: isDesktop
            ? 650
            : screenHeight < 700
            ? screenWidth * 1.0
            : screenWidth * 1.2,
          height: isDesktop
            ? 650
            : screenHeight < 700
            ? screenWidth * 1.0
            : screenWidth * 1.2,
          marginLeft: isDesktop
            ? -325
            : screenHeight < 700
            ? -(screenWidth * 0.5)
            : -(screenWidth * 0.6),
          marginTop: isDesktop
            ? -325
            : screenHeight < 700
            ? -(screenWidth * 0.5)
            : -(screenWidth * 0.6),
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
          fontSize: isDesktop
            ? 180
            : screenHeight < 700
            ? screenWidth * 0.22
            : screenWidth * 0.3,
          zIndex: 5,
        }}
      >
        {count}
      </Text>
    </View>
  )}

  {/* === Полёт === */}
  {phase === "flight" && (
    <View
      style={{
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        transform: [
          {
            scale:
              isDesktop
                ? 1
                : screenHeight < 700
                ? 0.75
                : screenHeight < 850
                ? 0.9
                : 1,
          },
        ],
      }}
    >



    </View>
  )}

  {/* === Взрыв === */}
  {phase === "crash" && (
    <View style={styles.centered}>
      {Platform.OS === "web" ? (
        <div
          id="vzryv-container"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
            height: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
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
            width: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
            height: isDesktop
              ? 400
              : screenHeight < 700
              ? screenWidth * 0.9
              : screenWidth * 1.1,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: [
              { translateX: -200 },
              { translateY: -200 },
            ],
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
  phase={phase}
/>


          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.betButton, { width: fixedWidth * 0.9 }]}
            onPress={() => {handleStart(), vibrate()}}
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
                strokeWidth={fixedWidth * 0.014} // адаптивная толщина обводки
                fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                fontFamily="SF‑Pro‑Heavy"
                fontWeight="900"
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                letterSpacing={3}
              >
                                      {t("placeBet")}

              </SvgText>
              <SvgText
                fill="#FFF"
                fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                                fontFamily="SF‑Pro‑Heavy"
                fontWeight="900"
                x="50%"
                y="50%"
                textAnchor="middle"
                alignmentBaseline="middle"
                letterSpacing={3}
              >
                                      {t("placeBet")}

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
<Text style={styles.sheetTitle}>{t("enterAmount")}</Text>

          {/* Tabs */}
         {/* === Три вкладки Gifts / Stars / TON === */}
{/* === Три вкладки Gifts / Stars / TON — 1в1 с Profile === */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(20),
    flexWrap: "nowrap",
  }}
>
  {[
    { key: "Gifts", label: t("gifts"), icon: giftIcon },
    { key: "Stars", label: t("stars"), icon: starIcon },
    { key: "TON", label: t("ton"), icon: tonIcon },
  ].map(({ key, label, icon }) => {
    const activeTab = selectedTab === key;
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.9}
        onPress={() => setSelectedTab(key as "Gifts" | "Stars" | "TON")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: scale(2),
          borderColor: "#6B3FD8",
          borderRadius: 100,
          backgroundColor: activeTab ? "#6B3FD8" : "transparent",
          paddingVertical: scale(10),
          paddingHorizontal: scale(16),
          marginHorizontal: scale(6),
          minWidth: scale(90),
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: scale(14),
            fontFamily: "SF-Pro-Semibold",
            letterSpacing: 0.2,
            fontWeight: activeTab ? "700" : "500",
            marginRight: scale(5),
          }}
        >
          {label}
        </Text>
        <Animated.Image
          source={icon}
          resizeMode="contain"
          style={{ width: scale(18), height: scale(18) }}
        />
      </TouchableOpacity>
    );
  })}
</View>



          {/* Content */}
          {selectedTab === "Gifts" && (
            <View style={{ marginTop: 32, alignItems: "center" }}>
<Text style={{ color: "#aaa" }}>{t("inventoryEmpty")}</Text>
            </View>
          )}

          {(selectedTab === "Stars" || selectedTab === "TON") && (
            <View style={{ marginTop: 30, width: "100%", alignItems: "center" }}>
<Text style={styles.inputLabel}>
  {selectedTab === "Stars" ? t("amountOfStars") : t("amountOfTon")}
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
<Text style={styles.autoLabel}>{t("autoCashout")}</Text>

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
                    strokeWidth={fixedWidth * 0.014} // адаптивная толщина обводки
                    fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("placeBet")}
                  </SvgText>
                  <SvgText
                    fill="#FFF"
                    fontSize={fixedWidth * 0.06}     // 🔹 адаптивный размер текста
                    fontFamily="SF‑Pro‑Heavy"
                    fontWeight="900"
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    letterSpacing={3}
                  >
                      {t("placeBet")}
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

const createStyles = (fixedWidth: number, screenHeight: number, isDesktop: boolean) =>
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
      height: 50,
      paddingHorizontal: 16,
      marginBottom: 20,
    },

    tabRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      paddingHorizontal: fixedWidth * 0.04,
      marginBottom: 14,
      gap: 8,
    },
    
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 100,
      borderWidth: 2,
      borderColor: "#6B3FD8",
      backgroundColor: "transparent",
      paddingVertical: screenHeight * 0.012,

    },
    
    tabButtonActive: {
      backgroundColor: "#6B3FD8",
      borderColor: "#6B3FD8",
    },
    
    tabText: {
      color: "#C4BED4",
      fontFamily: "SF-Pro-Semibold",
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    
    tabTextActive: {
      color: "#fff",
    },
    
    tabIcon: {
      width: fixedWidth * 0.05,
      height: fixedWidth * 0.05,
      marginLeft: 4,
    },
    

    

    tabContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

   


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
      top: screenHeight * 0.20, // 🔹 граф теперь ниже топ-бара
      left: 0,
      width: "100%",
      height: screenHeight * 0.35,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3,
      pointerEvents: "none",
    },
    
    
    
    topSection: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      // 🔹 адаптация под экран
      height: isDesktop
        ? screenHeight * 0.45
        : screenHeight < 700
        ? screenHeight * 0.3
        : screenHeight * 0.4,
    },
    
    centered: { alignItems: "center", justifyContent: "center", width: "100%" },
    bottomSection: {
      height: screenHeight * 0.5,
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 5,
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




    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    
      // 🔹 адаптация отступа сверху по высоте экрана
      marginTop: 100,
    
      marginBottom: screenHeight < 750 ? 0 : 0,
      paddingHorizontal: isDesktop ? 20 : 0,
      width: "100%",
      alignSelf: "center",
      zIndex: 10,
    },
    
    
    
    // 🔸 Онлайн-капсула — как в HTML-примере
    onlineCapsule: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#52288C",
      borderRadius: 100,
      paddingHorizontal: 12,
      paddingVertical: 4,
      justifyContent: "center",
      gap: 8,
      height: 32,
    },
    
    onlineIcon: {
      width: 16,
      height: 16,
      position: "relative",
      overflow: "hidden",
    },
    graphContainer: {
      position: "absolute",
      top: isDesktop
        ? screenHeight * 0.19 // ✅ было 0.2 → поднимаем граф выше
        : screenHeight < 700
        ? screenHeight * 0.16 // 🔹 на айфонах поднимаем сильнее
        : screenHeight * 0.12,
      left: 0,
      width: "100%",
      height: isDesktop
        ? screenHeight * 0.38 // чуть меньше — пропорционально сцене
        : screenHeight < 700
        ? screenHeight * 0.36
        : screenHeight * 0.38,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      zIndex: 4,
      pointerEvents: "none",
    },
    
    
    

    onlineOuterGlow: {
      borderRadius: 100,
      padding: 0.7,
      backgroundColor: "rgba(255,255,255,0.25)",
      shadowColor: "#ffffff",
      shadowOpacity: 0.6,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 0 },
    },
    onlineContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      height: 38, // 🔹 увеличена высота капсулы
      borderRadius: 100,
      backgroundColor: "rgba(120, 60, 200, 0.4)",
      overflow: "hidden",
      gap: 6,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#52288C",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    icon: {
      width: "100%",
      height: "100%",
    },
    plusCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#2B174B",
      justifyContent: "center",
      alignItems: "center",
    },
    onlineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#3AE85C",
    },
    onlineText: {
      color: "#76DA19",
      fontWeight: "700",
      fontSize: 18,
      marginHorizontal: 6,
      fontFamily: "SF-Pro-Bold",
    },
    
    
    onlineLineTop: {
      position: "absolute",
      width: 5.33,
      height: 5.33,
      left: 5.33,
      top: 1.33,
      backgroundColor: "#76DA19",
    },
    
    onlineLineBottom: {
      position: "absolute",
      width: 10.67,
      height: 6,
      left: 2.67,
      top: 8.67,
      backgroundColor: "#76DA19",
    },
    

    
    
    userIcon: {
      width: 18,
      height: 18,
      marginRight: 6,
    },
    

    

    
  });

export default Crash;
