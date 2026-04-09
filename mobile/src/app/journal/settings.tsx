import { useRouter } from "expo-router";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppSymbol } from "../../components/icons/AppSymbol";
import {
  formatNutritionGoalsSummary,
  formatWeightKg,
  getActivityLevelLabel,
  getCalorieBiasLabel,
  getDictationLanguageLabel,
} from "../../constants/journalSettings";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

function SectionTitle({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((store) => store.colors);

  return <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{children}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((store) => store.colors);

  return (
    <View style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
      {children}
    </View>
  );
}

function IconBadge({
  color,
  name,
}: {
  color: string;
  name: React.ComponentProps<typeof AppSymbol>["name"];
}) {
  return (
    <View style={styles.iconBadge}>
      <AppSymbol color={color} name={name} size={18} weight="medium" />
    </View>
  );
}

function Row({
  badgeColor,
  isLast = false,
  label,
  onPress,
  sfName,
  sublabel,
  value,
}: {
  badgeColor?: string;
  isLast?: boolean;
  label: string;
  onPress?: (() => void) | undefined;
  sfName?: React.ComponentProps<typeof AppSymbol>["name"];
  sublabel?: string;
  value?: string;
}) {
  const C = useThemeStore((store) => store.colors);
  const content = (
    <View style={[styles.row, !isLast && { borderBottomColor: C.separator }]}>
      {sfName && badgeColor ? <IconBadge color={badgeColor} name={sfName} /> : null}
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: C.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={[styles.rowValue, { color: C.textSecondary }]}>{value}</Text> : null}
      {onPress ? (
        <AppSymbol color={C.textTertiary} name="chevron.right" size={14} weight="medium" />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        journalHaptics.selection();
        onPress();
      }}
    >
      {content}
    </TouchableOpacity>
  );
}

function ToggleRow({
  badgeColor,
  isLast = false,
  label,
  onToggle,
  sfName,
  sublabel,
  value,
}: {
  badgeColor: string;
  isLast?: boolean;
  label: string;
  onToggle: (next: boolean) => void;
  sfName: React.ComponentProps<typeof AppSymbol>["name"];
  sublabel?: string;
  value: boolean;
}) {
  const C = useThemeStore((store) => store.colors);

  return (
    <View style={[styles.row, !isLast && { borderBottomColor: C.separator }]}>
      <IconBadge color={badgeColor} name={sfName} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: C.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: C.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(next) => {
          journalHaptics.selection();
          onToggle(next);
        }}
        thumbColor="#ffffff"
        trackColor={{ false: "rgba(120,120,128,0.32)", true: C.accentGreen }}
      />
    </View>
  );
}

