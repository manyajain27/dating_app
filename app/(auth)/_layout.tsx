import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { AuthGuard } from '@/context/AuthGaurd'

const AuthLayout = () => {
  return (
    <AuthGuard requireAuth={false}>
      <Stack
      screenOptions={{
          headerShown: false,
      }}
      >
          <Stack.Screen name='AuthScreen' />
          <Stack.Screen name='SignIn' />
          <Stack.Screen name='SignUp' />
      </Stack>
    </AuthGuard>
  )
}

export default AuthLayout