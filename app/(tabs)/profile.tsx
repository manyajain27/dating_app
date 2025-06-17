import { useAuthStore } from '@/store/authStore'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

const { width, height } = Dimensions.get('window')

interface ProfileData {
  name?: string
  age?: number
  location_city?: string
  profile_pictures?: string[]
  photos?: string[]
  interests?: string[]
  teasers?: Record<string, string>
  height?: string
  star_sign?: string
  gender?: string
  education?: string
  looking_for?: string
  children?: string
}

const Profile: React.FC = () => {
  const { profile, signOut, fetchProfile } = useAuthStore()
  const [activePhoto, setActivePhoto] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollY = useRef(new Animated.Value(0)).current
  const headerOpacity = useRef(new Animated.Value(0)).current
  const photoScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const photos = useMemo(() => 
    profile?.profile_pictures || profile?.photos || [], 
    [profile?.profile_pictures, profile?.photos]
  )

  const handleEditProfile = useCallback(() => {
    // router.push('/profile/edit')
  }, [])

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Meet ${profile?.name || 'someone amazing'} ✨`,
        title: 'Share Profile'
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }, [profile?.name])

  const handleSignOut = useCallback(async () => {
    await signOut()
    router.replace('/(auth)/AuthScreen')
  }, [signOut])

  const renderPhotoCarousel = () => {
    if (!photos.length) {
      return (
        <View style={{ height: height * 0.8 }} className="bg-zinc-950 justify-center items-center">
          <View className="w-20 h-20 rounded-full bg-zinc-800/50 items-center justify-center mb-4">
            <Ionicons name="camera-outline" size={32} color="#71717a" />
          </View>
          <Text className="text-zinc-400 text-base">No photos yet</Text>
        </View>
      )
    }

    return (
      <View style={{ height: height * 0.8 }}>
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={1}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollY } } }],
            { 
              useNativeDriver: false,
              listener: (event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width)
                setActivePhoto(index)
              }
            }
          )}
        >
          {photos.map((uri, idx) => (
            <Animated.View 
              key={idx} 
              style={{ width }}
              className="relative"
            >
              <Image
                source={{ uri }}
                style={{ width, height: height * 0.8 }}
                contentFit="cover"
                className="bg-zinc-900"
                transition={400}
              />
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                style={{ position: 'absolute', inset: 0 }}
              />
            </Animated.View>
          ))}
        </Animated.ScrollView>

        {/* Photo indicators - minimal dots */}
        {photos.length > 1 && (
          <View className="absolute top-16 inset-x-0 flex-row justify-center">
            {photos.map((_, idx) => (
              <View
                key={idx}
                className={`h-0.5 mx-0.5 rounded-full transition-all duration-300 ${
                  idx === activePhoto ? 'bg-white w-8' : 'bg-white/30 w-4'
                }`}
              />
            ))}
          </View>
        )}

        {/* Floating action buttons */}
        <View className="absolute top-14 right-4 space-y-3">
          <TouchableOpacity onPress={handleShare}>
            <BlurView intensity={20} className="w-11 h-11 rounded-full items-center justify-center border border-white/10">
              <Ionicons name="share-outline" size={18} color="white" />
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity>
            <BlurView intensity={20} className="w-11 h-11 rounded-full items-center justify-center border border-white/10">
              <Ionicons name="heart-outline" size={18} color="white" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Name overlay - clean typography */}
        <View className="absolute bottom-12 left-8 right-8">
          <Text className="text-white text-4xl font-thin mb-2 tracking-tight">
            {profile?.name || 'Your Name'}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-white/90 text-xl font-extralight mr-6">
              {profile?.age || '--'}
            </Text>
            {profile?.location_city && (
              <>
                <View className="w-1.5 h-1.5 bg-white/50 rounded-full mr-6" />
                <Text className="text-white/80 text-lg font-extralight tracking-wide">
                  {profile.location_city}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderInfoSection = () => {
    const items = [
      { key: 'height', icon: 'resize-outline', label: 'Height', value: profile?.height },
      { key: 'star_sign', icon: 'star-outline', label: 'Sign', value: profile?.star_sign },
      { key: 'education', icon: 'school-outline', label: 'Education', value: profile?.education },
      { key: 'looking_for', icon: 'search-outline', label: 'Looking for', value: profile?.looking_for },
    ].filter(item => item.value)

    return (
      <View className="px-8 pt-12">
        {items.length > 0 && (
          <View className="mb-12">
            <View className="flex-row flex-wrap -mx-2">
              {items.map((item, idx) => (
                <View key={item.key} className="w-1/2 px-2 mb-4">
                  <View className="bg-zinc-900/40 border border-zinc-800/30 rounded-3xl p-6 h-24 justify-center">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name={item.icon as any} size={14} color="#52525b" />
                      <Text className="text-zinc-500 text-xs font-medium ml-2 uppercase tracking-widest">
                        {item.label}
                      </Text>
                    </View>
                    <Text className="text-white text-base font-light mt-2">
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderInterests = () => {
    const interests = profile?.interests || []
    if (!interests.length) return null

    return (
      <View className="px-8 mb-12">
        <Text className="text-white text-xl font-extralight mb-6 tracking-wide">Interests</Text>
        <View className="flex-row flex-wrap -m-2">
          {interests.map((interest, idx) => (
            <View
              key={idx}
              className="bg-zinc-800/40 border border-zinc-700/20 rounded-full px-6 py-3 m-2"
            >
              <Text className="text-zinc-100 text-sm font-light tracking-wide">{interest}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderAbout = () => {
    const teasers = profile?.teasers || {}
    const entries = Object.entries(teasers)
    if (!entries.length) return null

    return (
      <View className="px-8 mb-12">
        <Text className="text-white text-xl font-extralight mb-6 tracking-wide">About</Text>
        <View className="space-y-6">
          {entries.map(([prompt, answer], idx) => (
            <View key={idx} className="bg-zinc-900/25 border border-zinc-800/20 rounded-3xl p-8">
              <Text className="text-zinc-400 text-sm font-light mb-4 italic tracking-wide">
                {prompt}
              </Text>
              <Text className="text-white text-base font-light leading-loose tracking-wide">
                {answer}
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderActions = () => (
    <View className="px-8 pb-16 pt-4">
      <TouchableOpacity className="mb-4" onPress={handleEditProfile}>
        <View className="bg-white rounded-full py-5 shadow-2xl" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 12
        }}>
          <Text className="text-black text-center font-medium text-base tracking-wide">
            Edit Profile
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleShare} className="mb-4">
        <View className="bg-zinc-800/30 border border-zinc-600/20 rounded-full py-5">
          <Text className="text-white text-center font-light text-base tracking-wide">
            Share Profile
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignOut}>
        <View className="rounded-full py-5">
          <Text className="text-zinc-500 text-center font-light text-base tracking-wider mb-10">
            Sign Out
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {renderPhotoCarousel()}
        
        {/* Subtle gradient transition */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', '#000000']}
          className="h-20 -mt-20 pointer-events-none"
        />

        <View className="bg-black">
          {renderInfoSection()}
          {renderInterests()}
          {renderAbout()}
          {renderActions()}
        </View>
      </ScrollView>
    </View>
  )
}

export default Profile