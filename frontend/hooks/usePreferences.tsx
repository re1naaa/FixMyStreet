import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { colors as sharedColors } from "../constants/colors";

export type AppLanguage = "en" | "sq";
export type AppTheme = "light" | "dark";

const memory = new Map<string, string>();

const dictionaries = {
  en: {
    explore: "Explore",
    live: "Live Kosovo overview",
    reports: "Reports",
    search: "Search reports",
    all: "All",
    map: "Map",
    list: "List",
    activeIssues: "active issues",
    noMatches: "No matching reports",
    tryFilters: "Try another city, category, or filter.",
    home: "Home",
    community: "Community",
    profile: "Profile",
    report: "Report",
    settings: "Settings",
    language: "Language",
    theme: "Dark mode",
    notificationCenter: "Notification center",
    logout: "Log out",
    kosovo: "Kosovo",
    welcomeBack: "Welcome back",
    signIn: "Sign in",
    email: "Email address",
    password: "Password",
    register: "Create account",
    goodMorning: "Good morning",
    makeCityBetter: "Make your city better",
    reportProblem: "Report a Problem",
    myReports: "My Reports",
    resolved: "Resolved",
    active: "Active",
    recentReports: "Recent reports",
    seeAll: "See all",
    quickActions: "Quick actions",
    achievements: "Achievements",
    notifications: "Notifications",
    submitted: "Submitted",
    inProgress: "In progress",
    pending: "Pending",
    description: "Description",
    statusTimeline: "Status timeline",
    comments: "Comments",
    support: "Support",
    share: "Share",
    submit: "Submit report",
    continue: "Continue",
    confirmLocation: "Confirm location",
    useLocation: "Use current location",
    chooseCategory: "Choose a category",
    addPhoto: "Add a photograph",
    review: "Review & submit",
    title: "Title",
    location: "Location",
    noReports: "No reports yet",
    firstReport: "Your first report can help improve the neighborhood.",
    anyPriority: "Any priority",
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    communityImpact: "Community impact",
    thisMonth: "this month",
    neighborhood: "Your neighborhood",
    exploreCityMap: "Explore City Map",
    viewReports: "View reports",
    pothole: "Pothole",
    brokenLight: "Broken light",
    waterLeak: "Water leak",
    viewAll: "View all",
    exploreYourCity: "Explore Your City",
    loginSubtitle: "Sign in to report issues and track your city.",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    newAccount: "New to FixMyStreet?",
    existingAccount: "Already have an account?",
    fullName: "Full name",
    confirmPassword: "Confirm password",
    terms: "I agree to the Terms of Service and Privacy Policy.",
    together: "Together We Make a Difference",
    communityPulse: "Community pulse",
    mostSupported: "Most supported",
    achievementBadges: "Achievement badges",
    communityLeaderboard: "Community leaderboard",
    earned: "Earned",
    inProgressBadge: "In progress",
    noCommunityReports: "No community reports yet.",
    locationUnavailable: "Your location is unavailable or outside Kosovo.",
    strongerNeighborhoodsText:
      "Support real issues and celebrate progress across Kosovo.",
    retry: "Try again",
    points: "Points",
    badgesEarned: "badges earned",
    keepReporting: "Keep reporting and supporting your community.",
  },
  sq: {
    explore: "Eksploro",
    live: "Pamja live e Kosovës",
    reports: "Raporte",
    search: "Kërko raporte",
    all: "Të gjitha",
    map: "Harta",
    list: "Lista",
    activeIssues: "çështje aktive",
    noMatches: "Nuk u gjetën raporte",
    tryFilters: "Provoni një kategori ose filtër tjetër.",
    home: "Kreu",
    community: "Komuniteti",
    profile: "Profili",
    report: "Raporto",
    settings: "Cilësimet",
    language: "Gjuha",
    theme: "Modaliteti i errët",
    notificationCenter: "Qendra e njoftimeve",
    logout: "Dil",
    kosovo: "Kosovë",
    welcomeBack: "Mirë se erdhët",
    signIn: "Hyr",
    email: "Adresa e emailit",
    password: "Fjalëkalimi",
    register: "Krijo llogari",
    goodMorning: "Mirëmëngjes",
    makeCityBetter: "Bëje qytetin më të mirë",
    reportProblem: "Raporto një problem",
    myReports: "Raportet e mia",
    resolved: "Zgjidhur",
    active: "Aktiv",
    recentReports: "Raportet e fundit",
    seeAll: "Shiko të gjitha",
    quickActions: "Veprime të shpejta",
    achievements: "Arritjet",
    notifications: "Njoftimet",
    submitted: "Dërguar",
    inProgress: "Në punë e sipër",
    pending: "Në pritje",
    description: "Përshkrimi",
    statusTimeline: "Harta e statusit",
    comments: "Komentet",
    support: "Përkrahu",
    share: "Ndaj",
    submit: "Dërgo raportin",
    continue: "Vazhdo",
    confirmLocation: "Konfirmo vendndodhjen",
    useLocation: "Përdor vendndodhjen aktuale",
    chooseCategory: "Zgjidh kategorinë",
    addPhoto: "Shto një fotografi",
    review: "Rishiko dhe dërgo",
    title: "Titulli",
    location: "Vendndodhja",
    noReports: "Nuk ka ende raporte",
    firstReport: "Raporti yt i parë mund të përmirësojë lagjen.",
    anyPriority: "Çdo prioritet",
    critical: "Kritike",
    high: "Lartë",
    medium: "Mesatare",
    low: "Ulët",
    communityImpact: "Ndikimi në komunitet",
    thisMonth: "këtë muaj",
    neighborhood: "Lagja jote",
    exploreCityMap: "Eksploro hartën",
    viewReports: "Shiko raportet",
    pothole: "Gropë",
    brokenLight: "Dritë e prishur",
    waterLeak: "Rrjedhje uji",
    viewAll: "Shiko të gjitha",
    exploreYourCity: "Eksploro qytetin",
    loginSubtitle: "Hyni për të raportuar probleme dhe për të ndjekur qytetin tuaj.",
    rememberMe: "Më kujto",
    forgotPassword: "Harrove fjalëkalimin?",
    newAccount: "Të ri në FixMyStreet?",
    existingAccount: "Keni tashmë një llogari?",
    fullName: "Emri i plotë",
    confirmPassword: "Konfirmo fjalëkalimin",
    terms: "Jam dakord me Kushtet e Shërbimit dhe Politikat e Privatësisë.",
    together: "Së bashku e bëjmë ndryshimin",
    communityPulse: "Pulsi i komunitetit",
    mostSupported: "Më të përkrahuarat",
    achievementBadges: "Distinktivat",
    communityLeaderboard: "Tabela e komunitetit",
    earned: "Fituar",
    inProgressBadge: "Në përparim",
    noCommunityReports: "Nuk ka ende raporte komuniteti.",
    locationUnavailable: "Vendndodhja juaj nuk është e disponueshme ose është jashtë Kosovës.",
    strongerNeighborhoodsText:
      "Përkrahu problemet reale dhe festo përparimin në tërë Kosovën.",
    retry: "Provo përsëri",
    points: "Pikë",
    badgesEarned: "distinktiva të fituara",
    keepReporting: "Vazhdo të raportosh dhe të përkrahësh komunitetin.",
  },
} as const;

