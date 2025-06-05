const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

let config = getDefaultConfig(__dirname);

// 2. Add NativeWind (input css path optional)
config = withNativeWind(config, { input: './global.css' });

// 3. Wrap with Reanimated
config = wrapWithReanimatedMetroConfig(config);

module.exports = config;
