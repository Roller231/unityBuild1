import { useEffect } from "react";
import { useRouter, useRootNavigationState } from "expo-router";

export default function Index() {
  const router = useRouter();
  const navState = useRootNavigationState();
  const isNavigatorReady = navState?.key != null;

  useEffect(() => {
    if (!isNavigatorReady) return;
    router.replace("/crash");
  }, [isNavigatorReady, router]);

  return null;
}
