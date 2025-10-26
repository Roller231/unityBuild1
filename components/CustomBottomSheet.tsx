import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  BackHandler,
  Platform,
  Easing,
  Modal,
  ScrollView,
} from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  heightRatio?: number;
  children?: React.ReactNode;
  blockBackAndroid?: boolean;
  maxWidth?: number;
  scrollEnabled?: boolean; // ✅ добавлено
}



const CustomBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  heightRatio = 0.8,
  children,
  blockBackAndroid = true,
  maxWidth = 470,
  scrollEnabled = true, // ✅ включаем по умолчанию
}) => {
  const sheetHeight = Math.round(
    SCREEN_HEIGHT * Math.min(Math.max(heightRatio, 0.1), 0.95)
  );
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // --- PanResponder (drag вниз)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100 || g.vy > 1) closeSheet();
        else
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
      },
    })
  ).current;


  
  const openSheet = () => {
    translateY.setValue(sheetHeight);
    Animated.sequence([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 6,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 180,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  // ⬆️ Открытие / закрытие
  useEffect(() => {
    if (visible) openSheet();
  }, [visible]);

  // 🔙 блок кнопки "Назад" на Android
  useEffect(() => {
    if (!blockBackAndroid || !visible || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeSheet();
      return true;
    });
    return () => sub.remove();
  }, [visible, blockBackAndroid]);

  const containerStyle = useMemo(
    () => [
      styles.sheet,
      {
        height: sheetHeight,
        transform: [{ translateY }],
      },
    ],
    [sheetHeight, translateY]
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.centerWrapper}>
        <View
          style={[
            styles.innerWrapper,
            { maxWidth, width: SCREEN_WIDTH < maxWidth ? "100%" : maxWidth },
          ]}
        >
          {/* затемнение */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
            <Animated.View
              pointerEvents="none"
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            />
          </Pressable>

          {/* сам шит */}
          <Animated.View style={containerStyle}>
            <Animated.View {...panResponder.panHandlers} style={styles.handleWrap}>
              <View style={styles.handle} />
            </Animated.View>

            {/* ✅ Контент со скроллом */}
            {scrollEnabled ? (
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.content}>{children}</View>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centerWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  innerWrapper: {
    alignSelf: "center",
    position: "relative",
    height: "100%",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#352851",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    zIndex: 100,
    elevation: 100,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 14,
    width: "100%",
  },
  handle: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#070908",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

export default CustomBottomSheet;
