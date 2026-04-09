import Constants, { AppOwnership } from "expo-constants";
import React from "react";
import { StyleSheet, View } from "react-native";

const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

function getLauncherMenuContainer() {
  if (isExpoGo) {
    return null;
  }

  return require("@anythingai/app/screens/launcher-menu").default;
}

export default () => {
  const LauncherMenuContainer = getLauncherMenuContainer();

  if (isExpoGo) {
    return null;
  }

  return (
    <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 9999 }} pointerEvents="box-none">
      <LauncherMenuContainer />
    </View>
  );
};
