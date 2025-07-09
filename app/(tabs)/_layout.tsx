import StoryViewerModal from '@/components/StoryViewer'
import { TabBar } from '@/components/tabBar'
import { AuthGuard } from '@/context/AuthGaurd'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

const TabsLayout = () => {
  return (
    <AuthGuard requireAuth={true}>
      <QueryClientProvider client={queryClient}>
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
          <Tabs.Screen 
            name="home"
            options={{
              headerShown: false,
              title: "Home",
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
              ),
            }}
          />
          
          <Tabs.Screen 
            name="chat"
            options={{
              headerShown: false,
              title: "Chat",
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={size} color={color} />
              ),
            }}
          />
          
          <Tabs.Screen 
            name="swipe"
            options={{
              headerShown: false,
              title: "Swipe",
              tabBarIcon: ({ focused, color, size }) => (
                <MaterialCommunityIcons name={focused ? "gesture-swipe" : "gesture-swipe"} size={size} color={color} />
              ),
            }}
          />
          
          <Tabs.Screen 
            name="likes"
            options={{
              headerShown: false,
              title: "Matches",
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
              ),
            }}
          />
          
          <Tabs.Screen 
            name="profile"
            options={{
              headerShown: false,
              title: "Profile",
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
              ),
            }}
          />
        </Tabs>
        <StoryViewerModal />
      </QueryClientProvider>
    </AuthGuard>
  )
}

export default TabsLayout