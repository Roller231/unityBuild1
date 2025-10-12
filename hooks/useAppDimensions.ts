import { useWindowDimensions } from "react-native";
import { useTelegramPlatform } from "./useTelegramPlatform";

export function useAppDimensions() {
  const { width, height } = useWindowDimensions();
  const platform = useTelegramPlatform();

  // ПК / веб / десктоп — фиксированная рамка
  const isDesktop =
    platform === "tdesktop" ||
    platform === "macos" ||
    platform === "webk" ||
    platform === "weba" ||
    platform === "web";

  const appWidth = isDesktop ? 470 : width;
  const appHeight = height;

  return { width: appWidth, height: appHeight };
}
