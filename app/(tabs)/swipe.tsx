import { supabase } from '@/lib/supabase'
import MatchScreen from '@/screens/MatchScreen'
import { useAuthStore } from '@/store/authStore'
import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import Slider from '@react-native-community/slider'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Feather } from '@expo/vector-icons'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Swiper from 'react-native-deck-swiper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScaledSheet, s, vs } from 'react-native-size-matters'


// --- DIMENSIONS ---
const { width, height } = Dimensions.get('window')

// --- TYPE DEFINITIONS ---
interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location_city: string;
  location_state: string;
  location_country: string;
  height: string;
  profile_pictures: string[];
  interests: string[];
  education: string;
  occupation: string;
}

// --- MAIN COMPONENT ---
const SwipeScreen: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const swiperRef = useRef<Swiper<Profile>>(null)
  const [cardIndex, setCardIndex] = useState<number>(0)
  const [swipedAll, setSwipedAll] = useState<boolean>(false)
  const [currentImage, setCurrentImage] = useState<string>('')
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const buttonScale = useRef(new Animated.Value(1)).current
  const superLikeButtonScale = useRef(new Animated.Value(1)).current
  const currentProfile = profiles[cardIndex] || {
    id: '',
    name: '',
    age: 0,
    bio: '',
    location_city: '',
    location_state: '',
    location_country: '',
    height: '',
    profile_pictures: [],
    interests: [],
    education: '',
    occupation: ''
  };
  const [headerFeedback, setHeaderFeedback] = useState<{ text: string; name?: string } | null>({
    text: 'Discover',
  });
  const headerScale = useRef(new Animated.Value(1)).current
  const headerOpacity = useRef(new Animated.Value(1)).current
  const isButtonTriggeredRef = useRef(false);
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, initialized, loading, setTabBarVisible } = useAuthStore() // Destructure setTabBarVisible

  // --- BOTTOM SHEET MODAL ---
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%'], []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
    setTabBarVisible(false);
    setIsModalOpen(true); // Add this line
  }, [setTabBarVisible]);
  
  // Update handleSheetChanges
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
    if (index === -1) {
      setTabBarVisible(true);
      setIsModalOpen(false); // Add this line
    }
  }, [setTabBarVisible]);
    
  // --- Filter State ---
  const [interestedIn, setInterestedIn] = useState('Girls');
  const [distance, setDistance] = useState(40);
  const [ageRange, setAgeRange] = useState({ min: 20, max: 28 });


  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime listener for user:', user.id);

    const channel = supabase
      .channel('match-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          console.log('Received match payload:', payload);
          const { user1_id, user2_id } = payload.new;

          if (matchedProfile) {
            console.log('Already showing a match, ignoring');
            return;
          }

          if (user.id === user1_id || user.id === user2_id) {
            console.log('Match involves current user!');
            
            const otherUserId = user.id === user1_id ? user2_id : user1_id;
            console.log('Fetching profile for user:', otherUserId);

            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('id, name, age, bio, profile_pictures, interests, height')
              .eq('id', otherUserId)
              .single();

            console.log('Profile data:', profileData, 'Error:', error);

            if (error || !profileData) {
              console.error('Error fetching matched user profile:', error);
              return;
            }

            const matchedProfileData: Profile = {
              id: profileData.id.toString(),
              name: profileData.name || 'Unknown',
              age: profileData.age,
              bio: profileData.bio || '',
              location_city: '',
              location_state: '',
              location_country: '',
              height: profileData.height?.toString() || '',
              profile_pictures: profileData.profile_pictures || [],
              interests: profileData.interests || [],
              education: '',
              occupation: '',
            };

            console.log('Setting matched profile:', matchedProfileData);
            setMatchedProfile(matchedProfileData);
          }
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, matchedProfile]);

  useEffect(() => {
    console.log('matchedProfile state changed:', matchedProfile);
  }, [matchedProfile]);

  useEffect(() => {
    if (!initialized || loading || !user) return

    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, age, bio, location_city, profile_pictures, interests, height')
        .neq('id', user.id)
        .limit(20)

      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      const formatted = data.map(p => ({
        id: p.id.toString(),
        name: p.name,
        age: p.age,
        bio: p.bio,
        location_city: p.location_city || '',
        location_state: '',
        location_country: '',
        height: p.height || '',
        profile_pictures: p.profile_pictures || [],
        interests: p.interests || [],
        education: '',
        occupation: '',
      }))

      setProfiles(formatted)
      if (formatted.length > 0) setCurrentImage(formatted[0].profile_pictures[0])
    }

    fetchProfiles()
  }, [initialized, loading, user])

  useEffect(() => {
    if (profiles.length > 0 && cardIndex + 1 < profiles.length) {
      Image.prefetch(profiles[cardIndex + 1].profile_pictures[0]);
    }
  }, [cardIndex, profiles]);

  const onSwiped = (index: number) => {
    const currentProfile = profiles[index];
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start(() => {
      setCurrentImage(profiles[index + 1]?.profile_pictures[0] || currentImage);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad)
      }).start();
    });

    scaleAnim.setValue(1.02);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true
    }).start();

    setCardIndex(index + 1);
  };

  const onSwipedLeft = (index: number) => {
    if (!isButtonTriggeredRef.current) {
      showSwipeFeedback('left', profiles[index].name);
    }
    isButtonTriggeredRef.current = false;
    onSwiped(index);
  };

  const onSwipedRight = (index: number) => {
    const swipedUserId = profiles[index]?.id;
    if (swipedUserId) {
      insertSwipe(swipedUserId, true, false);
    }
    if (!isButtonTriggeredRef.current) {
      showSwipeFeedback('right', profiles[index].name);
    }
    isButtonTriggeredRef.current = false;
    onSwiped(index);
  };

  const onSwipedTop = (index: number) => {
    const swipedUserId = profiles[index]?.id;
    if (swipedUserId) {
      insertSwipe(swipedUserId, true, true);
    }
    if (!isButtonTriggeredRef.current) {
      showSwipeFeedback('top', profiles[index].name);
    }
    isButtonTriggeredRef.current = false;
    onSwiped(index);
  };

  const insertSwipe = async (
    swipedProfileId: string,
    isLike: boolean,
    isSuperLike: boolean = false
  ) => {
    if (!user?.id || !swipedProfileId) return;

    const { error } = await supabase.from('swipes').upsert({
      swiper_id: user.id,
      swiped_id: swipedProfileId,
      is_like: isLike,
      is_super_like: isSuperLike,
      swiped_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error inserting swipe:', error);
    }
  };

  const onSwipedAllCards = () => {
    setSwipedAll(true)
  }

  const showSwipeFeedback = (type: 'left' | 'right' | 'top', profileName: string) => {
    if (type === 'right') {
      setHeaderFeedback({ text: 'You liked', name: profileName })
    } else if (type === 'left') {
      setHeaderFeedback({ text: 'You passed on', name: profileName })
    } else if (type === 'top') {
      setHeaderFeedback({ text: 'You super liked', name: profileName })
    }

    Animated.timing(headerOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      headerOpacity.setValue(0)
      Animated.parallel([
        Animated.timing(headerScale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      setTimeout(() => {
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setHeaderFeedback({ text: 'Discover' })
          headerScale.setValue(1.2)
          Animated.parallel([
            Animated.timing(headerScale, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.exp),
              useNativeDriver: true,
            }),
            Animated.timing(headerOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start()
        })
      }, 500)
    })
  }

  const swipeLeft = () => {
    isButtonTriggeredRef.current = true;
    animateButton(buttonScale);
    showSwipeFeedback('left', currentProfile.name);
    swiperRef.current?.swipeLeft();
  };

  const swipeRight = () => {
    isButtonTriggeredRef.current = true;
    animateButton(buttonScale);
    showSwipeFeedback('right', currentProfile.name);
    swiperRef.current?.swipeRight();
  };

  const swipeTop = () => {
    isButtonTriggeredRef.current = true;
    animateButton(superLikeButtonScale);
    showSwipeFeedback('top', currentProfile.name);
    swiperRef.current?.swipeTop();
  };

  const animateButton = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true
      })
    ]).start()
  }

  const renderCard = (profile: Profile | null): React.ReactElement | null => {
    if (!profile) return null
    
    return (
      <View style={styles.card}>
        <Image
          source={{ uri: profile.profile_pictures[0] }}
          style={styles.cardImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
          locations={[0.4, 0.7, 1]}
          style={styles.cardGradient}
        />
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name},</Text>
            <Text style={styles.age}>{profile.age}</Text>
          </View>
          
          <Text style={styles.distance}>{profile.location_city}</Text>

          {profile.height && (
            <Text style={styles.height}>{profile.height}</Text>
          )}

          {profile.occupation && (
            <Text style={styles.occupation}>{profile.occupation}</Text>
          )}

          {profile.education && (
            <Text style={styles.education}>{profile.education}</Text>
          )}

          <Text style={styles.bio}>{profile.bio}</Text>

          <View style={styles.interestsContainer}>
            {profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>Loading Profiles...</Text>
      </View>
    );
  }

  if (matchedProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <MatchScreen
          profile={matchedProfile}
          onClose={() => setMatchedProfile(null)}
        />
      </View>
    );
  }

  if (swipedAll || profiles.length === 0) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>All Profiles Viewed</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <Animated.View style={[styles.backgroundContainer]}>
            <Image
              source={{ uri: currentImage }}
              style={styles.backgroundImage}
              contentFit="cover"
              blurRadius={20}
              transition={300}
            />
            <View style={styles.backgroundOverlay} />
          </Animated.View>

          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
              <BlurView intensity={30} tint="dark" style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Animated.Text
                    style={[
                      styles.headerTitle,
                      {
                        opacity: headerOpacity,
                      },
                    ]}
                  >
                    {headerFeedback?.text}{' '}
                    {headerFeedback?.name && (
                      <Text
                        style={[
                          styles.headerName,
                          headerFeedback.text === 'You liked' && { color: '#00C896' },
                          headerFeedback.text === 'You passed on' && { color: '#FF5771' },
                          headerFeedback.text === 'You super liked' && { color: '#5CDBFF' }
                        ]}
                      >
                        {headerFeedback.name}
                      </Text>
                    )}
                  </Animated.Text>
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={handlePresentModalPress}>
                  <Feather name="sliders" size={s(22)} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              </BlurView>
            </View>

            <View style={styles.swiperContainer}>
              <Swiper
                ref={swiperRef}
                cards={profiles}
                renderCard={renderCard}
                onSwipedLeft={onSwipedLeft}
                onSwipedRight={onSwipedRight}
                onSwipedTop={onSwipedTop}
                onSwipedAll={onSwipedAllCards}
                onTapCard={(cardIndex) => {
                  const profile = profiles[cardIndex];
                  if (profile) {
                    router.push({
                      pathname: "/[id]",
                      params: { id: profile.id }
                    });
                  }
                }}
                cardIndex={cardIndex}
                backgroundColor="transparent"
                stackSize={3}
                stackScale={5}
                stackSeparation={14}
                disableBottomSwipe
                disableTopSwipe={!!matchedProfile}
                disableLeftSwipe={!!matchedProfile}
                disableRightSwipe={!!matchedProfile}
                animateOverlayLabelsOpacity
                horizontalThreshold={ 50 }
                verticalThreshold={ 50 }
                swipeAnimationDuration={400}
              />
            </View>

            <View style={styles.actionButtonsContainer}>
              <BlurView intensity={0} tint="dark" style={styles.actionButtons}>
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.passButton]} 
                    onPress={swipeLeft}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={s(28)} color="#FF5771" />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: superLikeButtonScale }] }}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.superLikeButton]}
                    onPress={swipeTop}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="star" size={s(22)} color="#5CDBFF" />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.likeButton]} 
                    onPress={swipeRight}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="heart" size={s(22)} color="#00C896" />
                  </TouchableOpacity>
                </Animated.View>
              </BlurView>
            </View>
          </SafeAreaView>

          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backgroundStyle={{ backgroundColor: '#fff' }}
            handleIndicatorStyle={{ backgroundColor: '#ccc' }}
          >
            <BottomSheetView style={styles.modalContentContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => bottomSheetModalRef.current?.dismiss()}
                >
                  <Ionicons name="close" size={s(20)} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.headerDivider} />

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Interested in</Text>
                <View style={styles.segmentedControl}>
                  {[
                    { label: 'Girls', icon: 'woman' },
                    { label: 'Boys', icon: 'man' },
                    { label: 'Both', icon: 'people' }
                  ].map(option => (
                    <Pressable 
                      key={option.label} 
                      style={[
                        styles.segmentButton, 
                        interestedIn === option.label && styles.segmentButtonActive
                      ]}
                      onPress={() => setInterestedIn(option.label)}
                    >
                      <Ionicons 
                        name={option.icon} 
                        size={s(16)} 
                        color={interestedIn === option.label ? '#fff' : '#666'} 
                      />
                      <Text style={[
                        styles.segmentText, 
                        interestedIn === option.label && styles.segmentTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Location</Text>
                <TouchableOpacity style={styles.locationInput}>
                  <View style={styles.locationLeft}>
                    <Ionicons name="location" size={s(18)} color="#FF4F69" />
                    <Text style={styles.locationText}>Chicago, USA</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={s(18)} color="#999" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.filterLabel}>Distance</Text>
                  <Text style={styles.valueLabel}>{distance}km</Text>
                </View>
                <Slider
                  style={{width: '100%', height: 40}}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={distance}
                  onValueChange={setDistance}
                  minimumTrackTintColor="#FF4F69"
                  maximumTrackTintColor="#F0F0F0"
                  thumbTintColor="#FF4F69"
                />
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Age Range</Text>
                <View style={styles.ageRangeContainer}>
                  <View style={styles.ageSliderContainer}>
                    <Text style={styles.ageLabel}>Min Age: {ageRange.min}</Text>
                    <Slider
                      style={styles.ageSlider}
                      minimumValue={18}
                      maximumValue={ageRange.max - 1}
                      step={1}
                      value={ageRange.min}
                      onValueChange={(val) => setAgeRange(prev => ({...prev, min: val}))}
                      minimumTrackTintColor="#FF4F69"
                      maximumTrackTintColor="#E8E8E8"
                      thumbStyle={styles.sliderThumb}
                    />
                  </View>
                  <View style={styles.ageSliderContainer}>
                    <Text style={styles.ageLabel}>Max Age: {ageRange.max}</Text>
                    <Slider
                      style={styles.ageSlider}
                      minimumValue={ageRange.min + 1}
                      maximumValue={60}
                      step={1}
                      value={ageRange.max}
                      onValueChange={(val) => setAgeRange(prev => ({...prev, max: val}))}
                      minimumTrackTintColor="#FF4F69"
                      maximumTrackTintColor="#E8E8E8"
                      thumbStyle={styles.sliderThumb}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => bottomSheetModalRef.current?.dismiss()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF4F69', '#FF6B7A']}
                  style={styles.continueButtonGradient}
                >
                  <Text style={styles.continueButtonText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>

            </BottomSheetView>
          </BottomSheetModal>
          {isModalOpen && (
            <BlurView 
              intensity={20} 
              tint="dark" 
              style={StyleSheet.absoluteFillObject}
            />
          )}
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

export default SwipeScreen;

// --- STYLES ---
const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  header: {
    paddingHorizontal: s(20),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingVertical: vs(6),
    borderRadius: s(30),
    overflow: 'hidden',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: s(25) // Offset for the button
  },
  headerTitle: {
    fontSize: s(18),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  filterButton: {
    padding: s(5),
  },
  swiperContainer: {
    flex: 1,
    marginTop: vs(0),
    alignItems: 'center',
  },
  card: {
    width: 'auto',
    height: height * 0.53,
    borderRadius: s(24),
    backgroundColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    marginTop: vs(0),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    width: '100%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: s(25),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: vs(5),
  },
  height: {
    fontSize: s(14),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: vs(5),
  },
  name: {
    fontSize: s(30),
    fontWeight: '700',
    color: '#fff',
    marginRight: s(8),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  age: {
    fontSize: s(24),
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    paddingBottom: vs(2),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  distance: {
    fontSize: s(14),
    color: 'rgba(255,255,255,0.8)',
    marginBottom: vs(5),
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bio: {
    fontSize: s(16),
    color: '#eee',
    lineHeight: vs(22),
    fontWeight: '400',
    marginBottom: vs(7),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(15),
    marginRight: s(8),
    marginBottom: vs(5),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  interestText: {
    color: '#fff',
    fontSize: s(10),
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: s(40),
    paddingBottom: vs(65),
    zIndex: 10
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: s(15),
    overflow: 'hidden',
  },
  actionButton: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  passButton: {
    backgroundColor: 'rgba(255, 87, 113, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 87, 113, 0.3)',
  },
  superLikeButton: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    backgroundColor: 'rgba(92, 219, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(92, 219, 255, 0.3)',
  },
  likeButton: {
    backgroundColor: 'rgba(22, 199, 154, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(22, 199, 154, 0.3)',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: s(40),
  },
  completedTitle: {
    fontSize: s(28),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: vs(15),
    letterSpacing: 0.5,
  },
  headerName: {
    fontWeight: '700',
    fontStyle: 'italic',
  },
  occupation: {
    fontSize: s(14),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: vs(5),
  },
  education: {
    fontSize: s(14),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: vs(5),
  },
  // --- Modal Styles ---
  modalContentContainer: {
    flex: 1,
    paddingHorizontal: s(20),
    paddingTop: vs(10),
  },
  modalTitle: {
    fontSize: s(20),
    fontWeight: 'bold',
    color: '#000',
  },
  modalClearButton: {
    fontSize: s(14),
    color: '#FF4F69',
    position: 'absolute',
    right: 0,
  },
  filterSection: {
    marginBottom: vs(25),
  },
  filterLabel: {
    fontSize: s(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: vs(10),
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: s(10),
    overflow: 'hidden',
  },
  segmentText: {
    fontSize: s(14),
    color: '#555',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: s(16),
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: s(14),
    color: '#333',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: s(14),
    fontWeight: '600',
    color: '#555',
  },
  // Add these new styles to your styles object:
closeButton: {
  position: 'absolute',
  right: 0,
  padding: s(5),
},
headerDivider: {
  height: 1,
  backgroundColor: '#E8E8E8',
  marginHorizontal: s(-20),
  marginBottom: vs(20),
},
locationLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: s(10),
},
ageRangeContainer: {
  gap: vs(15),
},
ageSliderContainer: {
  gap: vs(5),
},
ageLabel: {
  fontSize: s(14),
  color: '#666',
  fontWeight: '500',
},
ageSlider: {
  width: '100%',
  height: 40,
},
sliderThumb: {
  backgroundColor: '#FF4F69',
  width: s(20),
  height: s(20),
},
continueButtonGradient: {
  paddingVertical: vs(15),
  borderRadius: s(30),
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
},

// Update existing styles:
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: vs(15),
  position: 'relative',
},
segmentButton: {
  flex: 1,
  paddingVertical: vs(12),
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: s(5),
},
segmentButtonActive: {
  backgroundColor: '#FF4F69',
  shadowColor: '#FF4F69',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
},
locationInput: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#FAFAFA',
  paddingHorizontal: s(15),
  paddingVertical: vs(15),
  borderRadius: s(12),
  borderWidth: 1,
  borderColor: '#E8E8E8',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
},
continueButton: {
  marginTop: 'auto',
  marginBottom: vs(20),
  shadowColor: '#FF4F69',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},
});
