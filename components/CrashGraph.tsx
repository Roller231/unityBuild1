import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { CrashEngine } from "../components/CrashEngine";
import Canvas from "react-native-canvas";
import LottieView from "lottie-react-native";
import lottieWeb from "lottie-web"; // 👈 для Web
import catFly from "../components/icons/catFly.json";

interface CrashGraphProps {
  engine: CrashEngine | null;
  active?: boolean;
}

export default function CrashGraph({ engine, active = true }: CrashGraphProps) {
  const canvasRef = useRef<any>(null);
  const lottieRef = useRef<LottieView>(null);
  const webLottieContainer = useRef<HTMLDivElement | null>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const graphWidth = screenWidth * 0.95;
  const graphHeight =
    Platform.OS === "web" ? screenHeight * 0.45 : screenHeight * 0.5;

  const webCanvasStyle: React.CSSProperties = {
    borderRadius: 12,
    backgroundColor: "transparent",
  };

  // === Отрисовка графика ===
  const renderFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    offsetY: number
  ) => {
    if (!engine) return;

    engine.onResize(width, height);
    engine.tick();

    ctx.clearRect(0, 0, width, height);

    const startY = engine.plotHeight;
    const mid = engine.getElapsedPosition(engine.elapsedTime * 0.5);
    const end = engine.getElapsedPosition(engine.elapsedTime);

    ctx.beginPath();
    ctx.strokeStyle = "#A57BFF";
    ctx.lineWidth = 3;
    ctx.moveTo(0, startY);
    ctx.quadraticCurveTo(mid.x, mid.y + offsetY, end.x, end.y);
    ctx.stroke();

    // === Текст множителя (приподнят вверх) ===
    const text = `x${engine.multiplier.toFixed(2)}`;
    const fontSize = 64;
    ctx.font = `1000 ${fontSize}px "SF Pro", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textGradient = ctx.createLinearGradient(
      0,
      height / 2 - fontSize,
      0,
      height / 2 + fontSize
    );
    textGradient.addColorStop(0, "#FFAF4D");
    textGradient.addColorStop(0.35, "#FFF7A7");
    textGradient.addColorStop(0.75, "#FFAF4D");

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#070908";
    // ⬆️ Сдвигаем текст чуть выше центра
    const textY = height / 2 - 60;
    ctx.strokeText(text, width / 2, textY);
    ctx.fillStyle = textGradient;
    ctx.fillText(text, width / 2, textY);
  };

  // ======= Web (Canvas) =======
  useEffect(() => {
    if (Platform.OS !== "web" || !active) return;

    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = graphWidth * scale;
    canvas.height = graphHeight * scale;
    canvas.style.width = `${graphWidth}px`;
    canvas.style.height = `${graphHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;

    let animationId: number;
    const draw = () => {
      renderFrame(ctx, graphWidth, graphHeight, 25);
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      ctx.clearRect(0, 0, graphWidth, graphHeight);
    };
  }, [engine, active]);

  // ======= Web (Lottie) =======
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!webLottieContainer.current) return;

    const anim = lottieWeb.loadAnimation({
      container: webLottieContainer.current,
      renderer: "svg",
      loop: true,
      autoplay: active,
      animationData: catFly,
    });

    if (!active) anim.pause();
    return () => anim.destroy();
  }, [active]);

  // ======= Mobile Canvas =======
  const handleCanvas = (canvas: any) => {
    if (!canvas || Platform.OS === "web" || !active) return;
    const ctx = canvas.getContext("2d");
    let animationId: number;

    const draw = () => {
      renderFrame(ctx, graphWidth, graphHeight, 15);
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animationId);
  };

  // ======= Mobile Lottie =======
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!lottieRef.current) return;
    if (active) lottieRef.current.play();
    else lottieRef.current.pause();
  }, [active]);

  return (
    <View style={styles.container}>
      {/* === Кот под множителем === */}
      {active &&
        (Platform.OS === "web" ? (
          <div ref={webLottieContainer} style={styles.catLottieWeb as any} />
        ) : (
          <LottieView
            ref={lottieRef}
            source={catFly}
            autoPlay
            loop
            style={styles.catLottieMobile}
          />
        ))}

      {/* === Сам график === */}
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
    backgroundColor: "transparent",
  },
  catLottieWeb: {
    position: "absolute",
    top: "38%", // 🔼 Было 58%, теперь выше
    left: "40%",
    transform: "translate(-100px, 0)",
    width: 300,
    height: 300,
    opacity: 0.9,
    zIndex: 10,
    pointerEvents: "none",
  },
  catLottieMobile: {
    position: "absolute",
    top: "48%", // 🔼 Было 58%
    left: "50%",
    transform: [{ translateX: -100 }],
    width: 200,
    height: 200,
    opacity: 0.9,
    zIndex: 10,
  },
});
