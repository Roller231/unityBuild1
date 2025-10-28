import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];


    //timers.push(setTimeout(() => router.replace("/crash"), 0));

    return () => timers.forEach(clearTimeout);
  }, [router]);

  return null;
}
