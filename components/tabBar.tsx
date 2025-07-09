import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLinkBuilder } from '@react-navigation/native';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import TabBarButton from './TabBarButton';
import { useAuthStore } from '@/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPRING_CONFIG = {
  damping: 80,
  stiffness: 200,
  mass: 0.35,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const TAB_BAR_MARGIN = 0.05;
const INDICATOR_SIZE = 50;

interface TabBarDimensions {
  height: number;
  width: number;
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const pathname = usePathname();
  const { buildHref } = useLinkBuilder();
  const isTabBarVisible = useAuthStore((state) => state.isTabBarVisible);

  // --- ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL ---

  const mainTabRoutes = state.routes.filter(route => {
    return !route.name.includes('/') && !route.name.includes('[') && route.name !== 'create-story';
  });

  const activeMainTabIndex = mainTabRoutes.findIndex(route => route.key === state.routes[state.index].key);
  const currentMainTabIndex = activeMainTabIndex >= 0 ? activeMainTabIndex : 0;

  const [dimensions, setDimensions] = useState<TabBarDimensions>({
    height: 70,
    width: SCREEN_WIDTH * (1 - TAB_BAR_MARGIN * 2),
  });

  const [isLayoutReady, setIsLayoutReady] = useState(false);
  // Ensure buttonWidth calculation handles empty mainTabRoutes to prevent division by zero
  const buttonWidth = mainTabRoutes.length > 0 ? dimensions.width / mainTabRoutes.length : 0;
  const tabPositionX = useSharedValue(0);

  useEffect(() => {
    if (isLayoutReady && buttonWidth > 0) {
      const targetPosition = buttonWidth * currentMainTabIndex;
      tabPositionX.value = withSpring(targetPosition, SPRING_CONFIG);
    }
  }, [currentMainTabIndex, buttonWidth, isLayoutReady]);

  const onTabbarLayout = useCallback((e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    setDimensions(prev => {
      if (Math.abs(prev.height - height) > 1 || Math.abs(prev.width - width) > 1) {
        return { height, width };
      }
      return prev;
    });
    if (!isLayoutReady) {
      setIsLayoutReady(true);
    }
  }, []);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPositionX.value }],
  }));

  const handleTabPress = useCallback((index: number, route: any) => () => {
    const targetPosition = buttonWidth * index;
    tabPositionX.value = withSpring(targetPosition, SPRING_CONFIG);
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (currentMainTabIndex !== index && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }, [buttonWidth, navigation, currentMainTabIndex]);

  const handleTabLongPress = useCallback((route: any) => () => {
    navigation.emit({ type: 'tabLongPress', target: route.key });
  }, []);

  // --- CONDITIONAL RENDERING (AFTER ALL HOOKS) ---

  const shouldHideTabBar = !isTabBarVisible ||
    pathname.startsWith('/create-story') ||
    (pathname.startsWith('/chat/') && pathname !== '/chat') ||
    pathname.startsWith('/profile') ||
    (pathname.match(/^\/([^\/]+)$/) && !['/home', '/chat', '/swipe', '/likes'].includes(pathname));

  if (shouldHideTabBar) {
    // Return null to completely hide the tab bar when it should not be visible.
    // All hooks have already been called above this point.
    return null;
  }

  if (!isLayoutReady) {
    // Render a placeholder while layout is not ready, but still after hooks.
    return <View onLayout={onTabbarLayout} style={[styles.tabbar, { marginHorizontal: SCREEN_WIDTH * TAB_BAR_MARGIN }]} />;
  }

  return (
    <View onLayout={onTabbarLayout} style={[styles.tabbar, { marginHorizontal: SCREEN_WIDTH * TAB_BAR_MARGIN }]}>
      <Animated.View
        style={[
          animatedIndicatorStyle,
          styles.indicator,
          {
            width: INDICATOR_SIZE,
            height: INDICATOR_SIZE,
            left: (buttonWidth - INDICATOR_SIZE) / 2,
          },
        ]}
        pointerEvents="none"
      />
      {mainTabRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = String(options.tabBarLabel ?? options.title ?? route.name);
        const isFocused = currentMainTabIndex === index;
        return (
          <TabBarButton
            key={`${route.name}-${index}`}
            routeName={route.name}
            label={label}
            isFocused={isFocused}
            onPress={handleTabPress(index, route)}
            onLongPress={handleTabLongPress(route)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 35,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.05,
  },
  indicator: {
    position: 'absolute',
    backgroundColor: '#e64e5e',
    borderRadius: INDICATOR_SIZE / 2,
  },
});