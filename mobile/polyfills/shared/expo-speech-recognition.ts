const noop = () => {};
const noopAsync = async () => {};

export const ExpoSpeechRecognitionModule = {
  start: noopAsync,
  stop: noop,
  abort: noop,
  requestPermissionsAsync: async () => ({ granted: false, status: "denied" }),
  getPermissionsAsync: async () => ({ granted: false, status: "denied" }),
  getSupportedLocales: async () => ({ locales: [], installedLocales: [] }),
  isRecognitionAvailable: () => false,
  androidTriggerOfflineModelDownload: noopAsync,
  setCategoryIOS: noopAsync,
  getStateAsync: async () => "inactive",
  addListener: () => ({ remove: noop }),
  removeAllListeners: noop,
};

export class ExpoWebSpeechRecognition {}
export class ExpoWebSpeechGrammar {}
export class ExpoWebSpeechGrammarList {}
export const useSpeechRecognitionEvent = () => {};
export const AVAudioSessionCategory = {};
export const AVAudioSessionCategoryOptions = {};
export const AVAudioSessionMode = {};
export const RecognizerIntentExtraLanguageModel = {};
export const RecognizerIntentEnableLanguageSwitch = {};
export const AudioEncodingAndroid = {};
export const TaskHintIOS = {};
export const SpeechRecognizerErrorAndroid = {};
