import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import Svg, { Text as SvgText } from "react-native-svg";
import GiftCard, { DropItem } from "../components/Buttons/GiftCard";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import OrangePng from "../components/icons/OrangePng.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onLanguageChange } from "@/components/languageEvents";

const { width: screenWidth } = Dimensions.get("window");
const FIXED_WIN_INDEX = 50;
const ITEM_GAP = 10;
const SIDE_PADDING = 16;
const GRID_COLUMNS = 3;

// 🌍 Переводы
const translations = {
  ru: {
    caseOpening: "ОТКРЫТИЕ КЕЙСА",
    open: "ОТКРЫТЬ",
    opening: "ОТКРЫВАЕТСЯ...",
    whatsInside: "Что внутри?",
  },
  en: {
    caseOpening: "CASE OPENING",
    open: "OPEN",
    opening: "OPENING...",
    whatsInside: "What's inside?",
  },
} as const;

type Lang = keyof typeof translations;
type TranslationKey = keyof typeof translations["en"];

const useTranslation = (lang: Lang) => (key: TranslationKey) =>
  translations[lang][key];

interface CaseRouletteProps {
  items: DropItem[];
  active?: boolean;
  resultId?: string | null;
  onFinish?: (item: DropItem) => void;
  onSpin?: () => void;
  speed?: number;
  title?: string;
  spinning?: boolean;
  disableClose?: boolean;
}

