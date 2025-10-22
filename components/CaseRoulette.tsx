import React, { useRef, useEffect } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useTelegramPlatform } from "@/hooks/useTelegramPlatform";
import TonIcon from "../components/icons/ton.svg";

const { width: screenWidth } = Dimensions.get("window");

interface DropItem {
  id: string;
  icon: any;
  price: number;
}

interface CaseRouletteProps {
  items: DropItem[];
  resultId?: string | null;
  active?: boolean;
  onFinish?: (item: DropItem) => void;
}

const CaseRoulette: React.FC<CaseRouletteProps> = ({
  items,
  resultId,
  active,
  onFinish,
}) => {
  const platform = useTelegramPlatform();
  const isDesktop = platform === "tdesktop" || platform === "macos";
  const fixedWidth = isDesktop ? 470 : screenWidth;

  // 📐 Размер карточек и параметры
  const ITEM_WIDTH = isDesktop ? 120 : 100;
  const ITEM_MARGIN = isDesktop ? 12 : 8;
  const TOTAL_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2;

  const scrollRef = useRef<ScrollView>(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || !resultId) return;

    const targetIndex = items.findIndex((it) => it.id === resultId);
    if (targetIndex === -1) return;

    anim.setValue(0); // ✅ сброс перед каждым запуском

    // 🎡 Количество оборотов рулетки
    const loops = isDesktop ? 8 : 6;
    const totalItems = items.length * loops + targetIndex;
    const targetOffset =
      totalItems * TOTAL_WIDTH - fixedWidth / 2 + TOTAL_WIDTH / 2;

    Animated.timing(anim, {
      toValue: targetOffset,
      duration: isDesktop ? 8000 : 6500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      onFinish?.(items[targetIndex]);
    });
  }, [active, resultId]);

  useEffect(() => {
    const listener = anim.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ x: value, animated: false });
    });
    return () => anim.removeListener(listener);
  }, []);

  // 🔁 Повторяем элементы для плавного эффекта
  const repeated = Array.from({ length: 10 }).flatMap(() => items);

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: fixedWidth,
          overflow: "hidden", // ✅ обрезаем края рулетки
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: fixedWidth / 2 - TOTAL_WIDTH / 2,
          alignItems: "center",
        }}
      >
        {repeated.map((item, i) => (
          <View
            key={`${item.id}-${i}`}
            style={[
              styles.card,
              {
                width: ITEM_WIDTH,
                marginHorizontal: ITEM_MARGIN,
              },
            ]}
          >
            <Image source={item.icon} style={styles.icon} resizeMode="contain" />
            <View style={styles.priceTag}>
              <Image source={TonIcon} style={styles.ton} />
              <Text style={styles.priceText}>{item.price.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 🎯 Центровой индикатор */}
      <View
        style={[
          styles.indicator,
          { height: isDesktop ? 140 : 120, left: fixedWidth / 2 - 1.5 },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  card: {
    height: 120,
    backgroundColor: "#1F0248",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#9028FF",
  },
  icon: { width: 50, height: 50 },
  priceTag: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ton: { width: 12, height: 12, tintColor: "#00AEEF" },
  priceText: { color: "#fff", fontWeight: "700", fontSize: 13, marginLeft: 4 },
  indicator: {
    position: "absolute",
    width: 3,
    backgroundColor: "#FF008A",
    borderRadius: 3,
  },
});

export default CaseRoulette;
