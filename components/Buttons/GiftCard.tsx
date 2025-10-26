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
  gradientColors = ["#1F0248", "#1F0248", "#1F0248"],
  cardWidth = 160,
  drops = [],
  mainImage = require("../icons/Venus.svg"),
  onPress,
}: GiftCardProps) => {
  const isSolid =
    gradientColors.every((c) => c === gradientColors[0]) || !gradientColors;

  const priceLength = price.length;
  const fontSize = Math.max(12, Math.min(16, cardWidth * 0.09));
  const paddingHorizontal = Math.max(8, Math.min(12, cardWidth * 0.08));
  const paddingVertical = Math.max(4, Math.min(6, cardWidth * 0.04));
  const iconSize = cardWidth * 0.12;

  return (
    <Pressable
      onPress={() => onPress?.({ price, gradientColors, drops })}
      style={[
        styles.cardWrapper,
        { width: cardWidth, height: cardWidth },
        isSolid && { backgroundColor: gradientColors[0] },
      ]}
    >
      {/* 💎 Плашка стоимости */}
      <View style={[styles.priceTag]}>
        <BlurView intensity={40} tint="light" style={[
          styles.priceInner,
          {
            paddingHorizontal,
            paddingVertical,
          },
        ]}>
          <View style={[
            styles.iconCircle,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconSize / 2,
            },
          ]}>
            <Image source={TonIcon} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
          </View>
          <Text style={[styles.priceText, { fontSize, marginLeft: 6 }]}>
            {price}
          </Text>
        </BlurView>
      </View>

      {/* 🖼️ Основная картинка */}
      <Image
        source={mainImage}
        style={styles.mainImage}
        resizeMode="contain"
      />

      {/* 🔹 Градиент фона */}
      {!isSolid && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1F0248",
    elevation: 5,
    shadowColor: "rgba(0, 0, 0, 0.6)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  mainImage: {
    position: "absolute",
    top: "25%",
    left: "10%",
    width: "80%",
    height: "55%",
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
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  iconCircle: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0098EA",
  },
  priceText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default GiftCard;
