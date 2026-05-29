import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import de from "./locales/de";
import fr from "./locales/fr";
import pl from "./locales/pl";
import es from "./locales/es";
import uk from "./locales/uk";
import lv from "./locales/lv";
import cs from "./locales/cs";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, de, fr, pl, es, uk, lv, cs },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
