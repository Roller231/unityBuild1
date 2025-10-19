import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

interface BottomSheetMenuProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  height?: string | number; // 👈 новый параметр
}

const BottomSheetMenu: React.FC<BottomSheetMenuProps> = ({
  title,
  children,
  isOpen,
  onClose,
  height = "60%", // 👈 дефолтный размер
}) => {
  const sheetRef = useRef<BottomSheet>(null);

  // 👇 динамически создаём snapPoint
  const snapPoints = useMemo(() => [height], [height]);

  // 👇 если панель открывается, выставляем index = 0, иначе закрыта (-1)
  const currentIndex = isOpen ? 0 : -1;

  // 👇 автоматическое открытие при изменении isOpen
  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={currentIndex}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      animateOnMount
      handleComponent={() => (
        <View style={styles.customHandleWrapper}>
          <View style={styles.customHandleBar} />
        </View>
      )}
      // === 🔹 Затемнение фона ===
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          opacity={0.6}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close" // закрытие по тапу на фон
        />
      )}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.innerContent}>{children}</View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#352851",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  handle: {
    backgroundColor: "#6B3FD8",
    width: 60,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flex: 1,
  },
    // 🔸 Новый handle
    customHandleWrapper: {
      alignItems: "center",
      paddingVertical: 10,
    },
    customHandleBar: {
      width: 70,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#070908", // ← вот этот цвет
    },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 8,
  },
  innerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});

export default BottomSheetMenu;
