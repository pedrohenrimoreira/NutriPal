/**
 * NutriPal Mobile — App root
 * Navigation: bottom tabs (Journal / History / Settings)
 * LiquidGlass applied throughout via individual screens/components
 */
import React from 'react';
import {StatusBar, View, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {LiquidGlassView} from '@callstack/liquid-glass';

import {JournalScreen} from './screens/JournalScreen';
import {HistoryScreen} from './screens/HistoryScreen';
import {SettingsScreen} from './screens/SettingsScreen';
import {colors, radius} from './theme';

const Tab = createBottomTabNavigator();

function TabIcon({emoji, focused}: {emoji: string; focused: boolean}) {
  return (
    <LiquidGlassView
      style={[styles.tabIcon, focused && styles.tabIconFocused]}
      effect={focused ? 'regular' : 'clear'}
    >
      <Text style={{fontSize: 20}}>{emoji}</Text>
    </LiquidGlassView>
  );
}

function TabBar({state, descriptors, navigation}: any) {
  return (
    <LiquidGlassView style={styles.tabBar} effect="regular">
      {state.routes.map((route: any, index: number) => {
        const {options} = descriptors[route.key];
        const isFocused = state.index === index;
        const emoji =
          route.name === 'Journal'
            ? '📓'
            : route.name === 'History'
            ? '📅'
            : '⚙️';

        return (
          <View key={route.key} style={styles.tabItem}>
            <TabIcon emoji={emoji} focused={isFocused} />
            <Text
              style={[
                styles.tabLabel,
                {color: isFocused ? colors.textPrimary : colors.systemGray},
              ]}
            >
              {options.title}
            </Text>
          </View>
        );
      })}
    </LiquidGlassView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.textPrimary,
            background: colors.bgPrimary,
            card: colors.bgSecondary,
            text: colors.textPrimary,
            border: 'rgba(255,255,255,0.1)',
            notification: colors.accentRed,
          },
          fonts: {
            regular: {fontFamily: 'System', fontWeight: '400'},
            medium: {fontFamily: 'System', fontWeight: '500'},
            bold: {fontFamily: 'System', fontWeight: '700'},
            heavy: {fontFamily: 'System', fontWeight: '900'},
          },
        }}
      >
        <Tab.Navigator
          tabBar={props => <TabBar {...props} />}
          screenOptions={{headerShown: false}}
        >
          <Tab.Screen
            name="Journal"
            component={JournalScreen}
            options={{title: 'Diário'}}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{title: 'Histórico'}}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Config'}}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderRadius: 0,
    paddingBottom: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabIcon: {
    width: 44,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconFocused: {
    // liquid glass effect handles the highlight
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
