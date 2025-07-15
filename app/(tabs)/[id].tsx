import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/chatStore';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  gender: string;
  interested_in: string;
  location_city: string;
  location_state: string;
  location_country: string;
  height: string;
  profile_pictures: string[];
  interests: string[];
  education: string;
  occupation: string;
  looking_for: string;
  is_verified: boolean;
  is_premium: boolean;
  star_sign: string;
  believes_in_star_signs: string;
  children: string;
  teasers: Record<string, string>;
}

const ProfileScreen = () => {
  const { id } = useLocalSearchParams();
  const { createConversation } = useChatStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const galleryRef = useRef<FlatList>(null);

  const fetchProfile = useCallback(async (useCache = true) => {
    // Check cache first if useCache is true
    if (useCache && profile && profile.id === id) {
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
      return;
    }

    setProfile({
      id: data.id,
      name: data.name || '',
      age: data.age || 0,
      bio: data.bio || '',
      gender: data.gender || '',
      interested_in: data.interested_in || '',
      location_city: data.location_city || '',
      location_state: data.location_state || '',
      location_country: data.location_country || '',
      height: data.height || '',
      profile_pictures: data.profile_pictures || [],
      interests: data.interests || [],
      education: data.education || '',
      occupation: data.occupation || '',
      looking_for: data.looking_for || '',
      is_verified: data.is_verified || false,
      is_premium: data.is_premium || false,
      star_sign: data.star_sign || '',
      believes_in_star_signs: data.believes_in_star_signs || '',
      children: data.children || '',
      teasers: data.teasers || {}
    });
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
    }, [fetchProfile])
  );

  useEffect(() => {
    fetchProfile(false);
  }, [id]);

  const photos = useMemo(() =>
    profile?.profile_pictures || [],
    [profile?.profile_pictures]
  );

  const handleShare = useCallback(async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Meet ${profile.name} ✨`,
        title: 'Share Profile'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [profile]);

  const handleTeaserReply = useCallback(async (teaser: string) => {
    if (!profile) return;

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        Alert.alert('Error', 'You need to be logged in to send messages.');
        return;
      }

      const { data: existingMatch, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUser.user.id})`)
        .maybeSingle();

      if (matchError) {
        console.error('Error checking match:', matchError);
        Alert.alert('Error', 'Unable to check match status. Please try again.');
        return;
      }

      let matchId = existingMatch?.id;

      if (!matchId) {
        const { data: newMatch, error: createMatchError } = await supabase
          .from('matches')
          .insert({
            user1_id: currentUser.user.id < profile.id ? currentUser.user.id : profile.id,
            user2_id: currentUser.user.id < profile.id ? profile.id : currentUser.user.id,
            matched_at: new Date().toISOString(),
            is_super_like: false
          })
          .select('id')
          .single();

        if (createMatchError) {
          console.error('Error creating match:', createMatchError);
          Alert.alert('Error', 'Unable to create match. Please try again.');
          return;
        }

        matchId = newMatch.id;
      }

      const conversationId = await createConversation(matchId);

      if (conversationId) {
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: conversationId,
            userName: profile.name,
            userImage: profile.profile_pictures[0] || '',
            teaser
          }
        });
      } else {
        Alert.alert('Error', 'Unable to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error handling teaser reply:', error);
      Alert.alert('Error', 'Unable to send message. Please try again.');
    }
  }, [profile, createConversation]);

  const handleLike = useCallback(async () => {
    if (!profile) return;

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        Alert.alert('Error', 'You need to be logged in to like profiles.');
        return;
      }

      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUser.user.id})`)
        .maybeSingle();

      if (existingMatch) {
        Alert.alert('Already Matched!', 'You can now message this person.');
        return;
      }

      const { data: newMatch, error: createMatchError } = await supabase
        .from('matches')
        .insert({
          user1_id: currentUser.user.id < profile.id ? currentUser.user.id : profile.id,
          user2_id: currentUser.user.id < profile.id ? profile.id : currentUser.user.id,
          matched_at: new Date().toISOString(),
          is_super_like: false
        })
        .select('id')
        .single();

      if (createMatchError) {
        console.error('Error creating match:', createMatchError);
        Alert.alert('Error', 'Unable to like profile. Please try again.');
        return;
      }

      Alert.alert('It\'s a Match!', 'You can now start chatting!');
    } catch (error) {
      console.error('Error liking profile:', error);
      Alert.alert('Error', 'Unable to like profile. Please try again.');
    }
  }, [profile]);

  const handleMessage = useCallback(async () => {
    if (!profile) return;

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        Alert.alert('Error', 'You need to be logged in to send messages.');
        return;
      }

      const { data: existingMatch, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUser.user.id})`)
        .maybeSingle();

      if (matchError) {
        console.error('Error checking match:', matchError);
        Alert.alert('Error', 'Unable to check match status. Please try again.');
        return;
      }

      if (!existingMatch) {
        Alert.alert('No Match Yet', 'You need to match with this person first to send a message.');
        return;
      }

      const conversationId = await createConversation(existingMatch.id);

      if (conversationId) {
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: conversationId,
            userName: profile.name,
            userImage: profile.profile_pictures[0] || ''
          }
        });
      } else {
        Alert.alert('Error', 'Unable to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Error', 'Unable to open chat. Please try again.');
    }
  }, [profile, createConversation]);

  const openGallery = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
    setTimeout(() => {
      galleryRef.current?.scrollToIndex({ index, animated: false });
    }, 100);
  }, []);

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  const renderPhotoCarousel = () => {
    if (!photos.length) {
      return (
        <View style={styles.noPhotosContainer}>
          <View style={styles.noPhotosIconBackground}>
            <Ionicons name="camera-outline" size={32} color="#be185d" />
          </View>
          <Text style={styles.noPhotosText}>No photos available</Text>
        </View>
      );
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
              listener: (event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setActivePhoto(index);
              }
            }
          )}
        >
          {photos.map((uri, idx) => (
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
            {photos.map((_, idx) => (
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
          <TouchableOpacity style={styles.floatingButtonTouchable} onPress={() => router.replace('/swipe')}>
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
            <TouchableOpacity style={styles.floatingButtonTouchable}>
              <BlurView intensity={20} style={styles.floatingButtonBlur}>
                <Ionicons name="heart-outline" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nameOverlayContainer}>
          <View style={styles.nameVerifiedContainer}>
            <Text style={styles.nameText}>
              {profile?.name || 'Unknown'}
            </Text>
            {profile?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
            {profile?.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="white" />
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
    );
  };

  const renderInfoSection = () => {
    if (!profile) return null;

    const items = [
      { key: 'height', icon: 'resize-outline', label: 'Height', value: profile.height },
      { key: 'star_sign', icon: 'star-outline', label: 'Sign', value: profile.star_sign },
      { key: 'education', icon: 'school-outline', label: 'Education', value: profile.education },
      { key: 'occupation', icon: 'briefcase-outline', label: 'Work', value: profile.occupation },
      { key: 'looking_for', icon: 'search-outline', label: 'Looking for', value: profile.looking_for },
      { key: 'children', icon: 'people-outline', label: 'Children', value: profile.children },
    ].filter(item => item.value);

    if (items.length === 0) return null;

    return (
      <View style={styles.infoSectionContainer}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <View style={styles.infoItemsWrapper}>
          <View style={styles.infoItemsRow}>
            {items.map((item) => (
              <View key={item.key} style={styles.infoItemColumn}>
                <View style={styles.infoItemCard}>
                  <View style={styles.infoItemHeader}>
                    <Ionicons name={item.icon as any} size={14} color="#be185d" />
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
    );
  };

  const renderInterests = () => {
    const interests = profile?.interests || [];
    if (!interests.length) return null;

    return (
      <View style={styles.interestsContainer}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsTagsContainer}>
          {interests.map((interest, idx) => (
            <View key={idx} style={styles.interestTag}>
              <Text style={styles.interestTagText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPhotoGallery = () => {
    if (!photos.length || photos.length <= 1) return null;

    return (
      <View style={styles.galleryContainer}>
        <View style={styles.galleryHeader}>
          <Text style={styles.sectionTitle}>Gallery</Text>
          <TouchableOpacity onPress={() => openGallery(0)}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.galleryGrid}>
          {photos.slice(0, 6).map((uri, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.galleryItem,
                idx === 0 && styles.galleryItemLarge,
                idx > 0 && styles.galleryItemSmall
              ]}
              onPress={() => openGallery(idx)}
              activeOpacity={0.9}
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
    );
  };

  const renderFullScreenGallery = () => {
    const renderGalleryItem = ({ item }: { item: string }) => (
      <View style={styles.fullScreenImageContainer}>
        <Image
          source={{ uri: item }}
          style={styles.fullScreenImage}
          contentFit="contain"
        />
      </View>
    );

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
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const renderAbout = () => {
    const teasers = profile?.teasers || {};
    const entries = Object.entries(teasers);

    if (!entries.length) return null;

    return (
      <View style={styles.aboutContainer}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutContentContainer}>
          {entries.map(([prompt, answer], idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleTeaserReply(prompt)}
              style={styles.aboutCard}
              activeOpacity={0.7}
            >
              <Text style={styles.aboutPrompt}>
                {prompt}
              </Text>
              <Text style={styles.aboutAnswer}>
                {answer}
              </Text>
              <View style={styles.replyHint}>
                <Ionicons name="chatbubble-outline" size={16} color="#be185d" />
                <Text style={styles.replyHintText}>Tap to reply</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
        <View style={styles.likeButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="heart" size={20} color="white" />
            <Text style={styles.likeButtonText}>
              Like
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
        <View style={styles.messageButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="chatbubble-outline" size={18} color="#be185d" />
            <Text style={styles.messageButtonText}>
              Message
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity>
        <View style={styles.reportButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="flag-outline" size={16} color="#999999" />
            <Text style={styles.reportButtonText}>
              Report
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#be185d" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <View style={styles.notFoundContent}>
          <View style={styles.noPhotosIconBackground}>
            <Ionicons name="person-outline" size={32} color="#999999" />
          </View>
          <Text style={styles.notFoundTitle}>Profile not found</Text>
          <Text style={styles.notFoundSubtitle}>This profile may have been deleted</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          colors={['transparent', 'rgba(255,255,255,0.5)', '#FFFFFF']}
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
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  // Main Container
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#be185d',
    fontWeight: '500',
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundContent: {
    alignItems: 'center',
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  gradientTransition: {
    height: 80,
    marginTop: -60,
    pointerEvents: 'none',
  },

  // Photo Carousel
  photoCarouselContainer: {
    height: height * 0.75,
  },
  noPhotosContainer: {
    height: height * 0.5,
    backgroundColor: '#f6f6f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(180, 180, 200, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noPhotosText: {
    color: '#be185d',
    fontSize: 16,
  },
  photoSlide: {
    width: width,
    position: 'relative',
    
  },
  profileImage: {
    width: width,
    height: height * 0.7,
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
    backgroundColor: 'black',
    width: 32,
  },
  photoIndicatorInactive: {
    backgroundColor: 'gray',
    width: 16,
  },

  // Floating Buttons
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(248,178,202,0.2)',
    backgroundColor: 'rgba(30,30,30,0.75)',
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

  // Name Overlay
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  premiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9500',
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
  profileBio: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0.5,
    marginTop: 16,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Section Title
  sectionTitle: {
    color: '#333333',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  bioLabel: {
    color: '#333333',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    marginTop: 24,
  },
  simpleBioText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    marginBottom: 24,
    marginTop: 8,
    textAlign: 'left',
  },

  // Info Section
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

  // Interests
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

  // Gallery
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
    backgroundColor: 'rgba(59,130,246,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryOverlayText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  // Full Screen Gallery
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

  // About Section
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
    marginBottom: 12,
  },
  replyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f6f6f8',
  },
  replyHintText: {
    color: '#be185d',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },

  // Action Buttons
  actionsContainer: {
    paddingBottom: 64,
    paddingTop: 16,
  },
  actionButton: {
    marginBottom: 16,
  },
  likeButton: {
    backgroundColor: '#f8b2ca',
    borderRadius: 9999,
    paddingVertical: 16,
    shadowColor: '#f8b2ca',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  messageButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#e5e7eb',
    borderWidth: 1.5,
    borderRadius: 9999,
    paddingVertical: 16,
  },
  reportButton: {
    borderRadius: 9999,
    paddingVertical: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  messageButtonText: {
    color: '#be185d',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 16,
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  reportButtonText: {
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 16,
    letterSpacing: 0.8,
    marginLeft: 8,
  },

  // Misc
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#f6f6f8',
    borderTopColor: '#f8b2ca',
  },
  notFoundTitle: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  notFoundSubtitle: {
    color: '#8E8E93',
    fontSize: 16,
  },
});