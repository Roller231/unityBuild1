import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import TonIcon from "../icons/ton.svg";

export interface DropItem {
  id: string;
  name: string;
  icon: any;
  rarity: "common" | "rare" | "epic" | "legendary";
  price: number;
}

interface GiftCardProps {
  price?: string;
  gradientColors?: string[];
  cardWidth?: number;
  drops?: DropItem[];
  mainImage?: any;
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
  mainImage = require("../icons/Venus.svg"), // 🔹 дефолтная картинка
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

      {/* 🖼️ Основная картинка подарка */}
      <Image
        source={mainImage}
        style={styles.mainImage}
        resizeMode="contain"
      />

      {/* 🔹 Основной фон карточки (градиент) */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  mainImage: {
    position: "absolute",
    top: "25%", // ⬇️ опустили картинку ниже
    left: "10%",
    width: "80%",
    height: "55%", // чуть меньше, чтобы гармонично смотрелась ниже
    zIndex: 5,
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
});

export default GiftCard;
