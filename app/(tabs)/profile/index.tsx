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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const { width, height } = Dimensions.get('window')

interface ProfileData {
  name?: string
  age?: number
  location_city?: string
  profile_pictures?: string[]
  interests?: string[]
  teasers?: Record<string, string>
  height?: string
  star_sign?: string
  gender?: string
  education?: string
  looking_for?: string
  children?: string
  occupation?: string
  is_verified?: boolean
  is_premium?: boolean
  believes_in_star_signs?: string
  bio?: string; // Added bio parameter
}

const Profile: React.FC = () => {
  const { profile, signOut, fetchProfile } = useAuthStore()
  const [activePhoto, setActivePhoto] = useState(0)
  const scrollY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const photos = useMemo(() =>
    profile?.profile_pictures || [],
    [profile?.profile_pictures]
  )

  const handleEditProfile = useCallback(() => {
    // router.push('/profile/edit') // Uncomment if you have an edit profile route
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
    router.replace('/')
  }, [signOut])

  const renderPhotoCarousel = () => {
    if (!photos.length) {
      return (
        <View style={styles.noPhotosContainer}>
          <View style={styles.noPhotosIconBackground}>
            <Ionicons name="camera-outline" size={32} color="#71717a" />
          </View>
          <Text style={styles.noPhotosText}>No photos yet</Text>
        </View>
      )
    }

    return (
      <View style={styles.photoCarouselContainer}>
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
              listener: (event: any) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width)
                setActivePhoto(index)
              }
            }
          )}
        >
          {photos.map((uri: string, idx: number) => (
            <Animated.View
              key={idx}
              style={styles.photoSlide}
            >
              <Image
                source={{ uri }}
                style={styles.profileImage}
                contentFit="cover"
                transition={400}
              />
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                style={styles.imageGradient}
              />
            </Animated.View>
          ))}
        </Animated.ScrollView>

        {/* Photo indicators - minimal dots */}
        {photos.length > 1 && (
          <View style={styles.photoIndicatorsContainer}>
            {photos.map((_: string, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.photoIndicatorBase,
                  idx === activePhoto ? styles.photoIndicatorActive : styles.photoIndicatorInactive
                ]}
              />
            ))}
          </View>
        )}

        {/* Floating action buttons */}
        <View style={styles.floatingButtonsContainer}>
          <TouchableOpacity onPress={() => router.replace('../swipe')} style={styles.floatingButtonTouchable}>
            <BlurView intensity={20} style={styles.floatingButtonBlur}>
              <Ionicons name="chevron-back" size={20} color="white" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.floatingButtonsRightGroup}>
            <TouchableOpacity onPress={handleShare} style={styles.floatingButtonTouchable}>
              <BlurView intensity={20} style={styles.floatingButtonBlur}>
                <Ionicons name="share-outline" size={18} color="white" />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingButtonTouchable}>
              <BlurView intensity={20} style={styles.floatingButtonBlur}>
                <Ionicons name="heart-outline" size={18} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name overlay - clean typography */}
        <View style={styles.nameOverlayContainer}>
          <Text style={styles.nameText}>
            {profile?.name || 'Your Name'}
          </Text>
          <View style={styles.ageLocationContainer}>
            <Text style={styles.ageText}>
              {profile?.age || '--'}
            </Text>
            {profile?.location_city && (
              <>
                <View style={styles.dotSeparator} />
                <Text style={styles.locationText}>
                  {profile.location_city}
                </Text>
              </>
            )}
          </View>
          {profile?.bio && (
            <Text style={styles.bioText}>
              {profile.bio}
            </Text>
          )}
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
      { key: 'occupation', icon: 'briefcase-outline', label: 'Work', value: profile?.occupation },
      { key: 'children', icon: 'people-outline', label: 'Children', value: profile?.children },
    ].filter(item => item.value)

    return (
      <View style={styles.infoSectionContainer}>
        {items.length > 0 && (
          <View style={styles.infoItemsWrapper}>
            <View style={styles.infoItemsRow}>
              {items.map((item, idx) => (
                <View key={item.key} style={styles.infoItemColumn}>
                  <View style={styles.infoItemCard}>
                    <View style={styles.infoItemHeader}>
                      <Ionicons name={item.icon as any} size={14} color="#52525b" />
                      <Text style={styles.infoItemLabel}>
                        {item.label}
                      </Text>
                    </View>
                    <Text style={styles.infoItemValue}>
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
      <View style={styles.interestsContainer}>
        <Text style={styles.interestsTitle}>Interests</Text>
        <View style={styles.interestsTagsContainer}>
          {interests.map((interest: string, idx: number) => (
            <View
              key={idx}
              style={styles.interestTag}
            >
              <Text style={styles.interestTagText}>{interest}</Text>
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
      <View style={styles.aboutContainer}>
        <Text style={styles.aboutTitle}>About</Text>
        <View style={styles.aboutContentContainer}>
          {entries.map(([prompt, answer], idx: number) => (
            <View key={idx} style={styles.aboutCard}>
              <Text style={styles.aboutPrompt}>
                {prompt}
              </Text>
              <Text style={styles.aboutAnswer}>
                {answer}
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.editProfileButtonTouchable} onPress={handleEditProfile}>
        <View style={styles.editProfileButton}>
          <Text style={styles.editProfileButtonText}>
            Edit Profile
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleShare} style={styles.shareProfileButtonTouchable}>
        <View style={styles.shareProfileButton}>
          <Text style={styles.shareProfileButtonText}>
            Share Profile
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButtonTouchable}>
        <View style={styles.signOutButton}>
          <Text style={styles.signOutButtonText}>
            Sign Out
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {renderPhotoCarousel()}

        {/* Subtle gradient transition */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', '#000000']}
          style={styles.gradientTransition}
        />

        <View style={styles.contentSection}>
          {renderInfoSection()}
          {renderInterests()}
          {renderAbout()}
          {renderActions()}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollView: {
    flex: 1,
  },
  noPhotosContainer: {
    height: height * 0.8,
    backgroundColor: '#0a0a0a', // bg-zinc-950
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(39, 39, 42, 0.5)', // bg-zinc-800/50
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noPhotosText: {
    color: '#a1a1aa', // text-zinc-400
    fontSize: 16, // text-base
  },
  photoCarouselContainer: {
    height: height * 0.8,
  },
  photoSlide: {
    width: width,
    position: 'relative',
  },
  profileImage: {
    width: width,
    height: height * 0.8,
    backgroundColor: '#18181b', // bg-zinc-900
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  photoIndicatorsContainer: {
    position: 'absolute',
    top: 64, // top-16
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  photoIndicatorBase: {
    height: 2, // h-0.5
    marginHorizontal: 2, // mx-0.5
    borderRadius: 9999, // rounded-full
  },
  photoIndicatorActive: {
    backgroundColor: 'white', // bg-white
    width: 32, // w-8
  },
  photoIndicatorInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)', // bg-white/30
    width: 16, // w-4
  },
  floatingButtonsContainer: {
    position: 'absolute',
    top: 56, // top-14
    left: 16, // left-4
    right: 16, // right-4
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingButtonTouchable: {
    // No specific styles needed for TouchableOpacity itself, styles are applied to BlurView
  },
  floatingButtonBlur: {
    width: 44, // w-11
    height: 44, // h-11
    borderRadius: 22, // rounded-full (half of width/height for perfect circle)
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.1)', 
    backgroundColor: 'rgba(0,0,0,0.4)',
    overflow: 'hidden', // Ensure blur doesn't extend beyond border radius
  },
  floatingButtonsRightGroup: {
    flexDirection: 'row',
    gap: 12, // space-x-3
  },
  nameOverlayContainer: {
    position: 'absolute',
    bottom: 48, // bottom-12
    left: 32, // left-8
    right: 32, // right-8
  },
  nameText: {
    color: 'white',
    fontSize: 36, // text-4xl
    fontWeight: '200', // font-thin
    marginBottom: 8, // mb-2
    letterSpacing: -0.5, // tracking-tight
  },
  ageLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageText: {
    color: 'rgba(255,255,255,0.9)', // text-white/90
    fontSize: 20, // text-xl
    fontWeight: '100', // font-extralight
    marginRight: 24, // mr-6
  },
  dotSeparator: {
    width: 6, // w-1.5
    height: 6, // h-1.5
    backgroundColor: 'rgba(255,255,255,0.5)', // bg-white/50
    borderRadius: 3, // rounded-full
    marginRight: 24, // mr-6
  },
  locationText: {
    color: 'rgba(255,255,255,0.8)', // text-white/80
    fontSize: 18, // text-lg
    fontWeight: '100', // font-extralight
    letterSpacing: 0.5, // tracking-wide
  },
  bioText: {
    color: 'rgba(255,255,255,0.8)', // text-white/80
    fontSize: 16, // text-base
    fontWeight: '300', // font-light
    marginTop: 8, // Added margin top for spacing
    lineHeight: 24, // leading-loose
    letterSpacing: 0.5, // tracking-wide
  },
  gradientTransition: {
    height: 80, // h-20
    marginTop: -80, // -mt-20
    pointerEvents: 'none',
  },
  contentSection: {
    backgroundColor: 'black',
  },
  infoSectionContainer: {
    paddingHorizontal: 32, // px-8
    paddingTop: 48, // pt-12
  },
  infoItemsWrapper: {
    marginBottom: 48, // mb-12
  },
  infoItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8, // -mx-2
  },
  infoItemColumn: {
    width: '50%', // w-1/2
    paddingHorizontal: 8, // px-2
    marginBottom: 16, // mb-4
  },
  infoItemCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.4)', // bg-zinc-900/40
    borderColor: 'rgba(39, 39, 42, 0.3)', // border border-zinc-800/30
    borderWidth: 1,
    borderRadius: 24, // rounded-3xl
    padding: 24, // p-6
    height: 96, // h-24
    justifyContent: 'center',
  },
  infoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // mb-1
  },
  infoItemLabel: {
    color: '#52525b', // text-zinc-500
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    marginLeft: 8, // ml-2
    textTransform: 'uppercase', // uppercase
    letterSpacing: 2, // tracking-widest
  },
  infoItemValue: {
    color: 'white',
    fontSize: 16, // text-base
    fontWeight: '300', // font-light
    marginTop: 8, // mt-2
  },
  interestsContainer: {
    paddingHorizontal: 32, // px-8
    marginBottom: 48, // mb-12
  },
  interestsTitle: {
    color: 'white',
    fontSize: 20, // text-xl
    fontWeight: '100', // font-extralight
    marginBottom: 24, // mb-6
    letterSpacing: 0.5, // tracking-wide
  },
  interestsTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8, // -m-2
  },
  interestTag: {
    backgroundColor: 'rgba(39, 39, 42, 0.4)', // bg-zinc-800/40
    borderColor: 'rgba(63, 63, 70, 0.2)', // border border-zinc-700/20
    borderWidth: 1,
    borderRadius: 9999, // rounded-full
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
    margin: 8, // m-2
  },
  interestTagText: {
    color: '#f4f4f5', // text-zinc-100
    fontSize: 14, // text-sm
    fontWeight: '300', // font-light
    letterSpacing: 0.5, // tracking-wide
  },
  aboutContainer: {
    paddingHorizontal: 32, // px-8
    marginBottom: 48, // mb-12
  },
  aboutTitle: {
    color: 'white',
    fontSize: 20, // text-xl
    fontWeight: '100', // font-extralight
    marginBottom: 24, // mb-6
    letterSpacing: 0.5, // tracking-wide
  },
  aboutContentContainer: {
    gap: 24, // space-y-6
  },
  aboutCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.25)', // bg-zinc-900/25
    borderColor: 'rgba(39, 39, 42, 0.2)', // border border-zinc-800/20
    borderWidth: 1,
    borderRadius: 24, // rounded-3xl
    padding: 32, // p-8
  },
  aboutPrompt: {
    color: '#a1a1aa', // text-zinc-400
    fontSize: 14, // text-sm
    fontWeight: '300', // font-light
    marginBottom: 16, // mb-4
    fontStyle: 'italic', // italic
    letterSpacing: 0.5, // tracking-wide
  },
  aboutAnswer: {
    color: 'white',
    fontSize: 16, // text-base
    fontWeight: '300', // font-light
    lineHeight: 28, // leading-loose
    letterSpacing: 0.5, // tracking-wide
  },
  actionsContainer: {
    paddingHorizontal: 32, // px-8
    paddingBottom: 64, // pb-16
    paddingTop: 16, // pt-4
  },
  editProfileButtonTouchable: {
    marginBottom: 16, // mb-4
  },
  editProfileButton: {
    backgroundColor: 'white',
    borderRadius: 9999, // rounded-full
    paddingVertical: 20, // py-5
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  editProfileButtonText: {
    color: 'black',
    textAlign: 'center',
    fontWeight: '500', // font-medium
    fontSize: 16, // text-base
    letterSpacing: 0.5, // tracking-wide
  },
  shareProfileButtonTouchable: {
    marginBottom: 16, // mb-4
  },
  shareProfileButton: {
    backgroundColor: 'rgba(39, 39, 42, 0.3)', // bg-zinc-800/30
    borderColor: 'rgba(82, 82, 91, 0.2)', // border border-zinc-600/20
    borderWidth: 1,
    borderRadius: 9999, // rounded-full
    paddingVertical: 20, // py-5
  },
  shareProfileButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '300', // font-light
    fontSize: 16, // text-base
    letterSpacing: 0.5, // tracking-wide
  },
  signOutButtonTouchable: {
    // No specific styles needed for TouchableOpacity itself
  },
  signOutButton: {
    borderRadius: 9999, // rounded-full
    paddingVertical: 20, // py-5
  },
  signOutButtonText: {
    color: '#71717a', // text-zinc-500
    textAlign: 'center',
    fontWeight: '300', // font-light
    fontSize: 16, // text-base
    letterSpacing: 1, // tracking-wider
    marginBottom: 40, // mb-10
  },
})

export default Profile