function AppearanceRow() {
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const setColorMode = useThemeStore((store) => store.setColorMode);
  const isDark = colorMode === "dark";

  return (
    <View style={[styles.row, { borderBottomColor: C.separator }]}>
      <IconBadge color={isDark ? "#5e5ce6" : "#f59e0b"} name={isDark ? "moon.fill" : "sun.max.fill"} />
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: C.textPrimary }]}>Appearance</Text>
        <Text style={[styles.rowSub, { color: C.textSecondary }]}>{isDark ? "Dark" : "Light"}</Text>
      </View>
      <View style={[styles.segmentedControl, { backgroundColor: C.bgPrimary }]}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            journalHaptics.selection();
            setColorMode("light");
          }}
          style={[styles.segmentButton, !isDark && { backgroundColor: C.bgTertiary }]}
        >
          <Text style={[styles.segmentLabel, { color: !isDark ? C.textPrimary : C.textSecondary }]}>
            Light
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            journalHaptics.selection();
            setColorMode("dark");
          }}
          style={[styles.segmentButton, isDark && { backgroundColor: C.bgTertiary }]}
        >
          <Text style={[styles.segmentLabel, { color: isDark ? C.textPrimary : C.textSecondary }]}>
            Dark
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatWeightEntrySummary(weightEntries: Array<{ date?: string }> = []) {
  const lastEntry = weightEntries[0];
  if (!lastEntry?.date) {
    return "Log weight to see trends";
  }

  const parsed = new Date(`${lastEntry.date}T12:00:00`);
  return `Latest entry ${parsed.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;
}

function HeaderCloseButton({ onPress }: { onPress: () => void }) {
  const C = useThemeStore((store) => store.colors);
  const useGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

  const icon = (
    <AppSymbol color={C.textSecondary} name="xmark" size={20} weight="regular" />
  );

  if (useGlass) {
    return (
      <TouchableOpacity
        accessibilityLabel="Close settings"
        activeOpacity={0.82}
        onPress={onPress}
      >
        <GlassView isInteractive style={styles.closeButtonGlass}>
          {icon}
        </GlassView>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      accessibilityLabel="Close settings"
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        styles.closeButtonFallback,
        {
          backgroundColor: C.bgSecondary,
          borderColor: C.separator,
        },
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
}

export default function JournalSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reminders = useSettingsStore((store) => store.reminders);
  const autoTimeZone = useSettingsStore((store) => store.autoTimeZone);
  const savedMeals = useSettingsStore((store) => store.savedMeals);
  const nutritionGoals = useSettingsStore((store) => store.nutritionGoals);
  const healthProfile = useSettingsStore((store) => store.healthProfile);
  const calorieEstimateBias = useSettingsStore((store) => store.calorieEstimateBias);
  const dictationLanguage = useSettingsStore((store) => store.dictationLanguage);
  const weightEntries = useSettingsStore((store) => store.weightEntries);
  const setReminders = useSettingsStore((store) => store.setReminders);
  const setAutoTimeZone = useSettingsStore((store) => store.setAutoTimeZone);
  const C = useThemeStore((store) => store.colors);

  const savedMealsLabel = useMemo(
    () => `${savedMeals.length} saved meal${savedMeals.length === 1 ? "" : "s"}`,
    [savedMeals.length],
  );

  const showComingSoon = (label: string) => {
    Alert.alert("Coming soon", `${label} is not connected yet.`);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Settings</Text>
        <HeaderCloseButton
          onPress={() => {
            journalHaptics.selection();
            router.back();
          }}
        />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl + 88 },
        ]}
        alwaysBounceVertical
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom + 32, top: 8 }}
        style={styles.scroll}
      >
        <View style={styles.content}>
          <Card>
            <Row label="Name" value="Pedro Moreira" />
            <Row isLast label="Email" value="pedrohenriqmoreira@gmail.com" />
          </Card>

          <SectionTitle>Goals & Targets</SectionTitle>
          <Card>
            <Row
              badgeColor="#3b82f6"
              label={formatWeightKg(healthProfile.currentWeightKg)}
              onPress={() => router.push("/(tabs)/(journal)/nutrition-goals")}
              sfName="scalemass.fill"
              sublabel={formatNutritionGoalsSummary(nutritionGoals)}
            />
            <Row
              badgeColor="#3b82f6"
              isLast
              label="Manage Nutrition Goals"
              onPress={() => router.push("/(tabs)/(journal)/nutrition-goals")}
              sfName="chart.bar.fill"
            />
          </Card>

          <SectionTitle>Health Profile</SectionTitle>
          <Card>
            <Row
              badgeColor="#ef4444"
              label={`${formatWeightKg(healthProfile.currentWeightKg)} (current weight)`}
              onPress={() => router.push("/(tabs)/(journal)/health-profile")}
              sfName="heart.fill"
              sublabel={getActivityLevelLabel(healthProfile.activityLevel)}
            />
            <Row
              badgeColor="#ef4444"
              isLast
              label="Manage Health Info"
              onPress={() => router.push("/(tabs)/(journal)/health-profile")}
              sfName="doc.text.fill"
            />
          </Card>

          <SectionTitle>Weight Tracking</SectionTitle>
          <Card>
            <Row
              badgeColor="#a855f7"
              isLast
              label={formatWeightKg(healthProfile.currentWeightKg)}
              onPress={() => router.push("/(tabs)/(journal)/weight-tracking")}
              sfName="chart.line.downtrend.xyaxis"
              sublabel={formatWeightEntrySummary(weightEntries)}
            />
          </Card>

          <SectionTitle>Saved Meals</SectionTitle>
          <Card>
            <Row
              badgeColor="#f97316"
              isLast
              label="Manage Saved Meals"
              onPress={() => router.push("/(tabs)/(journal)/saved-meals")}
              sfName="fork.knife"
              sublabel={savedMealsLabel}
            />
          </Card>

          <SectionTitle>Preferences</SectionTitle>
          <Card>
            <Row
              badgeColor="#f97316"
              label="Calorie Estimate Bias"
              onPress={() => router.push("/(tabs)/(journal)/calorie-bias")}
              sfName="target"
              sublabel={getCalorieBiasLabel(calorieEstimateBias)}
            />
            <ToggleRow
              badgeColor="#f97316"
              isLast
              label="Daily Tracking Reminders"
              onToggle={setReminders}
              sfName="bell.fill"
              value={reminders}
            />
          </Card>

          <SectionTitle>Device Settings</SectionTitle>
          <Card>
            <AppearanceRow />
            <ToggleRow
              badgeColor="#22c55e"
              label="Automatic Time Zone"
              onToggle={setAutoTimeZone}
              sfName="clock.fill"
              value={autoTimeZone}
            />
            <Row
              badgeColor="#3b82f6"
              isLast
              label="Dictation Language"
              onPress={() => router.push("/(tabs)/(journal)/dictation-language")}
              sfName="mic.fill"
              value={getDictationLanguageLabel(dictationLanguage)}
            />
          </Card>

          <SectionTitle>Subscription</SectionTitle>
          <Card>
            <Row
              badgeColor="#eab308"
              label="Subscription Active"
              sfName="crown.fill"
              sublabel="Tasanka 3 Apr 2025"
            />
            <Row isLast label="Manage Subscription" onPress={() => showComingSoon("Manage Subscription")} />
          </Card>

          <Card>
            <Row badgeColor="#a855f7" label="Give Feedback" onPress={() => showComingSoon("Feedback")} sfName="star.fill" />
            <Row badgeColor="#a855f7" isLast label="About the App" onPress={() => showComingSoon("About")} sfName="info.circle.fill" />
          </Card>

          <Card>
            <Row badgeColor="#3b82f6" label="Contact Support" onPress={() => showComingSoon("Support")} sfName="bubble.left.fill" />
            <Row badgeColor="#636366" label="Clear Local Cache" onPress={() => showComingSoon("Clear Local Cache")} sfName="trash.fill" />
            <Row badgeColor="#f97316" label="Export Data" onPress={() => showComingSoon("Export Data")} sfName="square.and.arrow.up.fill" />
            <Row badgeColor="#ef4444" label="Delete Account" onPress={() => showComingSoon("Delete Account")} sfName="exclamationmark.triangle.fill" />
            <Row badgeColor="#ef4444" isLast label="Sign Out" onPress={() => showComingSoon("Sign Out")} sfName="rectangle.portrait.and.arrow.right.fill" />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    ...typography.title1,
    fontWeight: "700",
  },
  closeButtonGlass: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  closeButtonFallback: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption1,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    ...typography.body,
    fontWeight: "400",
  },
  rowSub: {
    ...typography.caption1,
    marginTop: 2,
  },
  rowValue: {
    ...typography.subhead,
  },
  iconBadge: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  segmentedControl: {
    borderRadius: radius.md,
    flexDirection: "row",
    gap: 2,
    padding: 2,
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: radius.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  segmentLabel: {
    ...typography.caption1,
    fontWeight: "600",
  },
});
