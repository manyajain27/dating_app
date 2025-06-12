import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PlatformPressable } from '@react-navigation/elements';
import React, { JSX, useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

type IconProps = { color: string; size?: number };
type IconRenderer = (props: IconProps) => JSX.Element;

interface TabBarButtonProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

// Animation constants
const SPRING_CONFIG = {
  damping: 25,
  stiffness: 120,
  mass: 0.2,
};

const SCALE_RANGE = {
  inactive: 1,
  active: 1.2,
};

const ICON_OFFSET = {
  inactive: 0,
  active: 6,
};

const OPACITY_RANGE = {
  visible: 1,
  hidden: 0,
};

const TabBarButton: React.FC<TabBarButtonProps> = ({
  routeName,
  label,
  isFocused,
  onPress,
  onLongPress,
}) => {
  // Memoize icon map to prevent recreation on every render
  const iconMap = useMemo<Record<string, IconRenderer>>(() => ({
    home: ({ color, size = 24 }) => <AntDesign name="home" size={size} color={color} />,
    chat: ({ color, size = 24 }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
    swipe: ({ color, size = 24 }) => <MaterialCommunityIcons name="gesture-swipe" size={size} color={color} />,
    likes: ({ color, size = 24 }) => <Ionicons name="heart-outline" size={size} color={color} />,
    profile: ({ color, size = 24 }) => <Ionicons name="person-outline" size={size} color={color} />,
  }), []);

  const renderIcon = iconMap[routeName.toLowerCase()];
  const scale: SharedValue<number> = useSharedValue(isFocused ? 1 : 0);

  // Update animation when focus state changes
  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused, scale]);

  // Memoize animated styles to prevent unnecessary calculations
  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      scale.value,
      [0, 1],
      [SCALE_RANGE.inactive, SCALE_RANGE.active]
    );
    const topOffset = interpolate(
      scale.value,
      [0, 1],
      [ICON_OFFSET.inactive, ICON_OFFSET.active]
    );
    
    return {
      transform: [{ scale: scaleValue }],
      top: topOffset,
    };
  }, []);

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scale.value,
      [0, 1],
      [OPACITY_RANGE.visible, OPACITY_RANGE.hidden]
    );
    
    return { opacity };
  }, []);

  // Early return for unsupported route names
  if (!renderIcon) {
    console.warn(`TabBarButton: No icon found for route "${routeName}"`);
    return null;
  }

  const iconColor = isFocused ? '#fff' : '#16213e';
  const textColor = isFocused ? '#16213e' : '#16213e';

  return (
    <PlatformPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.button}
      android_ripple={{ 
        color: 'rgba(22, 33, 62, 0.1)', 
        borderless: true, 
        radius: 30 
      }}
    >
      <Animated.View style={animatedIconStyle}>
        {renderIcon({ color: iconColor })}
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.label, 
          { color: textColor }, 
          animatedTextStyle
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Animated.Text>
    </PlatformPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default React.memo(TabBarButton);