import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLinkBuilder } from '@react-navigation/native';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import TabBarButton from './TabBarButton';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Constants for better maintainability
const SPRING_CONFIG = {
  damping: 80,
  stiffness: 200,
  mass: 0.35,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const TAB_BAR_MARGIN = 0.1;
const INDICATOR_MARGIN = 12;
const INDICATOR_SIZE = 55; // Fixed size for perfect circle

interface TabBarDimensions {
  height: number;
  width: number;
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const pathname = usePathname();

  const { buildHref } = useLinkBuilder();
  
  // Filter out nested routes - only show main tab routes
  const mainTabRoutes = state.routes.filter(route => {
    const routeName = route.name;
    // Only include routes that don't have nested paths (no slashes) or dynamic segments
    return !routeName.includes('/') && !routeName.includes('[');
  });

  // Get the active index relative to main tabs only
  const activeMainTabIndex = mainTabRoutes.findIndex(route => route.key === state.routes[state.index].key);
  const currentMainTabIndex = activeMainTabIndex >= 0 ? activeMainTabIndex : 0;
  
  // Initialize with reasonable defaults to prevent division by zero
  const [dimensions, setDimensions] = useState<TabBarDimensions>({
    height: 70,
    width: SCREEN_WIDTH * (1 - TAB_BAR_MARGIN * 2)
  });
  
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  const buttonWidth = dimensions.width / mainTabRoutes.length;
  const tabPositionX = useSharedValue(0);

  // Initialize tab position when component mounts or active tab changes
  useEffect(() => {
    if (isLayoutReady && buttonWidth > 0) {
      const targetPosition = buttonWidth * currentMainTabIndex;
      tabPositionX.value = withSpring(targetPosition, SPRING_CONFIG);
    }
  }, [currentMainTabIndex, buttonWidth, isLayoutReady]);

  const onTabbarLayout = useCallback((e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    
    // Only update if dimensions actually changed to prevent unnecessary re-renders
    setDimensions(prev => {
      if (Math.abs(prev.height - height) > 1 || Math.abs(prev.width - width) > 1) {
        return { height, width };
      }
      return prev;
    });
    
    if (!isLayoutReady) {
      setIsLayoutReady(true);
    }
  }, [isLayoutReady]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabPositionX.value }],
  }));

  const handleTabPress = useCallback((index: number, route: any) => {
    return () => {
      // Animate to new position
      const targetPosition = buttonWidth * index;
      tabPositionX.value = withSpring(targetPosition, SPRING_CONFIG);

      // Handle navigation
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (currentMainTabIndex !== index && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };
  }, [buttonWidth, navigation, currentMainTabIndex, tabPositionX]);

  const handleTabLongPress = useCallback((route: any) => {
    return () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };
  }, [navigation]);

  if (pathname.startsWith('/chat/') && pathname !== '/chat') {
    return null;
  }


  // Don't render until layout is ready to prevent flashing
  if (!isLayoutReady) {
    return (
      <View 
        onLayout={onTabbarLayout} 
        style={[
          styles.tabbar, 
          { marginHorizontal: SCREEN_WIDTH * TAB_BAR_MARGIN }
        ]} 
      />
    );
  }

  return (
    <View 
      onLayout={onTabbarLayout} 
      style={[
        styles.tabbar, 
        { marginHorizontal: SCREEN_WIDTH * TAB_BAR_MARGIN }
      ]}
    >
      {/* Animated Indicator Background */}
      <Animated.View
        style={[
          animatedIndicatorStyle,
          styles.indicator,
          {
            height: INDICATOR_SIZE,
            width: INDICATOR_SIZE,
            left: (buttonWidth - INDICATOR_SIZE) / 2, // Center the circle within each tab
          }
        ]}
        pointerEvents="none"
      />

      {/* Tab Buttons - Only render main tab routes */}
      {mainTabRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 15,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 10,
    shadowOpacity: 0.1,
  },
  indicator: {
    position: 'absolute',
    backgroundColor: '#f5f5dc',
    borderRadius: INDICATOR_SIZE / 2, 
  },
});