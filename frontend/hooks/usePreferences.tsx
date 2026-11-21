import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AppLanguage = "en" | "sq";
export type AppTheme = "light" | "dark";

const memory = new Map<string, string>();

const dictionaries = {
  en: {
    explore: "Explore", live: "Live Kosovo overview", reports: "City reports", search: "Search reports", all: "All", map: "Map", list: "List", activeIssues: "active issues", noMatches: "No matching reports", tryFilters: "Try another city, category, or filter.", home: "Home", community: "Community", profile: "Profile", report: "Report", settings: "Settings", language: "Language", theme: "Dark mode", notificationCenter: "Notification center", logout: "Log out", kosovo: "Kosovo", welcomeBack: "Welcome back", signIn: "Sign in", email: "Email address", password: "Password", register: "Create account", goodMorning: "Good morning", makeCityBetter: "Make your city better", reportProblem: "Report a Problem", myReports: "My Reports", resolved: "Resolved", active: "Active", recentReports: "Recent reports", seeAll: "See all", quickActions: "Quick actions", achievements: "Achievements", notifications: "Notifications", submitted: "Submitted", inProgress: "In progress", pending: "Pending", description: "Description", statusTimeline: "Status timeline", comments: "Comments", support: "Support", share: "Share", submit: "Submit report", continue: "Continue", confirmLocation: "Confirm location", useLocation: "Use current location", chooseCategory: "Choose a category", addPhoto: "Add a photograph", review: "Review & submit", title: "Title", location: "Location", noReports: "No reports yet", firstReport: "Your first report can help improve the neighborhood.", anyPriority: "Any priority",
  },
  sq: {
    explore: "Eksploro", live: "Pamja live e Kosovës", reports: "Raportet e qytetit", search: "Kërko raporte", all: "Të gjitha", map: "Harta", list: "Lista", activeIssues: "çështje aktive", noMatches: "Nuk u gjetën raporte", tryFilters: "Provoni një kategori ose filtër tjetër.", home: "Kreu", community: "Komuniteti", profile: "Profili", report: "Raporto", settings: "Cilësimet", language: "Gjuha", theme: "Modaliteti i errët", notificationCenter: "Qendra e njoftimeve", logout: "Dil", kosovo: "Kosovë", welcomeBack: "Mirë se erdhët", signIn: "Hyr", email: "Adresa e emailit", password: "Fjalëkalimi", register: "Krijo llogari", goodMorning: "Mirëmëngjes", makeCityBetter: "Bëje qytetin më të mirë", reportProblem: "Raporto një problem", myReports: "Raportet e mia", resolved: "Zgjidhur", active: "Aktiv", recentReports: "Raportet e fundit", seeAll: "Shiko të gjitha", quickActions: "Veprime të shpejta", achievements: "Arritjet", notifications: "Njoftimet", submitted: "Dërguar", inProgress: "Në punë e sipër", pending: "Në pritje", description: "Përshkrimi", statusTimeline: "Harta e statusit", comments: "Komentet", support: "Përkrahu", share: "Ndaj", submit: "Dërgo raportin", continue: "Vazhdo", confirmLocation: "Konfirmo vendndodhjen", useLocation: "Përdor vendndodhjen aktuale", chooseCategory: "Zgjidh kategorinë", addPhoto: "Shto një fotografi", review: "Rishiko dhe dërgo", title: "Titulli", location: "Vendndodhja", noReports: "Nuk ka ende raporte", firstReport: "Raporti yt i parë mund të përmirësojë lagjen.", anyPriority: "Çdo prioritet",
  },
} as const;

const light = { background: "#F5F7FB", card: "#FFFFFF", accent: "#3478F6", navy: "#101D35", text: "#18243A", muted: "#8994A7", danger: "#EF5350", success: "#20B982", warning: "#F5A623", lightBlue: "#EAF1FF", border: "#E7ECF5" };
const dark = { background: "#0B1220", card: "#151E2E", accent: "#5B91F7", navy: "#F5F7FB", text: "#F5F7FB", muted: "#9AA8BC", danger: "#FF7471", success: "#35C897", warning: "#F5B84B", lightBlue: "#172A49", border: "#26344A" };

async function readPreference(key: string) {
  if (Platform.OS === "web") return memory.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function savePreference(key: string, value: string) {
  if (Platform.OS === "web") { memory.set(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

type PreferencesValue = {
  language: AppLanguage;
  theme: AppTheme;
  colors: typeof light;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  t: (key: keyof typeof dictionaries.en) => string;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    readPreference("fixmystreet.language").then(value => { if (value === "sq") setLanguageState("sq"); else setLanguageState("en"); });
    readPreference("fixmystreet.theme").then(value => setThemeState(value === "dark" ? "dark" : "light"));
  }, []);

  const setLanguage = (value: AppLanguage) => { setLanguageState(value); void savePreference("fixmystreet.language", value); };
  const setTheme = (value: AppTheme) => { setThemeState(value); void savePreference("fixmystreet.theme", value); };
  const value = useMemo(() => ({
    language,
    theme,
    colors: theme === "dark" ? dark : light,
    setLanguage,
    setTheme,
    t: (key: keyof typeof dictionaries.en) => dictionaries[language][key] as string,
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider");
  return value;
}
