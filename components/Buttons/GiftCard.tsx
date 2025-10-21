import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import TonIcon from "../icons/ton.svg";

// 🎁 Описание одного возможного дропа (будет приходить с бэка)
export interface DropItem {
  id: string;
  name: string;
  icon: any; // require() или { uri: string }
  rarity: "common" | "rare" | "epic" | "legendary";
  price: number; // 💰 цена предмета
}

interface GiftCardProps {
  price?: string;
  gradientColors?: string[];
  cardWidth?: number;
  drops?: DropItem[]; // 🎁 список возможных выпадений
  onPress?: (giftData: {
    price: string;
    gradientColors: string[];
    drops?: DropItem[];
  }) => void;
}

const GiftCard = ({
  price = "0.5",
  gradientColors = ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.25)", "#FFFFFF"],
  cardWidth = 160,
  drops = [],
  onPress,
}: GiftCardProps) => {
  return (
    <Pressable
      onPress={() => onPress?.({ price, gradientColors, drops })}
      style={[styles.cardWrapper, { width: cardWidth, height: cardWidth }]}
    >
      {/* 💎 Плашка стоимости */}
      <View style={styles.priceTag}>
        <BlurView intensity={40} tint="light" style={styles.priceInner}>
          <View style={styles.iconCircle}>
            <Image source={TonIcon} style={styles.icon} resizeMode="contain" />
          </View>
          <Text style={styles.priceText}>{price}</Text>
        </BlurView>
      </View>

      {/* 🔹 Основной фон карточки */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />

      {/* 🎁 превью 3 случайных предметов */}
      {drops.length > 0 && (
        <View style={styles.previewRow}>
          {drops.slice(0, 3).map((item) => (
            <Image
              key={item.id}
              source={item.icon}
              style={[
                styles.previewIcon,
                item.rarity === "rare" && { tintColor: "#4BC0FF" },
                item.rarity === "epic" && { tintColor: "#B24CFF" },
                item.rarity === "legendary" && { tintColor: "#FFD700" },
              ]}
              resizeMode="contain"
            />
          ))}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "80%",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  priceTag: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    borderRadius: 100,
    overflow: "hidden",
  },
  priceInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0098EA",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: "100%",
    height: "100%",
  },
  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
  previewRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  previewIcon: {
    width: 26,
    height: 26,
    opacity: 0.9,
  },
});

export default GiftCard;
