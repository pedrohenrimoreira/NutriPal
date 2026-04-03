/**
 * JournalScreen — main diary screen.
 *
 * Uses KeyboardAvoidingView (native iOS behavior) so the ActionBar
 * sticks directly above the system keyboard — no hacks needed.
 * LiquidGlassView applied to header, pills, cards, and action bar.
 */
import React, {useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import {LiquidGlassView, LiquidGlassContainerView} from '@callstack/liquid-glass';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useJournalStore, useDailyTotals} from '../store/journalStore';
import {MealEntryCard} from '../components/journal/MealEntryCard';
import {ActionBar} from '../components/journal/ActionBar';
import {colors, spacing, radius, typography} from '../theme';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'});
}

export function JournalScreen() {
  const {entries, selectedDate, setDate, addTextEntry, addImageEntry} =
    useJournalStore();
  const totals = useDailyTotals(entries);
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const dateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    setIsEditing(false);
    setText('');
  }, []);

  const handleSubmit = useCallback(async () => {
    const raw = text.trim();
    if (!raw) return;
    await addTextEntry(raw);
    setText('');
    Keyboard.dismiss();
    setIsEditing(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
  }, [text, addTextEntry]);

  const handleToggleMic = useCallback(() => {
    // TODO: integrate Voice recognition (react-native-voice)
    setIsListening(prev => !prev);
  }, []);

  const handleOpenCamera = useCallback(() => {
    // TODO: integrate react-native-image-picker
    console.log('Camera pressed');
  }, []);

  const handleAddSavedMeal = useCallback(() => {
    // TODO: open saved meals sheet
    console.log('Add saved meal pressed');
  }, []);

  const goToDay = useCallback(
    (offset: number) => {
      const d = new Date(`${selectedDate}T12:00:00`);
      d.setDate(d.getDate() + offset);
      setDate(toDateStr(d));
    },
    [selectedDate, setDate],
  );

  return (
    <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
      {/* ── Header ── */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <Text style={styles.logo}>🥗</Text>

        {/* Date pill — liquid glass */}
        <LiquidGlassContainerView style={styles.datePillContainer}>
          <TouchableOpacity onPress={() => goToDay(-1)} activeOpacity={0.6}>
            <LiquidGlassView style={styles.arrowBtn} effect="clear" interactive>
              <Text style={styles.arrowText}>‹</Text>
            </LiquidGlassView>
          </TouchableOpacity>

          <LiquidGlassView style={styles.datePill} effect="regular">
            <Text style={styles.dateLabel}>{dateLabel}</Text>
          </LiquidGlassView>

          <TouchableOpacity onPress={() => goToDay(1)} activeOpacity={0.6}>
            <LiquidGlassView style={styles.arrowBtn} effect="clear" interactive>
              <Text style={styles.arrowText}>›</Text>
            </LiquidGlassView>
          </TouchableOpacity>
        </LiquidGlassContainerView>

        {/* Streak + settings */}
        <LiquidGlassContainerView style={styles.headerRight}>
          <LiquidGlassView style={styles.streakPill} effect="regular">
            <Text style={styles.streakText}>🔥 1</Text>
          </LiquidGlassView>
          <TouchableOpacity activeOpacity={0.7}>
            <LiquidGlassView style={styles.settingsBtn} effect="clear" interactive>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </LiquidGlassView>
          </TouchableOpacity>
        </LiquidGlassContainerView>
      </View>

      {/*
       * KeyboardAvoidingView — native iOS behavior.
       * behavior="padding" pushes content up by the keyboard height.
       * The ActionBar inside rises WITH the keyboard automatically.
       * No visualViewport hacks, no fixed positioning needed.
       */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── Scrollable content ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Text input area */}
          {isEditing ? (
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="O que você comeu?..."
                placeholderTextColor={colors.systemGray3}
                style={styles.textInput}
                multiline
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                blurOnSubmit={false}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  onPress={handleDismissKeyboard}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.saveBtn,
                    {backgroundColor: text.trim() ? colors.accentGreen : colors.glassBg},
                  ]}
                >
                  <Text
                    style={[
                      styles.saveText,
                      {color: text.trim() ? '#000' : colors.systemGray3},
                    ]}
                  >
                    Salvar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : entries.length === 0 ? (
            <TouchableOpacity onPress={handleStartEditing} activeOpacity={0.6}>
              <Text style={styles.placeholder}>Start logging your meals...</Text>
            </TouchableOpacity>
          ) : (
            <>
              {entries.map(entry => (
                <MealEntryCard key={entry.id} entry={entry} />
              ))}
              <TouchableOpacity
                onPress={handleStartEditing}
                style={styles.addMoreBtn}
                activeOpacity={0.6}
              >
                <Text style={styles.addMoreText}>+ Adicionar refeição</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/*
         * ActionBar sits INSIDE KeyboardAvoidingView.
         * When keyboard opens, KAV pushes the whole view up,
         * so the ActionBar rises to sit directly above the keyboard.
         * LiquidGlassContainerView merges the glass effects.
         */}
        <ActionBar
          totals={totals}
          isEditing={isEditing}
          isListening={isListening}
          onToggleMic={handleToggleMic}
          onOpenCamera={handleOpenCamera}
          onAddSavedMeal={handleAddSavedMeal}
          onDismissKeyboard={handleDismissKeyboard}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  logo: {
    fontSize: 28,
  },
  datePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  datePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  dateLabel: {
    ...typography.headline,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  streakPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
  },

  /* Scroll */
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },

  /* Input */
  inputContainer: {
    marginBottom: spacing.md,
  },
  textInput: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  cancelText: {
    ...typography.callout,
    color: colors.systemGray,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  saveText: {
    ...typography.callout,
    fontWeight: '600',
  },

  /* Empty state */
  placeholder: {
    ...typography.body,
    color: colors.systemGray3,
    paddingTop: spacing.sm,
  },

  /* Add more */
  addMoreBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addMoreText: {
    ...typography.callout,
    color: colors.systemGray,
  },
});
