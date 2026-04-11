import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppSymbol } from "../icons/AppSymbol";
import { useJournalStore } from "../../store/journalStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";

const HEADER_DOG_ICON = require("../../../assets/images/header-dog.png");
const HEADER_VISUAL_HEIGHT = 42 + spacing.md + spacing.lg;

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr: string) {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export const JournalZoomBackdrop = React.memo(function JournalZoomBackdrop() {
  const insets = useSafeAreaInsets();
  const { selectedDate } = useJournalStore();
  const C = useThemeStore((store) => store.colors);
  const headerTopInset = insets.top + 10;
  const headerSpacerHeight = headerTopInset + HEADER_VISUAL_HEIGHT;
  const dateLabel = formatDateLabel(selectedDate);

  return (
    <View pointerEvents="none" style={[styles.root, { backgroundColor: C.bgPrimary }]}>
      <View style={[styles.header, { paddingTop: headerTopInset }]}>
        <View style={styles.headerSide}>
          <Image
            source={HEADER_DOG_ICON}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.headerCenter}>
          <View
            style={[
              styles.capsule,
              styles.datePill,
              {
                backgroundColor: C.bgSecondary,
                borderColor: C.separator,
              },
            ]}
          >
            <Text style={[styles.dateLabel, { color: C.textPrimary }]}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.headerSideRight}>
          <View
            style={[
              styles.capsule,
              styles.rightPill,
              {
                backgroundColor: C.bgSecondary,
                borderColor: C.separator,
              },
            ]}
          >
            <AppSymbol
              color={C.accentOrange}
              name="flame.fill"
              size={15}
              style={styles.streakSymbol}
              weight="medium"
            />
            <Text style={[styles.streakCount, { color: C.textPrimary }]}>1</Text>
            <View style={styles.pillDivider} />
            <AppSymbol
              color={C.textSecondary}
              name="gearshape"
              size={16}
              style={styles.gearSymbol}
              weight="regular"
            />
          </View>
        </View>
      </View>

      <View style={[styles.content, { paddingTop: headerSpacerHeight + spacing.lg }]}>
        <Text style={[styles.placeholder, { color: C.textSecondary }]}>
          O que voce comeu?
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    left: 0,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  headerSide: {
    flex: 1,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerSideRight: {
    alignItems: "flex-end",
    flex: 1,
  },
  logoImage: {
    height: 42,
    width: 54,
  },
  capsule: {
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  datePill: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 3,
  },
  dateLabel: {
    ...typography.headline,
    fontWeight: "600",
  },
  rightPill: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 3,
  },
  streakSymbol: {
    marginTop: 1,
  },
  streakCount: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  pillDivider: {
    backgroundColor: "rgba(255,255,255,0.15)",
    height: 14,
    marginHorizontal: spacing.xs,
    width: 1,
  },
  gearSymbol: {
    height: 16,
    width: 16,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  placeholder: {
    ...typography.body,
    letterSpacing: -0.3,
    lineHeight: 26,
    paddingTop: spacing.xs,
  },
});

export default JournalZoomBackdrop;