const light = {
  background: "#F3F6FC",
  card: "#FFFFFF",
  elevated: "#FFFFFF",
  accent: "#397BFF",
  navy: "#101B32",
  text: "#101B32",
  muted: "#6F7C93",
  danger: "#F05B65",
  success: "#20B982",
  warning: "#FFAA45",
  lightBlue: "#E8F0FF",
  border: "#DFE7F4",
  error: "#F05B65",
};
const dark = {
  background: "#0B1220",
  card: "#17243B",
  elevated: "#1D2D49",
  accent: "#4D8DFF",
  navy: "#F4F7FF",
  text: "#F4F7FF",
  muted: "#A5B2C8",
  danger: "#FF6574",
  success: "#28C58A",
  warning: "#FFB454",
  lightBlue: "#111C30",
  border: "#283A55",
  error: "#FF6574",
};

async function readPreference(key: string) {
  if (Platform.OS === "web") return memory.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function savePreference(key: string, value: string) {
  if (Platform.OS === "web") {
    memory.set(key, value);
    return;
  }
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
    readPreference("fixmystreet.language").then((value) => {
      if (value === "sq") setLanguageState("sq");
      else setLanguageState("en");
    });
    readPreference("fixmystreet.theme").then((value) =>
      setThemeState(value === "dark" ? "dark" : "light")
    );
  }, []);

  const setLanguage = (value: AppLanguage) => {
    setLanguageState(value);
    void savePreference("fixmystreet.language", value);
  };
  const setTheme = (value: AppTheme) => {
    setThemeState(value);
    void savePreference("fixmystreet.theme", value);
  };
  const value = useMemo(() => {
    const selectedColors = theme === "dark" ? dark : light;
    Object.assign(sharedColors, selectedColors);
    return {
      language,
      theme,
      colors: selectedColors,
      setLanguage,
      setTheme,
      t: (key: keyof typeof dictionaries.en) =>
        dictionaries[language][key] as string,
    };
  }, [language, theme]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value)
    throw new Error("usePreferences must be used within PreferencesProvider");
  return value;
}
