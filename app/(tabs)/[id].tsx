import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchProfile = async () => {
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
    };

    fetchProfile();
  }, [id]);

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

  const handleTeaserReply = (teaser: string) => {
    if (!profile) return;
    router.push({
      pathname: `/chat/${profile.id}`,
      params: {
        userName: profile.name,
        userImage: profile.profile_pictures[0],
        teaser
      }
    });
  };


  const photos = useMemo(() =>
    profile?.profile_pictures || [],
    [profile?.profile_pictures]
  );

  const renderPhotoCarousel = () => {
    if (!photos.length) {
      return (
        <View style={[styles.photoCarouselContainer, styles.noPhotosContainer]}>
          <View style={styles.noPhotosIconContainer}>
            <Ionicons name="person-outline" size={32} color="#71717a" />
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
            <Animated.View
              key={idx}
              style={[styles.photoContainer, { width }]}
            >
              <Image
                source={{ uri }}
                style={styles.profileImage}
                contentFit="cover"
                transition={400}
              />
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                style={styles.imageGradient}
              />
            </Animated.View>
          ))}
        </Animated.ScrollView>

        {photos.length > 1 && (
          <View style={styles.photoIndicatorsContainer}>
            {photos.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.photoIndicator,
                  idx === activePhoto ? styles.activePhotoIndicator : styles.inactivePhotoIndicator
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.headerButtons}>
          <Link href="/swipe" asChild>
            <TouchableOpacity>
              <BlurView intensity={20} style={styles.iconButton}>
                <Ionicons name="chevron-back" size={20} color="white" />
              </BlurView>
            </TouchableOpacity>
          </Link>

          <View style={styles.rightHeaderButtons}>
            <TouchableOpacity onPress={handleShare}>
              <BlurView intensity={20} style={styles.iconButton}>
                <Ionicons name="share-outline" size={18} color="white" />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity>
              <BlurView intensity={20} style={styles.iconButton}>
                <Ionicons name="heart-outline" size={18} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileInfoOverlay}>
          <View style={styles.nameContainer}>
            <Text style={styles.profileName}>
              {profile?.name || 'Unknown'}
            </Text>
            {profile?.is_verified && (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            )}
            {profile?.is_premium && (
              <View style={[styles.badge, styles.premiumBadge]}>
                <Ionicons name="star" size={12} color="white" />
              </View>
            )}
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.profileAge}>
              {profile?.age || '--'}
            </Text>
            {profile?.location_city && (
              <>
                <View style={styles.locationDot} />
                <Text style={styles.profileLocation}>
                  {profile.location_city}
                </Text>
              </>
            )}
          </View>
          {profile?.bio && (
            <Text style={styles.profileBio}>
              {profile.bio}
            </Text>
          )}
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

    return (
      <View style={styles.infoSectionContainer}>
        {items.length > 0 && (
          <View style={styles.infoItemsWrapper}>
            <View style={styles.infoItemsGrid}>
              {items.map((item) => (
                <View key={item.key} style={styles.infoItem}>
                  <View style={styles.infoItemContent}>
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
    );
  };

  const renderInterests = () => {
    const interests = profile?.interests || [];
    if (!interests.length) return null;

    return (
      <View style={styles.interestsContainer}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <View style={styles.interestsWrapper}>
          {interests.map((interest, idx) => (
            <View
              key={idx}
              style={styles.interestBubble}
            >
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAbout = () => {
    const teasers = profile?.teasers || {};
    const entries = Object.entries(teasers);

    if (!entries.length) return null;

    return (
      <View style={styles.aboutContainer}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.teasersWrapper}>
          {entries.map(([prompt, answer], idx) => (
            <TouchableOpacity key={idx} onPress={() => handleTeaserReply(prompt)}>
              <View style={styles.teaserCard}>
                <Text style={styles.teaserPrompt}>
                  {prompt}
                </Text>
                <Text style={styles.teaserAnswer}>
                  {answer}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.likeButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="heart" size={20} color="white" />
            <Text style={styles.likeButtonText}>
              Like
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <View style={styles.messageButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="chatbubble-outline" size={18} color="white" />
            <Text style={styles.messageButtonText}>
              Message
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity>
        <View style={styles.reportButton}>
          <View style={styles.buttonContent}>
            <Ionicons name="flag-outline" size={16} color="#71717a" />
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
      <View style={styles.loadingContainer}>
        <View style={styles.spinner} />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <View style={styles.notFoundContent}>
          <View style={styles.noPhotosIconContainer}>
            <Ionicons name="person-outline" size={32} color="#71717a" />
          </View>
          <Text style={styles.notFoundTitle}>Profile not found</Text>
          <Text style={styles.notFoundSubtitle}>This profile may have been deleted</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {renderPhotoCarousel()}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', '#000000']}
          style={styles.contentGradient}
        />

        <View style={styles.contentContainer}>
          {renderInfoSection()}
          {renderInterests()}
          {renderAbout()}
          {renderActions()}
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    // --- Containers & Layout ---
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
    },
    notFoundContainer: {
      flex: 1,
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
    },
    notFoundContent: {
      alignItems: 'center',
    },
    contentContainer: {
      backgroundColor: '#000000',
    },
    contentGradient: {
      height: 80,
      marginTop: -80,
      pointerEvents: 'none',
    },
  
    // --- Photo Carousel ---
    photoCarouselContainer: {
      height: height * 0.75,
    },
    noPhotosContainer: {
      backgroundColor: '#18181b',
      justifyContent: 'center',
      alignItems: 'center',
    },
    noPhotosIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(39, 39, 42, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    noPhotosText: {
      color: '#a1a1aa',
      fontSize: 16,
    },
    photoContainer: {
      position: 'relative',
    },
    profileImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#18181b',
    },
    imageGradient: {
      position: 'absolute',
      inset: 0,
    },
    photoIndicatorsContainer: {
      position: 'absolute',
      top: 64,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 16
    },
    photoIndicator: {
      height: 2,
      marginHorizontal: 2,
      borderRadius: 2,
    },
    activePhotoIndicator: {
      backgroundColor: 'white',
      width: 32,
    },
    inactivePhotoIndicator: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      width: 16,
    },
  
    // --- Header Buttons ---
    headerButtons: {
      position: 'absolute',
      top: 52,
      left: 16,
      right: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rightHeaderButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
    },
  
    // --- Profile Info Overlay ---
    profileInfoOverlay: {
      position: 'absolute',
      bottom: 48,
      left: 32,
      right: 32,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    profileName: {
      color: 'white',
      fontSize: 36,
      fontWeight: '200',
      letterSpacing: -0.5,
    },
    badge: {
      marginLeft: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    verifiedBadge: {
      backgroundColor: '#3b82f6',
    },
    premiumBadge: {
      backgroundColor: '#f59e0b',
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileAge: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 20,
      fontWeight: '200',
      marginRight: 24,
    },
    locationDot: {
      width: 6,
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: 3,
      marginRight: 24,
    },
    profileLocation: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 18,
      fontWeight: '200',
      letterSpacing: 0.5,
    },
    profileBio: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 16,
      fontWeight: '300',
      lineHeight: 24,
      letterSpacing: 0.5,
      marginTop: 16,
    },
  
    // --- Info Section ---
    infoSectionContainer: {
      paddingHorizontal: 32,
      paddingTop: 48,
    },
    infoItemsWrapper: {
      marginBottom: 48,
    },
    infoItemsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
    },
    infoItem: {
      width: '50%',
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    infoItemContent: {
      backgroundColor: 'rgba(39, 39, 42, 0.4)',
      borderWidth: 1,
      borderColor: 'rgba(55, 55, 58, 0.3)',
      borderRadius: 24,
      padding: 24,
      height: 96,
      justifyContent: 'center',
    },
    infoItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    infoItemLabel: {
      color: '#71717a',
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    infoItemValue: {
      color: 'white',
      fontSize: 16,
      fontWeight: '300',
      marginTop: 8,
    },
  
    // --- Interests & About Sections ---
    interestsContainer: {
      paddingHorizontal: 32,
      marginBottom: 48,
    },
    sectionTitle: {
      color: 'white',
      fontSize: 20,
      fontWeight: '200',
      marginBottom: 24,
      letterSpacing: 0.5,
    },
    interestsWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      margin: -8,
    },
    interestBubble: {
      backgroundColor: 'rgba(39, 39, 42, 0.4)',
      borderWidth: 1,
      borderColor: 'rgba(55, 55, 58, 0.2)',
      borderRadius: 9999,
      paddingHorizontal: 24,
      paddingVertical: 12,
      margin: 8,
    },
    interestText: {
      color: '#e4e4e7',
      fontSize: 14,
      fontWeight: '300',
      letterSpacing: 0.5,
    },
    aboutContainer: {
      paddingHorizontal: 32,
      marginBottom: 48,
    },
    teasersWrapper: {
      gap: 24,
    },
    teaserCard: {
      backgroundColor: 'rgba(24, 24, 27, 0.25)',
      borderWidth: 1,
      borderColor: 'rgba(39, 39, 42, 0.2)',
      borderRadius: 24,
      padding: 32,
    },
    teaserPrompt: {
      color: '#a1a1aa',
      fontSize: 14,
      fontWeight: '300',
      marginBottom: 16,
      fontStyle: 'italic',
      letterSpacing: 0.5,
    },
    teaserAnswer: {
      color: 'white',
      fontSize: 16,
      fontWeight: '300',
      lineHeight: 28,
      letterSpacing: 0.5,
    },
  
    // --- Action Buttons ---
    actionsContainer: {
      paddingHorizontal: 32,
      paddingBottom: 64,
      paddingTop: 16,
    },
    actionButton: {
      marginBottom: 16,
    },
    likeButton: {
      backgroundColor: '#c026d3', // Fallback
      borderRadius: 9999,
      paddingVertical: 20,
      shadowColor: '#c026d3',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
    },
    messageButton: {
      backgroundColor: 'rgba(39, 39, 42, 0.3)',
      borderWidth: 1,
      borderColor: 'rgba(55, 55, 58, 0.2)',
      borderRadius: 9999,
      paddingVertical: 20,
    },
    reportButton: {
      borderRadius: 9999,
      paddingVertical: 20,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    likeButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: '500',
      fontSize: 16,
      letterSpacing: 0.5,
      marginLeft: 8,
    },
    messageButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: '300',
      fontSize: 16,
      letterSpacing: 0.5,
      marginLeft: 8,
    },
    reportButtonText: {
      color: '#71717a',
      textAlign: 'center',
      fontWeight: '300',
      fontSize: 16,
      letterSpacing: 0.8,
      marginLeft: 8,
    },
  
    // --- Misc ---
    spinner: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: '#3f3f46',
      borderTopColor: 'white',
    },
    notFoundTitle: {
      color: 'white',
      fontSize: 20,
      fontWeight: '300',
      marginBottom: 8,
    },
    notFoundSubtitle: {
      color: '#a1a1aa',
      fontSize: 16,
    },
  });