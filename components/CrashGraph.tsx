import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { CrashEngine } from "../components/CrashEngine";
import Canvas from "react-native-canvas";

interface CrashGraphProps {
  engine: CrashEngine | null;
}

export default function CrashGraph({ engine }: CrashGraphProps) {
  const canvasRef = useRef<any>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // ✅ Telegram WebView — адаптивно под ширину экрана, без фиксированных пропорций
  const graphWidth = screenWidth * 0.95;
  const graphHeight =
    Platform.OS === "web" ? screenHeight * 0.45 : screenHeight * 0.5;

  const webCanvasStyle: React.CSSProperties = {
    borderRadius: 12,
    backgroundColor: "transparent",
  };

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  useEffect(() => {
    if (Platform.OS === "web") {
      const canvas = canvasRef.current as HTMLCanvasElement;
      if (!canvas) return;

      // ✅ Telegram WebView адаптация под размер контейнера
      canvas.width = graphWidth * window.devicePixelRatio;
      canvas.height = graphHeight * window.devicePixelRatio;
      canvas.style.width = `${graphWidth}px`;
      canvas.style.height = `${graphHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.imageSmoothingEnabled = true;

      const draw = (time: number) => {
        if (!engine) return;
        ctx.clearRect(0, 0, graphWidth, graphHeight);

        engine.onResize(graphWidth, graphHeight);
        engine.tick();

        const t = easeOutCubic(Math.min(engine.elapsedTime / 4000, 1));
        const startY = engine.plotHeight;
        const mid = engine.getElapsedPosition(engine.elapsedTime * 0.5);
        const end = engine.getElapsedPosition(engine.elapsedTime);
        const offsetY = (1 - t) * 25;

        // 🚫 Убираем любую “заливку под кривой”
        // === Только линия траектории ===
        ctx.beginPath();
        ctx.strokeStyle = "#A57BFF";
        ctx.lineWidth = 3;
        ctx.moveTo(0, startY);
        ctx.quadraticCurveTo(mid.x, mid.y + offsetY, end.x, end.y);
        ctx.stroke();

        // === Градиентный текст множителя ===
        const text = `x${engine.multiplier.toFixed(2)}`;
        const fontSize = 64;
        ctx.font = `1000 ${fontSize}px "SF Pro", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textGradient = ctx.createLinearGradient(
          0,
          graphHeight / 2 - fontSize,
          0,
          graphHeight / 2 + fontSize
        );
        textGradient.addColorStop(0, "#FFAF4D");
        textGradient.addColorStop(0.35, "#FFF7A7");
        textGradient.addColorStop(0.75, "#FFAF4D");

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "#070908";
        ctx.strokeText(text, graphWidth / 2, graphHeight / 2);

        ctx.fillStyle = textGradient;
        ctx.fillText(text, graphWidth / 2, graphHeight / 2);

        requestAnimationFrame(draw);
      };

      requestAnimationFrame(draw);
    }
  }, [engine, graphWidth, graphHeight]);

  // ======= Мобильная версия =======
  const handleCanvas = (canvas: any) => {
    if (!canvas || Platform.OS === "web") return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      if (!engine) return;
      engine.onResize(graphWidth, graphHeight);
      engine.tick();

      ctx.clearRect(0, 0, graphWidth, graphHeight);

      const startY = engine.plotHeight;
      const mid = engine.getElapsedPosition(engine.elapsedTime * 0.5);
      const end = engine.getElapsedPosition(engine.elapsedTime);
      const offsetY = 15;

      // ❌ Без подложки — только линия
      ctx.beginPath();
      ctx.strokeStyle = "#A57BFF";
      ctx.lineWidth = 3;
      ctx.moveTo(0, startY);
      ctx.quadraticCurveTo(mid.x, mid.y + offsetY, end.x, end.y);
      ctx.stroke();

      const text = `x${engine.multiplier.toFixed(2)}`;
      const fontSize = 60;
      ctx.font = `1000 ${fontSize}px "SF Pro"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textGradient = ctx.createLinearGradient(
        0,
        graphHeight / 2 - fontSize,
        0,
        graphHeight / 2 + fontSize
      );
      textGradient.addColorStop(0, "#FFAF4D");
      textGradient.addColorStop(0.35, "#FFF7A7");
      textGradient.addColorStop(0.75, "#FFAF4D");

      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#070908";
      ctx.strokeText(text, graphWidth / 2, graphHeight / 2);

      ctx.fillStyle = textGradient;
      ctx.fillText(text, graphWidth / 2, graphHeight / 2);

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <canvas
          ref={canvasRef}
          width={graphWidth}
          height={graphHeight}
          style={{
            ...webCanvasStyle,
            width: graphWidth,
            height: graphHeight,
          }}
        />
      ) : (
        <Canvas
          {...({ onCanvasReady: handleCanvas } as any)}
          style={[styles.canvas, { width: graphWidth, height: graphHeight }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  canvas: {
    borderRadius: 12,
    backgroundColor: "transparent", // ✅ полностью прозрачный
  },
});
