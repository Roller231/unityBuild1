import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StarsBackground from "../components/StarsBackground";
import BalanceButton from "../components/Buttons/BalanceButton";
import GiftCard, { DropItem } from "../components/Buttons/GiftCard";
import CustomBottomSheet from "../components/CustomBottomSheet";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import CaseRoulette from "../components/CaseRoulette";
import * as Font from "expo-font";
import Confetti from "react-confetti";

import FlagRU from "../components/icons/ru.png";
import FlagEN from "../components/icons/us.png";
import TonIcon from "../components/icons/ton.svg";
import Svg, { Text as SvgText } from "react-native-svg";
import { emitLanguageChange, onLanguageChange } from "@/components/languageEvents";


import { useLaunchParams } from "@telegram-apps/sdk-react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { vibrate } from "./crash";

import { apiGet, apiPatch } from "./api";



import { useUser } from "../components/UserContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");


const Case = () => {

  const { user, setUser } = useUser();

  const BASE_WIDTH = 390;
  const BASE_HEIGHT = 844; // iPhone 12
  const scaleW = screenWidth / BASE_WIDTH;
  const scaleH = screenHeight / BASE_HEIGHT;
  
  // Универсальный helper: масштабирует относительно меньшей оси
  

// === BottomSheet пополнения ===
const [showDepositSheet, setShowDepositSheet] = useState(false);
const [selectedTab, setSelectedTab] = useState<"Gifts" | "Stars" | "TON">("TON");
const [tonAmount, setTonAmount] = useState("");
const [cases, setCases] = useState<any[]>([]);

const [starsAmount, setStarsAmount] = useState("");

// 🌍 Переводы
const translations = {
  ru: {
    paid: "Платные",
    free: "Бесплатные",
    enterAmount: "Введите сумму",
    gifts: "Внести",
    stars: "Звёзды",
    ton: "TON",
    connectWallet: "ПОДКЛЮЧИТЬ КОШЕЛЁК",
    amountOfStars: "Количество звёзд",
    amountOfTon: "Количество TON",
    congratulations: "Поздравляем!",
    ok: "Понятно",
    deposit: "Внести",
    subscribeToUs: "Подписаться на нас", // 🔹 ← добавлено
    giftStep1: "Перейдите в ",
    giftStep2: "Отправьте любой подарок",
    giftStep3: "Подарок появится в вашем инвентаре",
    giftStep4: "Убедитесь, что подарок отправлен с того же аккаунта Telegram",
  },
  en: {
    paid: "Paid",
    free: "Free",
    enterAmount: "Enter amount",
    gifts: "Gifts",
    stars: "Stars",
    ton: "TON",
    connectWallet: "CONNECT WALLET",
    amountOfStars: "Amount of Stars",
    amountOfTon: "Amount of TON",
    congratulations: "Congratulations!",
    ok: "Ok",
    deposit: "Deposit",
    subscribeToUs: "Subscribe To Us", // 🔹 ← добавлено
    giftStep1: "Go to your profile",
    giftStep2: "Send any gift",
    giftStep3: "The gift will appear in your inventory",
    giftStep4: "Make sure you send the gift from the same Telegram account",
  },
} as const;

type Lang = keyof typeof translations;
type TranslationKey = keyof typeof translations["en"];

const useTranslation = (lang: Lang) => (key: TranslationKey) =>
  translations[lang][key];



  const [resetKey, setResetKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"paid" | "free">("paid");
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const t = useTranslation(language);

  const [flagAnim] = useState(new Animated.Value(0));
  const [currentFlag, setCurrentFlag] = useState(language);
  const [animation] = useState(new Animated.Value(0));

  const [openMenu, setOpenMenu] = useState(false);
  const [resultSheetVisible, setResultSheetVisible] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [result, setResult] = useState<DropItem | null>(null);

  const [dropHistory, setDropHistory] = useState<
  { uid: string; id: string; icon: string; animate: boolean }[]
>([]);




// ✅ при загрузке читаем язык из AsyncStorage
  // ✅ при загрузке читаем язык из AsyncStorage
  useFocusEffect(
    React.useCallback(() => {
      const checkLanguage = async () => {
        const saved = await AsyncStorage.getItem("app_language");
        if (saved === "ru" || saved === "en") {
          setLanguage(saved);
          setCurrentFlag(saved);
        }
      };
  
      checkLanguage();
    }, []) // <-- зависимости указываем здесь внутри useCallback
  );
  
  


  const launchParams = (() => {
    try {
      return useLaunchParams();
    } catch {
      
      return {
        tgWebAppData: {
          user: { first_name: "Guest", last_name: "", photo_url: null },
        },
      };
    }
  })();
  
  
  
// === Загрузка списка кейсов ===
useEffect(() => {
  async function loadCases() {
    try {
      
      const data = await apiGet("/cases/");

      // 🔥 Проверяем
      
      data.forEach((c: { gradient_colors: any; }, i: any) => {
        
      });

      setCases(data);
    } catch (e) {
      
    }
  }

  loadCases();
}, []);


async function loadDropsForCase(caseId: number) {
  try {
    // 1. Получаем список CaseDrops
    const caseDrops = await apiGet(`/case-drops/case/${caseId}`);

    if (!Array.isArray(caseDrops)) return [];

    // 2. Загружаем сами дропы
    const drops = await Promise.all(
      caseDrops.map(async (cd) => {
        const drop = await apiGet(`/drops/${cd.drop_id}`);

        return {
          id: String(drop.id),
          name: drop.name,
          icon: drop.icon,
          rarity: drop.rarity,
          price: drop.price,
          chance: cd.chance,       // 🔥 Добавили шанс
        };
      })
    );

    return drops;
  } catch (err) {
    console.log("❌ Ошибка загрузки дропов:", err);
    return [];
  }
}




  const [fontLoaded, setFontLoaded] = useState(false);
  useEffect(() => {
    const loadFont = async () => {
      await Font.loadAsync({
        "SF‑Pro‑Heavy": require("../fonts/SF-Pro-Display-Heavy.otf"),
        "SF‑Pro‑Medium": require("../fonts/SF-Pro-Display-Medium.otf"),
      });
      setFontLoaded(true);
    };
    loadFont();
  }, []);

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const bottomSheetHeightRatio = isDesktop ? 0.8 : 0.8;


  
  const fixedWidth = isDesktop ? 470 : screenWidth;
  const scale = (size: number) => size * (fixedWidth / 390);
  
  const switchWidth = fixedWidth * 0.9;
  const iconSize = Math.min(fixedWidth * 0.45, 200);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, switchWidth / 2],
  });

  const [drops, setDrops] = useState<DropItem[]>([]);


  const toggleLanguage = async () => {
    const newLang = language === "ru" ? "en" : "ru";
    setLanguage(newLang);
    setCurrentFlag(newLang);
    await AsyncStorage.setItem("app_language", newLang);
  
    emitLanguageChange(newLang); // 🔹 вот это ключ
  
    Animated.sequence([
      Animated.timing(flagAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
      Animated.timing(flagAnim, { toValue: 50, duration: 0, useNativeDriver: true }),
      Animated.timing(flagAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };
  const filteredCases = cases.filter(c =>
    activeTab === "paid" ? c.price > 0 : c.price === 0
  );
  

  const [selectedCase, setSelectedCase] = useState<any | null>(null);

const handleGiftPress = async (caseItem: any) => {
  

  setSelectedCase(caseItem);
  setOpenMenu(true);
  setSpinning(false);
  setResult(null);

  // Загружаем реальные дропы
  const realDrops = await loadDropsForCase(caseItem.id);

  
  setDrops(realDrops); // сохраним в состояние
};

function pickByChance(drops: DropItem[]) {
  const total = drops.reduce((sum, d) => sum + d.chance, 0);
  let rnd = Math.random() * total;

  for (const drop of drops) {
    rnd -= drop.chance;
    if (rnd <= 0) return drop;
  }

  return drops[drops.length - 1]; // fallback
}

useFocusEffect(
  useCallback(() => {
    console.log("🎯 Case screen focused → connecting WS");

    const ws = new WebSocket("ws://127.0.0.1:8000/ws/drops/global");

    ws.onopen = () => console.log("WS connected");
    ws.onerror = (err) => console.log("WS error:", err);

    ws.onmessage = (msg) => {
      try {
        const { event, data } = JSON.parse(msg.data);
        if (event === "drop") {
          const newItem = {
            uid: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            id: String(data.id),
            icon: data.icon,
            animate: true,
          };

          setDropHistory(prev => {
            const updated = [
              newItem,
              ...prev.map((d) => ({ ...d, animate: false })),
            ];

            return updated.slice(0, 6);
          });

          setTimeout(() => {
            setDropHistory(prev =>
              prev.filter(item => item.uid !== newItem.uid)
            );
          }, 15000);
        }
      } catch (e) {}
    };

    // 🧹 cleanup когда уходим со страницы
    return () => {
      console.log("🚪 Case screen blurred → closing WS");
      ws.close();
    };
  }, [])
);



const handleSpin = async () => {
  if (spinning) return;
  setResult(null);

  const randomItem = pickByChance(drops);
  setResult(randomItem); // победитель выбран ЗДЕСЬ

  if (!user) {
    console.log("❌ user is null");
    return;
  }

  // === 1. Добавляем drop сразу ===
  try {
    const inv = user.inventory || [];
  
    // ищем, есть ли уже drop_id
    const existing = inv.find((item: { drop_id: string; }) => item.drop_id === randomItem.id);
  
    let updatedInventory;
  
    if (existing) {
      updatedInventory = inv.map((item: { drop_id: string; count: number; }) =>
        item.drop_id === randomItem.id
          ? { ...item, count: item.count + 1 }
          : item
      );
    } else {
      updatedInventory = [
        ...inv,
        { drop_id: randomItem.id, count: 1 }
      ];
    }
  
    setUser((prev: any) => ({
      ...prev,
      inventory: updatedInventory,
    }));
    
  
    // обновляем на сервере
    await apiPatch(`/users/${user.id}`, {
      inventory: updatedInventory,
    });
  
    console.log("✔ Дроп добавлен пользователю:", randomItem.id);
  
  } catch (err) {
    console.log("❌ Ошибка добавления дропа:", err);
  }
  

  // === 2. Запускаем прокрутку рулетки ===
  setSpinning(true);
};



  const handleFinish = (item: DropItem) => {
    setSpinning(false);
    setResult(item);
    setOpenMenu(false);
    setTimeout(() => setResultSheetVisible(true), 300);
  };

  if (!fontLoaded) return null;

  return (
    <LinearGradient key={resetKey} colors={["#340A6F", "#18003A"]} style={styles.background}>
      <StarsBackground />
      <View style={[styles.wrapper, { width: fixedWidth }]}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Верхняя панель */}
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

  <BalanceButton
    onPress={() => {
      setSelectedTab("TON");
      setShowDepositSheet(true);
    }}
  />
</View>
{/* ===== Средняя панель ===== */}
<View style={styles.middlePanel}>
  {/* 🔸 Кнопка подписки */}
{/* 🔸 Кнопка подписки */}
<TouchableOpacity style={[styles.subscribeButton, { height: scale(60) }]} activeOpacity={0.8}>
  <View style={styles.subscribeContent}>
    <Image
      source={require("../components/icons/cat.png")}
      style={[styles.subscribeIcon, { width: scale(26), height: scale(26), marginRight: scale(8) }]}
      resizeMode="contain"
    />
    <Text
      style={[
        styles.subscribeText,
        { fontSize: scale(18) } // 🔹 адаптивный шрифт
      ]}
      numberOfLines={1} // 🔹 не ломает кнопку при длинном переводе
      adjustsFontSizeToFit // 🔹 автоуменьшает шрифт, если не помещается
      minimumFontScale={0.8} // 🔹 минимальное уменьшение
    >
      {t("subscribeToUs")}
    </Text>
  </View>
</TouchableOpacity>


  {/* 🔸 История подарков и онлайн */}
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

    <View style={styles.giftHistoryContainer}>
    {dropHistory.map((drop) => (
  <AnimatedDropBubble
    key={drop.uid}        // ⬅️ ключ теперь всегда уникальный
    icon={drop.icon}
    animate={drop.animate}
  />
))}




</View>

  </View>
</View>


          {/* Переключатель Paid / Free */}
<View style={[styles.switchContainer, { width: switchWidth }]}>
  <Animated.View style={[styles.switchHighlight, { transform: [{ translateX }] }]} />
  {["paid", "free"].map(tab => (
    <TouchableWithoutFeedback
      key={tab}
      onPress={() =>{
        Animated.timing(animation, { toValue: tab === "paid" ? 0 : 1, duration: 250, useNativeDriver: false })
          .start(() => setActiveTab(tab as any))
      }}
    >
      <View style={styles.switchButton}>
        <Text style={[styles.switchText, activeTab === tab && styles.switchTextActive]}>
          {t(tab as "paid" | "free")}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  ))}
</View>


          {/* Сетка подарков */}
         <View style={[styles.giftGrid, { width: switchWidth }]}>



         {filteredCases.map((caseItem, index) => (
    <GiftCard
      key={caseItem.id}
      price={String(caseItem.price)}
      cardWidth={(switchWidth - 10) / 2}

      drops={drops}

      gradientColors={
        caseItem.gradient_colors
          ? caseItem.gradient_colors.split(" ")
          : ["rgba(0,0,0,0)", "rgba(0,255,100,0.25)", "rgba(0,255,100,0.85)"]
      }
      mainImage={caseItem.main_image}

      onPress={() => handleGiftPress(caseItem)}
    />
  ))}

</View>

        </ScrollView>
      </View>

      {/* BottomSheet рулетки */}
      <CustomBottomSheet
        visible={openMenu}
        onClose={() => {
          setOpenMenu(false);
          setSpinning(false);
        }}
        heightRatio={0.8}
      >
        <View style={[styles.sheetContainer, styles.sheetBorder]}>
          <View style={styles.sheetContent}>

  

            <CaseRoulette
              
              items={drops}
              active={spinning}
              resultItem={result} // 🔥 pass the item, not just ID
              onFinish={handleFinish}
              onSpin={handleSpin}
              spinning={spinning}

              casePrice={selectedCase?.price}
            />
          </View>
        </View>
      </CustomBottomSheet>

      <CustomBottomSheet
  visible={resultSheetVisible}
  onClose={() => setResultSheetVisible(false)}
  heightRatio={0.7} // ✅ не микроскопическая высота
>
  {resultSheetVisible && (
    <Confetti
      width={screenWidth}
      height={screenHeight * 0.5}
      numberOfPieces={300}
      recycle={false}
      gravity={0.4}
      run={resultSheetVisible}
    />
  )}

  {result && (
    <View style={styles.resultWrapper}>
      {/* 🧩 Масштабируем всё меню пропорционально */}
      <View
        style={{
          transform: [{ scale: fixedWidth / 450 }],

          alignItems: "center",
          justifyContent: "center",
          width: fixedWidth * 0.9,      // 🔥 как у трёх кнопок
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontFamily: "SF-Pro-Medium",
            fontSize: 28,
            fontWeight: "600",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          {t("congratulations")}
        </Text>

        <View
          style={{
            width: 180,
            height: 180,
            borderRadius: 18,
            backgroundColor: "#1F0248",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Image
            source={result.icon}
            style={{ width: "80%", height: "55%" }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 24,
              fontWeight: "500",
              marginRight: 10,
            }}
          >
            +{result.price.toFixed(2)}
          </Text>
          <Image
            source={TonIcon}
            style={{ width: 26, height: 26 }}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setResultSheetVisible(false);
            setTimeout(() => setResetKey((prev) => prev + 1), 300);
          }}
          style={{
            width: fixedWidth * 0.9,   // 🔥 адаптивно, как Crash
            height: 60,
            backgroundColor: "#6B3FD8",
            borderRadius: 100,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
            {t("ok")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</CustomBottomSheet>




{/* === Bottom Sheet Пополнения (Deposit) === */}
{/* === Bottom Sheet Пополнения (Deposit) === */}
<CustomBottomSheet
  visible={showDepositSheet}
  onClose={() => setShowDepositSheet(false)}
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
{/* Tabs */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: scale(20),
    flexWrap: "nowrap", // 🔹 только один ряд
  }}
>
  {[
    { key: "Gifts", label: t("gifts"), icon: require("../components/icons/gift.png") },
    { key: "Stars", label: t("stars"), icon: require("../components/icons/star.svg") },
    { key: "TON", label: t("ton"), icon: require("../components/icons/ton.svg") },
  ].map(({ key, label, icon }, i) => {
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
    marginRight: scale(5), // теперь отступ после текста
  }}
>
  {label}
</Text>
<Image
  source={icon}
  resizeMode="contain"
  style={{
    width: scale(18),
    height: scale(18),
  }}
/>

      </TouchableOpacity>
    );
  })}
</View>


    {/* Контент */}
    {selectedTab === "Gifts" && (
  <View style={styles.giftStepsWrapper}>
    {/* === Вертикальная линия (градиент) === */}
    <LinearGradient
      colors={["#59AACC", "rgba(89, 170, 204, 0)"]}
      style={styles.verticalLine}
    />

    {/* === Содержимое шагов === */}
    <View style={styles.giftStepsContainer}>
      {/* === Шаг 1 === */}
      <View style={styles.stepRow}>
  <View style={styles.stepCircle}>
    <Text style={styles.stepNumber}>1</Text>
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>


    {t("giftStep1")} <Text
  style={[
    styles.stepHighlight,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>@GiftUpRelayer</Text>
  </Text>
</View>

<View style={styles.stepRow}>
  <View style={styles.stepCircle}>
    <Text style={styles.stepNumber}>2</Text>
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>{t("giftStep2")}</Text>
</View>

<View style={styles.stepRow}>
  <View style={[styles.stepCircle, styles.stepCirclePurple]}>
    <Image
      source={require("../components/icons/gift.png")}
      style={styles.stepGiftIcon}
      resizeMode="contain"
    />
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>{t("giftStep3")}</Text>
</View>

<View style={styles.stepRow}>
  <View style={styles.stepCircle}>
    <Text style={styles.stepAlert}>!</Text>
  </View>
  <Text
  style={[
    styles.stepText,
    {
      // 🔹 Только если язык русский — уменьшаем текст под маленькие экраны
      fontSize:
        language === "ru"
          ? screenWidth < 360
            ? 15
            : screenWidth < 390
            ? 16
            : 18
          : 18,
      lineHeight:
        language === "ru"
          ? screenWidth < 360
            ? 20
            : screenWidth < 390
            ? 21
            : 22
          : 22,
      maxWidth: "80%",
      flexShrink: 1,
      flexWrap: "wrap",
    },
  ]}
  adjustsFontSizeToFit
  minimumFontScale={0.9}
>{t("giftStep4")}</Text>
</View>


      {/* === Кнопка CONNECT WALLET === */}
     {/* === Кнопка CONNECT WALLET === */}
<View style={{ width: "100%", alignItems: "center", marginTop: 0 }}>
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.placeButton, { width: fixedWidth * 1.4 }]}
    
  >
    <Image
      source={require("../components/icons/OrangePng.png")}
      style={styles.orangePng}
      resizeMode="contain"
    />
    <Svg
      height="100%"
      width="100%"
      style={StyleSheet.absoluteFillObject}
      viewBox="0 0 400 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <SvgText
        fill="none"
        stroke="#D35100"
        strokeWidth={5}
        fontSize="16"
        fontFamily="SF-Pro-Heavy"
        fontWeight="900"
        x="50%"
        y="45%"
        textAnchor="middle"
        letterSpacing={1.5}
      >
        {t("connectWallet")}
      </SvgText>
      <SvgText
        fill="#FFF"
        fontSize="16"
        fontFamily="SF-Pro-Heavy"
        fontWeight="900"
        x="50%"
        y="45%"
        textAnchor="middle"
        letterSpacing={1.5}
      >
        {t("connectWallet")}
      </SvgText>
    </Svg>
  </TouchableOpacity>
</View>

    </View>
  </View>
)}



    {(selectedTab === "Stars" || selectedTab === "TON") && (
      <View style={{ marginTop: 30, width: "100%", alignItems: "center" }}>
        <Text style={styles.inputLabel}>
          {selectedTab === "Stars" ? t("amountOfStars") : t("amountOfTon")}
        </Text>

        <View style={styles.inputWrapper}>
  <View style={{ flex: 1, position: "relative" }}>
    <TextInput
      placeholder="0"
      placeholderTextColor="#777"
      style={[styles.textInput, { paddingRight: scale(40) }]} // 🔹 отступ под иконку
      keyboardType="numeric"
      value={selectedTab === "Stars" ? starsAmount : tonAmount}
      onChangeText={(text) =>
        selectedTab === "Stars" ? setStarsAmount(text) : setTonAmount(text)
      }
    />
    <Animated.Image
      source={
        selectedTab === "Stars"
          ? require("../components/icons/star.svg")
          : require("../components/icons/ton.svg")
      }
      resizeMode="contain"
      style={[
        styles.inputIcon,
        {
          position: "absolute",
          right: scale(-7),
          top: "50%",
          transform: [{ translateY: -13 }],
        },
      ]}
    />
  </View>
</View>


        {/* Кнопка CONNECT WALLET */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.placeButton, { width: fixedWidth * 1.4 }]}
          onPress={() =>
            console.log(
              `Depositing ${selectedTab === "TON" ? tonAmount : starsAmount} ${selectedTab}`
            )
          }
        >
          <Image
            source={require("../components/icons/OrangePng.png")}
            style={styles.orangePng}
            resizeMode="contain"
          />

          <Svg
            height="100%"
            width="100%"
            style={StyleSheet.absoluteFillObject}
            viewBox="0 0 400 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <SvgText
              fill="none"
              stroke="#D35100"
              strokeWidth={5}
              fontSize="16"
              fontFamily="SF-Pro-Heavy"
              fontWeight="900"
              x="50%"
              y="45%"
              textAnchor="middle"
              letterSpacing={1.5}
            >
              {t("connectWallet")}
            </SvgText>
            <SvgText
              fill="#FFF"
              fontSize="16"
              fontFamily="SF-Pro-Heavy"
              fontWeight="900"
              x="50%"
              y="45%"
              textAnchor="middle"
              letterSpacing={1.5}
            >
              {t("connectWallet")}
            </SvgText>
          </Svg>
        </TouchableOpacity>
      </View>
    )}
  </ScrollView>
</CustomBottomSheet>





    </LinearGradient>
  );
};

const styles = StyleSheet.create({

  giftStepsWrapper: {
    width: "100%",
    position: "relative",
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 10,
  },
  
  verticalLine: {
    position: "absolute",
    left: 37, // центр вертикальной оси для кругов (width 44)
    top: 22,
    width: 10,
    height: "60%",
    borderRadius: 2,
    zIndex: 0,
  },
  
  giftStepsContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 20,
  },
  
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32, // 🔹 одинаковый отступ между всеми блоками
  },
  
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 30,
    backgroundColor: "#240058", // одинаковый фон для 1, 2 и !
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  
  stepCirclePurple: {
    backgroundColor: "#6B3FD8",
  },
  
  stepNumber: {
    color: "white",
    fontSize: 18,
    fontFamily: "SF-Pro-Heavy",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  
  stepGiftIcon: {
    width: 22,
    height: 22,
    tintColor: "white",
  },
  
  stepAlert: {
    color: "#FF005C",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  
  stepText: {
    color: "#C4BED4",
    fontSize: 18,
    fontFamily: "SF-Pro-Medium",
    lineHeight: 22,
    flexShrink: 1,
  },
  
  stepHighlight: {
    color: "#A07BFF",
    fontSize: 18,
    fontFamily: "SF-Pro-Medium",
  },
  




  
  
  stepCircleAlert: {
    backgroundColor: "#240058",
    borderWidth: 2,
    borderColor: "#FF005C",
  },
  
  
  
  stepTextWrapper: {
    flex: 1,
  },
  
  
  
  stepLine: {
    height: 30,
    width: 2,
    backgroundColor: "rgba(160,123,255,0.3)",
    alignSelf: "center",
    marginLeft: 21,
    marginBottom: 8,
  },
  


  middlePanel: {
    alignItems: "center",
    width: "100%",
    marginBottom: 0,
    marginTop: 0, // 🔹 отступ сверху под верхними кнопками
  },
  
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
    width: "90%",
    alignSelf: "center",
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
  onlineText: { color: "#76da19", fontWeight: "700", fontSize: 14 },
  inactiveCircle: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#1F0248",
    justifyContent: "center",
    alignItems: "center",
  },
  giftIcon: { width: 34, height: 34, opacity: 1 },
  

  resultContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
  },
  
  resultContent: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  
  resultTitle: {
    color: "#fff",
    fontFamily: "SF-Pro-Medium",
    fontWeight: "600",
    textAlign: "center",
  },
  
  prizeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  okButton: {
    backgroundColor: "#6B3FD8",
    justifyContent: "center",
    alignItems: "center",
  },
  
  okButtonText: {
    color: "#fff",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  
  

  sheetTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  



  background: { flex: 1, alignItems: "center" },
  wrapper: { flex: 1 },
  container: { alignItems: "center", paddingTop: 60, paddingBottom: 150 },
  topBar: {
    width: "94%", // 🔹 чуть шире, чтобы визуально сократить боковые отступы
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,      // 🔹 отступ сверху как в Case.tsx
    marginBottom: 25,   // 🔹 отступ снизу как в Case.tsx
    alignSelf: "center",
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
  sheetContainer: { flex: 1, justifyContent: "center" },
  sheetContent: { alignItems: "center", paddingTop: 10 },
  sheetBorder: { padding: 10, overflow: "hidden", elevation: 5 },


  resultWrapper: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
  },
  resultModal: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  
  cardOnly: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1F0248",
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  cardIcon: {
    width: "80%",
    height: "55%",
  },

  prizeText: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "SF‑Pro‑Medium",
    fontWeight: "500",
    textTransform: "uppercase",
    lineHeight: 31.2,
    paddingRight: 10
  },
  tonIconWrapper: {
    marginLeft: 20,
    width: 24,
    height: 24,
  },
  tonIcon: {
    width: 24,
    height: 24,
  },



  bottomSheetContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  timelineIcon: {
    width: "85%",
    aspectRatio: 1.15,
    marginBottom: 8,
    alignSelf: "center",
  },
  orangePng: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    resizeMode: "contain",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
  },
  tabButton: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#6B3FD8",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: "#6B3FD8",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "SF-Pro-Semibold",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  tabIcon: {
    width: 18,
    height: 18,
    marginLeft: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#6B3FD8",
    borderRadius: 100,
    width: "100%",
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
    ...(Platform.OS === "web" ? { outline: "none" } : {}),
  
    // 🔹 Добавим компенсацию за paddingRight, чтобы центр остался геометрическим
    paddingLeft: 38,
    paddingRight: 40, // под иконку
  },
  
  inputIcon: {
    width: 26,
    height: 26,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  placeButton: {
    width: "85%",
    aspectRatio: 4.8,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 25,
  },
  
});

export default Case;


const AnimatedDropBubble = ({ icon, animate }: { icon: string, animate: boolean }) => {
  const scale = React.useRef(new Animated.Value(animate ? 0 : 1)).current;
  const opacity = React.useRef(new Animated.Value(animate ? 0 : 1)).current;

  React.useEffect(() => {
    if (!animate) return;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 7,
        stiffness: 140,
        mass: 0.5,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animate]);

  return (
    <View
      style={{
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: "#1F0248",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        overflow: "hidden", // важно
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          opacity,
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri: icon }}
          style={{ width: 34, height: 34 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

