type Lang = "ru" | "en";
type Listener = (lang: Lang) => void;

const listeners = new Set<Listener>();

export const emitLanguageChange = (lang: Lang) => {
  listeners.forEach((cb) => cb(lang));
};

export const onLanguageChange = (callback: Listener): (() => void) => {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
};
