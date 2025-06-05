import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { TabBar } from '@/components/tabBar'

const TabsLayout = () => {
  return (
    <Tabs
    tabBar={props => <TabBar {...props} />}
    screenOptions={{
        tabBarActiveTintColor: '#16213e',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0,
            elevation: 0,
        },
        headerShown: false,
        tabBarLabelStyle: {
            fontSize: 12,
        },
    }}
    >
        <Tabs.Screen name="home"
          options={{
            headerShown: false,
            title: "Home",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            ),
            }} 
        />
        <Tabs.Screen name="chat"
          options={{
            headerShown: false,
            title: "Chat",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
            ),
            }} 
        />
        <Tabs.Screen name="swipe"
          options={{
            headerShown: false,
            title: "Swipe",
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons name={focused ? "gesture-swipe" : "gesture-swipe"} size={size} color={color} />
            ),
            }} 
        />
        <Tabs.Screen name="likes"
          options={{
            headerShown: false,
            title: "Matches",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
            ),
            }} 
        />
        <Tabs.Screen name="profile"
          options={{
            headerShown: false,
            title: "Profile",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
            }} 
        />
    </Tabs>
  )
}

export default TabsLayout