export default function CaseRoulette({
  items,
  active,
  resultId,
  onFinish,
  onSpin,
  speed = 1,
  title,
  spinning = false,
}: CaseRouletteProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayItems, setDisplayItems] = useState<DropItem[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetOffset, setTargetOffset] = useState(0);
  const [winningItem, setWinningItem] = useState<DropItem | null>(null);
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const t = useTranslation(language);

  // === Читаем язык из AsyncStorage и подписываемся на изменения ===
  useEffect(() => {
    const loadLanguage = async () => {
      const saved = await AsyncStorage.getItem("app_language");
      if (saved === "ru" || saved === "en") setLanguage(saved);
    };
    loadLanguage();

    const unsub = onLanguageChange((newLang) => {
      if (newLang === "ru" || newLang === "en") setLanguage(newLang);
    });
    return unsub;
  }, []);

  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";

  const maxWidth = isDesktop ? 470 : screenWidth;
  const innerWidth = maxWidth - SIDE_PADDING * 2;

  const ITEM_WIDTH =
    (innerWidth - ITEM_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const TOTAL_WIDTH = ITEM_WIDTH + ITEM_GAP;
  const CENTER_OFFSET = innerWidth / 2 - TOTAL_WIDTH / 2;

  const getRandomItem = (arr: DropItem[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  const generateRandomItems = (arr: DropItem[], count: number) =>
    Array.from({ length: count }, () => getRandomItem(arr));

  // --- Начальная генерация ---
  useEffect(() => {
    if (items.length > 0) setDisplayItems(generateRandomItems(items, 20));
    anim.setValue(0);
  }, [items]);

  // --- Подготовка к кручению ---
  useEffect(() => {
    if (!active || !resultId || isSpinning || items.length === 0) return;
    const winner = items.find((i) => i.id === resultId);
    if (!winner) return;

    setIsSpinning(true);
    anim.stopAnimation();
    anim.setValue(0);

    const itemsBefore = generateRandomItems(items, FIXED_WIN_INDEX);
    const itemsAfter = generateRandomItems(items, 60);
    const newDisplay = [...itemsBefore, winner, ...itemsAfter];
    if (newDisplay.length > 104) newDisplay[104] = winner;

    const offset = FIXED_WIN_INDEX * TOTAL_WIDTH - CENTER_OFFSET;
    const maxScrollableOffset = newDisplay.length * TOTAL_WIDTH - innerWidth;
    const safeOffset = Math.min(offset, maxScrollableOffset);

    setDisplayItems(newDisplay);
    setTargetOffset(safeOffset);
    setWinningItem(winner);
  }, [active, resultId, items, isSpinning]);

  // --- Анимация вращения ---
  useLayoutEffect(() => {
    if (!isSpinning || !winningItem || targetOffset === 0) return;

    Animated.timing(anim, {
      toValue: targetOffset,
      duration: 5000 / speed,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      onFinish?.(winningItem);
      setIsSpinning(false);
      setWinningItem(null);
      setTargetOffset(0);
    });

    return () => anim.stopAnimation();
  }, [targetOffset, winningItem, isSpinning]);

  const translateX = Animated.multiply(anim, -1);

  return (
    <View style={[styles.container, { width: maxWidth }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{
          paddingBottom: 80,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Заголовок */}
        <Text style={styles.titleText}>{title || t("caseOpening")}</Text>

        {/* 🎡 Рулетка */}
        <View
          style={[
            styles.rouletteContainer,
            { paddingHorizontal: SIDE_PADDING, width: "100%" },
          ]}
        >
          <View style={{ overflow: "hidden", width: "100%" }}>
            <Animated.View
              style={[styles.row, { transform: [{ translateX }] }]}
            >
              {displayItems.map((item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={[styles.itemWrapper, { marginRight: ITEM_GAP }]}
                >
                  <GiftCard
                    cardWidth={ITEM_WIDTH}
                    mainImage={item.icon}
                    price={item.price.toFixed(2)}
                    gradientColors={["#1F0248", "#1F0248", "#1F0248"]}
                    drops={[item]}
                    onPress={() => {}}
                  />
                </View>
              ))}
            </Animated.View>
          </View>
          <View style={styles.indicator} />
        </View>

        {/* === Кнопка SPIN === */}
        {/* === Кнопка SPIN === */}
<View style={styles.bottomButtonContainer}>
  <TouchableOpacity
    activeOpacity={0.9}
    style={[styles.betButton, { width: maxWidth * 1.4 }]} // ✅ как в Profile
    onPress={onSpin}
    disabled={spinning}
  >
    {/* 🔸 Оранжевый фон */}
    <Image source={OrangePng} style={styles.orangePng} resizeMode="contain" />

    {/* 🔸 SVG-текст, центрированный и масштабируемый */}
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
        fontSize="20"
        fontFamily="SF-Pro-Heavy"
        fontWeight="900"
        x="50%"
        y="45%"
        textAnchor="middle"
        letterSpacing={2}
      >
        {spinning ? t("opening") : t("open")}
      </SvgText>
      <SvgText
        fill="#FFF"
        fontSize="20"
        fontFamily="SF-Pro-Heavy"
        fontWeight="900"
        x="50%"
        y="45%"
        textAnchor="middle"
        letterSpacing={2}
      >
        {spinning ? t("opening") : t("open")}
      </SvgText>
    </Svg>
  </TouchableOpacity>
</View>


        {/* What's inside */}
        <Text style={styles.whatsInsideText}>{t("whatsInside")}</Text>
        <View
          style={[
            styles.gridContainer,
            { paddingHorizontal: SIDE_PADDING, marginTop: 10 },
          ]}
        >
          {items.map((drop, idx) => (
            <View
              key={drop.id || idx}
              style={{
                width: ITEM_WIDTH,
                marginRight: (idx + 1) % GRID_COLUMNS === 0 ? 0 : ITEM_GAP,
                marginBottom: ITEM_GAP,
              }}
            >
              <GiftCard
                cardWidth={ITEM_WIDTH}
                mainImage={drop.icon}
                price={drop.price.toFixed(2)}
                gradientColors={["#1F0248", "#1F0248", "#1F0248"]}
                drops={[drop]}
                onPress={() => {}}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  orangePng: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    resizeMode: "contain",
  },
  
  betButton: {
    width: "85%",
    aspectRatio: 4.8, // 🔥 как в Profile — сохраняет пропорции
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 25,
  },
  
  
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flexGrow: 0,
    width: "100%",
  },
  titleText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 10,
    fontFamily: "SF-Pro-Heavy",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  rouletteContainer: {
    height: 190,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemWrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1F0248",
  },
  indicator: {
    position: "absolute",
    width: 3,
    height: 140,
    backgroundColor: "#9028FF",
    borderRadius: 2,
  },
  whatsInsideText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    textTransform: "uppercase",
    fontFamily: "SF-Pro-Semibold",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  bottomButtonContainer: {},

  
  
});
