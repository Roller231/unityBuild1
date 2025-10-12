// utils/scale.ts
import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

// 📱 базовые размеры (например, iPhone 14 Pro)
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

// 🔹 масштабирование
export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
