/**
 * components/settings/SettingsSheet.tsx – Bottom sheet settings (Amy-inspired).
 *
 * iOS-style bottom sheet with grouped list items and navigable sub-screens.
 * Sections: Profile, Goals & Targets, Preferences, Saved Meals, Device, About.
 */

import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import type { CalorieBias, AppTheme, AppLanguage, GoalBarItem } from '../../store/settingsStore';

type SubScreen = 'main' | 'goals' | 'bias' | 'goalBar' | 'savedMeals' | 'appearance' | 'language' | 'about';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const [subScreen, setSubScreen] = useState<SubScreen>('main');

  const {
    profile,
    goals,
    calorieBias,
    goalBarItems,
    dailyReminders,
    theme,
    language,
    savedMeals,
    updateProfile,
    updateGoals,
    setCalorieBias,
    setGoalBarItems,
    toggleDailyReminders,
    setTheme,
    setLanguage,
    removeSavedMeal,
    clearAllData,
    exportData,
  } = useSettingsStore();

  // Reset sub-screen when sheet closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setSubScreen('main'), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setSubScreen('main');
    onClose();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This action cannot be undone.')) {
      clearAllData();
    }
  };

  const handleExportData = () => {
    const raw = exportData(); // already a JSON string
    const pretty = JSON.stringify(JSON.parse(raw), null, 2);
    const blob = new Blob([pretty], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `nutrilens-export-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const biasLabel: Record<CalorieBias, string> = {
    underestimate: 'Underestimate',
    accurate: 'Accurate',
    overestimate: 'Overestimate',
  };

  const themeLabel: Record<AppTheme, string> = {
    system: 'System',
    dark: 'Dark',
    light: 'Light',
  };

  const languageLabel: Record<AppLanguage, string> = {
    'pt-BR': 'PT-BR',
    en: 'English',
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`bottom-sheet-overlay ${isOpen ? 'open' : ''}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className={`bottom-sheet ${isOpen ? 'open' : ''}`} id="settings-sheet">
        <div className="bottom-sheet-handle" />

        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* ==================== MAIN SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'main' ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'main' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <MainScreenHeader onClose={handleClose} />
            <div className="px-5 pb-8 space-y-6">
              {/* Profile */}
              <div className="glass overflow-hidden">
                <div className="list-item">
                  <span className="text-sm text-zinc-400">Name</span>
                  <span className="text-sm">{profile.name}</span>
                </div>
                <div className="list-item">
                  <span className="text-sm text-zinc-400">Email</span>
                  <span className="text-sm text-zinc-300">{profile.email}</span>
                </div>
              </div>

              {/* Goals & Targets */}
              <div>
                <p className="section-header">Goals & Targets</p>
                <div className="glass overflow-hidden">
                  <div className="list-item">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">&#9878;&#65039;</span>
                      <div>
                        <p className="text-sm font-medium">{profile.weight_kg} kg</p>
                        <p className="text-xs text-zinc-500">
                          {'\uD83D\uDD25'} {goals.calories.toLocaleString()} cal {'\u00B7'} P {goals.protein_g}g {'\u00B7'} C {goals.carbs_g}g {'\u00B7'} F {goals.fat_g}g
                        </p>
                      </div>
                    </div>
                  </div>
                  <button className="list-item w-full text-left" onClick={() => setSubScreen('goals')}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{'\uD83D\uDCCA'}</span>
                      <span className="text-sm">Manage Nutrition Goals</span>
                    </div>
                    <ChevronRight />
                  </button>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <p className="section-header">Preferences</p>
                <div className="glass overflow-hidden">
                  <button className="list-item w-full text-left" onClick={() => setSubScreen('bias')}>
                    <div className="flex items-center gap-3">
                      <span>{'\uD83D\uDD25'}</span>
                      <div>
                        <p className="text-sm font-medium">Calorie Estimate Bias</p>
                        <p className="text-xs text-zinc-500">{biasLabel[calorieBias]}</p>
                      </div>
                    </div>
                    <ChevronRight />
                  </button>
                  <button className="list-item w-full text-left" onClick={() => setSubScreen('goalBar')}>
                    <div className="flex items-center gap-3">
                      <span>{'\uD83D\uDCD0'}</span>
                      <span className="text-sm">Customize Goal Bar</span>
                    </div>
                    <ChevronRight />
                  </button>
                  <div className="list-item">
                    <div className="flex items-center gap-3">
                      <span>{'\uD83D\uDD14'}</span>
                      <span className="text-sm">Daily Tracking Reminders</span>
                    </div>
                    <div
                      className={`toggle ${dailyReminders ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDailyReminders();
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Saved Meals */}
              <div>
                <p className="section-header">Saved Meals</p>
                <div className="glass overflow-hidden">
                  <button className="list-item w-full text-left" onClick={() => setSubScreen('savedMeals')}>
                    <div className="flex items-center gap-3">
                      <span>{'\uD83C\uDF7D\uFE0F'}</span>
                      <div>
                        <p className="text-sm font-medium">Manage Saved Meals</p>
                        <p className="text-xs text-zinc-500">{savedMeals.length} saved meal{savedMeals.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronRight />
                  </button>
                </div>
              </div>

              {/* Device Settings */}
              <div>
                <p className="section-header">Device Settings</p>
                <div className="glass overflow-hidden">
                  <button className="list-item w-full text-left" onClick={() => setSubScreen('appearance')}>
                    <div className="flex items-center gap-3">
                      <span>{'\uD83C\uDF19'}</span>
                      <span className="text-sm">Appearance</span>
                    </div>
                    <span className="text-sm text-zinc-500">{themeLabel[theme]} &#9662;</span>
                  </button>
                  <button className="list-item w-full text-left" onClick={() => setSubScreen('language')}>
                    <div className="flex items-center gap-3">
                      <span>{'\uD83C\uDF10'}</span>
                      <span className="text-sm">Language</span>
                    </div>
                    <span className="text-sm text-zinc-500">{languageLabel[language]} &#9662;</span>
                  </button>
                </div>
              </div>

              {/* About */}
              <div>
                <div className="glass overflow-hidden">
                  <button className="list-item w-full text-left" onClick={() => setSubScreen('about')}>
                    <div className="flex items-center gap-3">
                      <span>{'\uD83D\uDC9C'}</span>
                      <span className="text-sm">About the App</span>
                    </div>
                    <ChevronRight />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="glass overflow-hidden">
                <button className="list-item w-full text-left" onClick={handleClearData}>
                  <div className="flex items-center gap-3">
                    <span>{'\uD83D\uDDD1\uFE0F'}</span>
                    <span className="text-sm" style={{ color: 'var(--accent-red)' }}>Clear Local Cache</span>
                  </div>
                </button>
                <button className="list-item w-full text-left" onClick={handleExportData}>
                  <div className="flex items-center gap-3">
                    <span>{'\uD83D\uDCE4'}</span>
                    <span className="text-sm" style={{ color: 'var(--accent-blue)' }}>Export Data</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* ==================== GOALS SUB-SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'goals' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'goals' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <GoalsScreen onBack={() => setSubScreen('main')} />
          </div>

          {/* ==================== BIAS SUB-SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'bias' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'bias' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <BiasScreen onBack={() => setSubScreen('main')} />
          </div>

          {/* ==================== GOAL BAR SUB-SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'goalBar' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'goalBar' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <GoalBarScreen onBack={() => setSubScreen('main')} />
          </div>

          {/* ==================== SAVED MEALS SUB-SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'savedMeals' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'savedMeals' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <SavedMealsScreen onBack={() => setSubScreen('main')} />
          </div>

          {/* ==================== APPEARANCE SUB-SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'appearance' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'appearance' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <AppearanceScreen onBack={() => setSubScreen('main')} />
          </div>

          {/* ==================== LANGUAGE SUB-SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'language' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'language' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <LanguageScreen onBack={() => setSubScreen('main')} />
          </div>

          {/* ==================== ABOUT SUB-SCREEN ==================== */}
          <div
            style={{
              transform: subScreen === 'about' ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.2s ease',
              ...(subScreen !== 'about' ? { position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' } : {}),
            }}
          >
            <AboutScreen onBack={() => setSubScreen('main')} />
          </div>
        </div>
      </div>
    </>
  );
}

/* ========================================================================= */
/*  Sub-screen components                                                     */
/* ========================================================================= */

function GoalsScreen({ onBack }: { onBack: () => void }) {
  const { goals, profile, updateGoals, updateProfile } = useSettingsStore();

  const [calories, setCalories] = useState(goals.calories);
  const [proteinG, setProteinG] = useState(goals.protein_g);
  const [carbsG, setCarbsG] = useState(goals.carbs_g);
  const [fatG, setFatG] = useState(goals.fat_g);
  const [weightKg, setWeightKg] = useState(profile.weight_kg);

  useEffect(() => {
    setCalories(goals.calories);
    setProteinG(goals.protein_g);
    setCarbsG(goals.carbs_g);
    setFatG(goals.fat_g);
    setWeightKg(profile.weight_kg);
  }, [goals, profile.weight_kg]);

  const handleSaveGoals = () => {
    updateGoals({ calories, protein_g: proteinG, carbs_g: carbsG, fat_g: fatG });
  };

  const handleSaveWeight = () => {
    updateProfile({ weight_kg: weightKg });
  };

  return (
    <>
      <SubScreenHeader title="Nutrition Goals" onBack={onBack} />
      <div className="px-5 pb-8 space-y-6">
        <div>
          <p className="section-header">Daily Goals</p>
          <div className="glass overflow-hidden">
            <div className="list-item">
              <span className="text-sm text-zinc-400">Calories</span>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="text-sm text-right bg-transparent border-none outline-none w-24"
                style={{ color: 'var(--text-primary, #fff)' }}
              />
            </div>
            <div className="list-item">
              <span className="text-sm text-zinc-400">Protein (g)</span>
              <input
                type="number"
                value={proteinG}
                onChange={(e) => setProteinG(Number(e.target.value))}
                className="text-sm text-right bg-transparent border-none outline-none w-24"
                style={{ color: 'var(--text-primary, #fff)' }}
              />
            </div>
            <div className="list-item">
              <span className="text-sm text-zinc-400">Carbs (g)</span>
              <input
                type="number"
                value={carbsG}
                onChange={(e) => setCarbsG(Number(e.target.value))}
                className="text-sm text-right bg-transparent border-none outline-none w-24"
                style={{ color: 'var(--text-primary, #fff)' }}
              />
            </div>
            <div className="list-item">
              <span className="text-sm text-zinc-400">Fat (g)</span>
              <input
                type="number"
                value={fatG}
                onChange={(e) => setFatG(Number(e.target.value))}
                className="text-sm text-right bg-transparent border-none outline-none w-24"
                style={{ color: 'var(--text-primary, #fff)' }}
              />
            </div>
          </div>
          <button
            onClick={handleSaveGoals}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent-primary, #8b5cf6)', color: '#fff' }}
          >
            Save Goals
          </button>
        </div>

        <div>
          <p className="section-header">Body Weight</p>
          <div className="glass overflow-hidden">
            <div className="list-item">
              <span className="text-sm text-zinc-400">Weight (kg)</span>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="text-sm text-right bg-transparent border-none outline-none w-24"
                style={{ color: 'var(--text-primary, #fff)' }}
              />
            </div>
          </div>
          <button
            onClick={handleSaveWeight}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent-primary, #8b5cf6)', color: '#fff' }}
          >
            Save Weight
          </button>
        </div>
      </div>
    </>
  );
}

function BiasScreen({ onBack }: { onBack: () => void }) {
  const { calorieBias, setCalorieBias } = useSettingsStore();

  const options: { value: CalorieBias; label: string; description: string }[] = [
    { value: 'underestimate', label: 'Underestimate', description: 'Lower calorie estimates when uncertain' },
    { value: 'accurate', label: 'Accurate', description: 'Best-guess calorie estimates' },
    { value: 'overestimate', label: 'Overestimate', description: 'Higher calorie estimates when uncertain' },
  ];

  return (
    <>
      <SubScreenHeader title="Calorie Estimate Bias" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="glass overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              className="list-item w-full text-left"
              onClick={() => setCalorieBias(opt.value)}
            >
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-zinc-500">{opt.description}</p>
              </div>
              <RadioDot selected={calorieBias === opt.value} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function GoalBarScreen({ onBack }: { onBack: () => void }) {
  const { goalBarItems, setGoalBarItems } = useSettingsStore();

  const allItems: { value: GoalBarItem; label: string }[] = [
    { value: 'calories', label: 'Calories' },
    { value: 'protein', label: 'Protein' },
    { value: 'carbs', label: 'Carbs' },
    { value: 'fat', label: 'Fat' },
    { value: 'fiber', label: 'Fiber' },
  ];

  const handleToggle = (item: GoalBarItem) => {
    const newItems = goalBarItems.includes(item)
      ? goalBarItems.filter((i) => i !== item)
      : [...goalBarItems, item];
    setGoalBarItems(newItems);
  };

  return (
    <>
      <SubScreenHeader title="Customize Goal Bar" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="glass overflow-hidden">
          {allItems.map((opt) => (
            <button
              key={opt.value}
              className="list-item w-full text-left"
              onClick={() => handleToggle(opt.value)}
            >
              <span className="text-sm">{opt.label}</span>
              <Checkbox checked={goalBarItems.includes(opt.value)} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SavedMealsScreen({ onBack }: { onBack: () => void }) {
  const { savedMeals, removeSavedMeal } = useSettingsStore();

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete saved meal "${name}"?`)) {
      removeSavedMeal(id);
    }
  };

  return (
    <>
      <SubScreenHeader title="Saved Meals" onBack={onBack} />
      <div className="px-5 pb-8">
        {savedMeals.length === 0 ? (
          <div className="glass overflow-hidden">
            <div className="list-item justify-center">
              <span className="text-sm text-zinc-500">No saved meals yet</span>
            </div>
          </div>
        ) : (
          <div className="glass overflow-hidden">
            {savedMeals.map((meal) => (
              <div key={meal.id} className="list-item">
                <div>
                  <p className="text-sm font-medium">{meal.name}</p>
                  <p className="text-xs text-zinc-500">{meal.calories} cal</p>
                </div>
                <button
                  onClick={() => handleDelete(meal.id, meal.name)}
                  className="w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,59,48,0.15)' }}
                  aria-label={`Delete ${meal.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AppearanceScreen({ onBack }: { onBack: () => void }) {
  const { theme, setTheme } = useSettingsStore();

  const options: { value: AppTheme; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ];

  return (
    <>
      <SubScreenHeader title="Appearance" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="glass overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              className="list-item w-full text-left"
              onClick={() => setTheme(opt.value)}
            >
              <span className="text-sm">{opt.label}</span>
              <RadioDot selected={theme === opt.value} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function LanguageScreen({ onBack }: { onBack: () => void }) {
  const { language, setLanguage } = useSettingsStore();

  const options: { value: AppLanguage; label: string }[] = [
    { value: 'pt-BR', label: 'Portugu\u00EAs (BR)' },
    { value: 'en', label: 'English' },
  ];

  return (
    <>
      <SubScreenHeader title="Language" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="glass overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              className="list-item w-full text-left"
              onClick={() => setLanguage(opt.value)}
            >
              <span className="text-sm">{opt.label}</span>
              <RadioDot selected={language === opt.value} />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SubScreenHeader title="About NutriLens" onBack={onBack} />
      <div className="px-5 pb-8">
        <div className="glass overflow-hidden">
          <div className="list-item">
            <span className="text-sm text-zinc-400">Version</span>
            <span className="text-sm">0.1.0 (scaffold)</span>
          </div>
          <div className="list-item">
            <span className="text-sm text-zinc-400">Description</span>
            <span className="text-sm text-zinc-300">AI-powered nutrition diary with computer vision</span>
          </div>
          <div className="list-item justify-center">
            <span className="text-sm text-zinc-400">Made with {'\u2764\uFE0F'}</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ========================================================================= */
/*  Shared small components                                                   */
/* ========================================================================= */

function MainScreenHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <h2 className="text-lg font-semibold">Settings</h2>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        aria-label="Close"
        id="settings-close-btn"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function SubScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-3">
      <button
        onClick={onBack}
        className="w-8 h-8 flex items-center justify-center rounded-full"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        aria-label="Back"
      >
        <ChevronLeft />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-zinc-600"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="text-zinc-400"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: selected ? 'none' : '2px solid rgba(255,255,255,0.2)',
        background: selected ? 'var(--accent-primary, #8b5cf6)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}
    >
      {selected && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 5,
        border: checked ? 'none' : '2px solid rgba(255,255,255,0.2)',
        background: checked ? 'var(--accent-primary, #8b5cf6)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}
