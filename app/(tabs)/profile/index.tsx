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
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextStyle,
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
  bio?: string
}

const Profile: React.FC = () => {
  const { profile, signOut, fetchProfile } = useAuthStore()
  const [activePhoto, setActivePhoto] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const scrollY = useRef(new Animated.Value(0)).current
  const galleryRef = useRef<FlatList>(null)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const photos = useMemo(() =>
    profile?.profile_pictures || [],
    [profile?.profile_pictures]
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
    router.replace('/')
  }, [signOut])

  const openGallery = useCallback((index: number) => {
    setSelectedImageIndex(index)
    setIsGalleryOpen(true)
    setTimeout(() => {
      galleryRef.current?.scrollToIndex({ index, animated: false })
    }, 100)
  }, [])

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false)
  }, [])

  const renderPhotoCarousel = () => {
    if (!photos.length) {
      return (
        <View style={styles.noPhotosContainer}>
          <View style={styles.noPhotosIconBackground}>
            <Ionicons name="camera-outline" size={32} color="#f8b2ca" />
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
            <TouchableOpacity
              key={idx}
              style={styles.photoSlide}
              onPress={() => openGallery(idx)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri }}
                style={styles.profileImage}
                contentFit="cover"
                transition={400}
              />
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(248,178,202,0.1)', 'rgba(248,178,202,0.1)']}
                style={styles.imageGradient}
              />
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>

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

        <View style={styles.floatingButtonsContainer}>
          <TouchableOpacity onPress={() => router.replace('../swipe')} style={styles.floatingButtonTouchable}>
            <BlurView intensity={20} style={styles.floatingButtonBlur}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.floatingButtonsRightGroup}>
            <TouchableOpacity onPress={handleShare} style={styles.floatingButtonTouchable}>
              <BlurView intensity={20} style={styles.floatingButtonBlur}>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nameOverlayContainer}>
          <View style={styles.nameVerifiedContainer}>
            <Text style={styles.nameText}>
              {profile?.name || 'Your Name'}
            </Text>
            {profile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </View>
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

    if (items.length === 0) return null

    return (
      <View style={styles.infoSectionContainer}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <View style={styles.infoItemsWrapper}>
          <View style={styles.infoItemsRow}>
            {items.map((item, idx) => (
              <View key={item.key} style={styles.infoItemColumn}>
                <View style={styles.infoItemCard}>
                  <View style={styles.infoItemHeader}>
                    <Ionicons name={item.icon as any} size={14} color="#f8b2ca" />
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
      </View>
    )
  }

  const renderInterests = () => {
    const interests = profile?.interests || []
    if (!interests.length) return null

    return (
      <View style={styles.interestsContainer}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsTagsContainer}>
          {interests.map((interest: string, idx: number) => (
            <View key={idx} style={styles.interestTag}>
              <Text style={styles.interestTagText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  const renderPhotoGallery = () => {
    if (!photos.length) return null

    return (
      <View style={styles.galleryContainer}>
        <View style={styles.galleryHeader}>
          <Text style={styles.sectionTitle}>Gallery</Text>
          <TouchableOpacity onPress={() => openGallery(0)}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.galleryGrid}>
          {photos.slice(0, 6).map((uri: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.galleryItem,
                idx === 0 && styles.galleryItemLarge,
                idx > 0 && styles.galleryItemSmall
              ]}
              onPress={() => openGallery(idx)}
            >
              <Image
                source={{ uri }}
                style={styles.galleryImage}
                contentFit="cover"
              />
              {idx === 5 && photos.length > 6 && (
                <View style={styles.galleryOverlay}>
                  <Text style={styles.galleryOverlayText}>+{photos.length - 6}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  const renderFullScreenGallery = () => {
    const renderGalleryItem = ({ item, index }: { item: string; index: number }) => (
      <View style={styles.fullScreenImageContainer}>
        <Image
          source={{ uri: item }}
          style={styles.fullScreenImage}
          contentFit="contain"
        />
      </View>
    )

    return (
      <Modal
        visible={isGalleryOpen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeGallery}
      >
        <SafeAreaView style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity onPress={closeGallery} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.galleryCounter}>
              {selectedImageIndex + 1} of {photos.length}
            </Text>
          </View>
          <FlatList
            ref={galleryRef}
            data={photos}
            renderItem={renderGalleryItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width)
              setSelectedImageIndex(index)
            }}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        </SafeAreaView>
      </Modal>
    )
  }

  const renderAbout = () => {
    const teasers = profile?.teasers || {}
    const entries = Object.entries(teasers)
    if (!entries.length) return null

    return (
      <View style={styles.aboutContainer}>
        <Text style={styles.sectionTitle}>About</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {renderPhotoCarousel()}

        <LinearGradient
          colors={['transparent', 'rgba(248,178,202,0.1)', '#ffffff']}
          style={styles.gradientTransition}
        />

        <View style={styles.contentSection}>
          {profile?.bio && (
            <>
              <Text style={styles.bioLabel}>Bio</Text>
              <Text style={styles.simpleBioText}>{profile.bio}</Text>
            </>
          )}
          {renderInfoSection()}
          {renderInterests()}
          {renderPhotoGallery()}
          {renderAbout()}
          {renderActions()}
        </View>
      </ScrollView>

      {renderFullScreenGallery()}
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  noPhotosContainer: {
    height: height * 0.5,
    backgroundColor: '#f6f6f8', // light neutral
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(180, 180, 200, 0.15)', // lighter neutral
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noPhotosText: {
    color: '#be185d',
    fontSize: 16,
  },
  photoCarouselContainer: {
    height: height * 0.5,
  },
  photoSlide: {
    width: width,
    position: 'relative',
  },
  profileImage: {
    width: width,
    height: height * 0.5,
    backgroundColor: '#f6f6f8',
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
    top: 64,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  photoIndicatorBase: {
    height: 3,
    marginHorizontal: 2,
    borderRadius: 9999,
  },
  photoIndicatorActive: {
    backgroundColor: '#f8b2ca',
    width: 32,
  },
  photoIndicatorInactive: {
    backgroundColor: 'rgba(248,178,202,0.4)',
    width: 16,
  },
  floatingButtonsContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingButtonTouchable: {},
  floatingButtonBlur: {
    width: 48, // increased size
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(248,178,202,0.2)',
    backgroundColor: 'rgba(30,30,30,0.75)', // darker, more opaque background
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingButtonsRightGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  nameOverlayContainer: {
    position: 'absolute',
    bottom: 48,
    left: 32,
    right: 32,
  },
  nameVerifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginRight: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  verifiedBadge: {
    width: 24, // larger badge
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6', // blue
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  ageLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 24,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  dotSeparator: {
    width: 6,
    height: 6,
    backgroundColor: '#f8b2ca',
    borderRadius: 3,
    marginRight: 24,
  },
  locationText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.5,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gradientTransition: {
    height: 80,
    marginTop: -80,
    pointerEvents: 'none',
  },
  contentSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  bioContainer: {
    backgroundColor: '#f6f6f8',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  bioLabel: {
    color: '#333333',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    marginTop: 24,
  },
  bioText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  simpleBioText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 24,
    marginTop: 8,
    textAlign: 'left',
  } as TextStyle,
  sectionTitle: {
    color: '#333333',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  infoSectionContainer: {
    marginBottom: 32,
  },
  infoItemsWrapper: {
    marginBottom: 16,
  },
  infoItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItemColumn: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  infoItemCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    height: 80,
    justifyContent: 'center',
    shadowColor: '#f8b2ca',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoItemLabel: {
    color: '#be185d',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoItemValue: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  interestsContainer: {
    marginBottom: 32,
  },
  interestsTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -6,
  },
  interestTag: {
    backgroundColor: '#f6f6f8',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 6,
  },
  interestTagText: {
    color: '#be185d',
    fontSize: 13,
    fontWeight: '500',
  },
  galleryContainer: {
    marginBottom: 32,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  seeAllText: {
    color: '#f8b2ca',
    fontSize: 14,
    fontWeight: '500',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -4,
  },
  galleryItem: {
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryItemLarge: {
    width: (width - 48) * 0.6,
    height: (width - 48) * 0.6,
  },
  galleryItemSmall: {
    width: (width - 48) * 0.36,
    height: (width - 48) * 0.36,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f6f6f8',
  },
  galleryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59,130,246,0.8)', // blue accent for overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryOverlayText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  closeButton: {
    padding: 8,
  },
  galleryCounter: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  fullScreenImageContainer: {
    width: width,
    height: height - 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height - 100,
  },
  aboutContainer: {
    marginBottom: 32,
  },
  aboutContentContainer: {
    gap: 16,
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#f8b2ca',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aboutPrompt: {
    color: '#be185d',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  aboutAnswer: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  actionsContainer: {
    paddingBottom: 64,
    paddingTop: 16,
  },
  editProfileButtonTouchable: {
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: '#f8b2ca', // keep pink accent for main button
    borderRadius: 9999,
    paddingVertical: 16,
    shadowColor: '#f8b2ca',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  editProfileButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  shareProfileButtonTouchable: {
    marginBottom: 16,
  },
  shareProfileButton: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1.5,
    borderRadius: 9999,
    paddingVertical: 16,
  },
  shareProfileButtonText: {
    color: '#f8b2ca',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  signOutButtonTouchable: {},
  signOutButton: {
    borderRadius: 9999,
    paddingVertical: 16,
  },
  signOutButtonText: {
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 40,
  },
})

export default Profile