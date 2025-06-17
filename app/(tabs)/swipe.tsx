import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Swiper from 'react-native-deck-swiper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScaledSheet, s, vs } from 'react-native-size-matters'
const { width, height } = Dimensions.get('window')


// --- TYPE DEFINITIONS ---
interface Profile {
  id: number
  name: string
  age: number
  bio: string
  distance: string
  image: string
  interests: string[]
}

// --- SAMPLE DATA ---
// const profiles: Profile[] = [
//   {
//     id: 1,
//     name: 'Sarah',
//     age: 24,
//     bio: 'Love hiking and coffee ☕',
//     distance: '2 miles away',
//     image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
//     interests: ['Photography', 'Travel', 'Music']
//   },
//   {
//     id: 2,
//     name: 'Emma',
//     age: 26,
//     bio: 'Artist and dog lover 🎨🐕',
//     distance: '5 miles away',
//     image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
//     interests: ['Art', 'Dogs', 'Yoga']
//   },
//   {
//     id: 3,
//     name: 'Jessica',
//     age: 23,
//     bio: 'Foodie and adventure seeker 🍕✈️',
//     distance: '3 miles away',
//     image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
//     interests: ['Food', 'Adventure', 'Books']
//   },
//   {
//     id: 4,
//     name: 'Maya',
//     age: 28,
//     bio: 'Fitness enthusiast 💪',
//     distance: '1 mile away',
//     image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
//     interests: ['Fitness', 'Cooking', 'Dancing']
//   },
//   {
//     id: 5,
//     name: 'Zoe',
//     age: 25,
//     bio: 'Nature lover and photographer 📸🌿',
//     distance: '4 miles away',
//     image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
//     interests: ['Nature', 'Photography', 'Hiking']
//   },
//   {
//     id: 6,
//     name: 'Lily',
//     age: 27,
//     bio: 'Part-time writer, full-time dreamer ✨',
//     distance: '6 miles away',
//     image: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=600&fit=crop&crop=face',
//     interests: ['Writing', 'Books', 'Jazz']
//   },
//   {
//     id: 7,
//     name: 'Chloe',
//     age: 22,
//     bio: 'Design is my love language 💜',
//     distance: '3 miles away',
//     image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
//     interests: ['Design', 'Coffee', 'Running']
//   },
//   {
//     id: 8,
//     name: 'Isabella',
//     age: 29,
//     bio: 'Engineer with a passion for sustainability 🌱',
//     distance: '2 miles away',
//     image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=600&fit=crop&crop=face',
//     interests: ['Tech', 'Nature', 'Climbing']
//   },
//   {
//     id: 9,
//     name: 'Ava',
//     age: 24,
//     bio: 'I bake, I dance, I binge K-dramas 🧁💃',
//     distance: '5 miles away',
//     image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face',
//     interests: ['Baking', 'Dancing', 'K-Dramas']
//   },
//   {
//     id: 10,
//     name: 'Nina',
//     age: 26,
//     bio: 'World explorer. Ask me where I\'ve been! 🗺️',
//     distance: '4 miles away',
//     image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=600&fit=crop&crop=face',
//     interests: ['Travel', 'Photography', 'Vlogging']
//   },
//   {
//     id: 11,
//     name: 'Olivia',
//     age: 28,
//     bio: 'Yoga instructor with a soft spot for poetry 🧘‍♀️📖',
//     distance: '2 miles away',
//     image: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=600&fit=crop&crop=face',
//     interests: ['Yoga', 'Poetry', 'Tea']
//   },
//   {
//     id: 12,
//     name: 'Mila',
//     age: 25,
//     bio: 'Craft beer snob and board game champion 🍺🎲',
//     distance: '3 miles away',
//     image: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?w=400&h=600&fit=crop&crop=face',
//     interests: ['Board Games', 'Craft Beer', 'Trivia']
//   },
//   {
//     id: 13,
//     name: 'Sophia',
//     age: 23,
//     bio: 'I code by day and paint by night 💻🎨',
//     distance: '1 mile away',
//     image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop&crop=face',
//     interests: ['Coding', 'Painting', 'Gaming']
//   },
//   {
//     id: 14,
//     name: 'Ella',
//     age: 30,
//     bio: 'Plant mom 🌱 | Cat whisperer 🐱',
//     distance: '5 miles away',
//     image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=600&fit=crop&crop=face',
//     interests: ['Gardening', 'Cats', 'Podcasts']
//   },
//   {
//     id: 15,
//     name: 'Grace',
//     age: 27,
//     bio: 'Let\'s talk films, feelings, and food 🍿💭',
//     distance: '6 miles away',
//     image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
//     interests: ['Cinema', 'Cooking', 'Philosophy']
//   }
// ]

// --- MAIN COMPONENT ---
const SwipeScreen: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // const [loading, setLoading] = useState(true);
  const swiperRef = useRef<Swiper<Profile>>(null)
  const [cardIndex, setCardIndex] = useState<number>(0)
  const [swipedAll, setSwipedAll] = useState<boolean>(false)
  const [currentImage, setCurrentImage] = useState<string>('') // Start as empty
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const buttonScale = useRef(new Animated.Value(1)).current
  const superLikeButtonScale = useRef(new Animated.Value(1)).current
  const currentProfile = profiles[cardIndex] || { name: '', image: '', age: 0, bio: '', distance: '', interests: [] }
  const [headerFeedback, setHeaderFeedback] = useState<{ text: string; name?: string } | null>({
    text: 'Discover',
  })
  const headerScale = useRef(new Animated.Value(1)).current
  const headerOpacity = useRef(new Animated.Value(1)).current
  const isButtonTriggeredRef = useRef(false);

  const { user, initialized, loading } = useAuthStore()



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
      id: p.id,
      name: p.name,
      age: p.age,
      bio: p.bio,
      height: p.height,
      distance: `${Math.floor(Math.random() * 6) + 1} miles away`,
      image: p.profile_pictures?.[0] || '',
      interests: p.interests || [],
    }))


    setProfiles(formatted)
    if (formatted.length > 0) setCurrentImage(formatted[0].image)
  }

  fetchProfiles()
}, [initialized, loading, user])



  useEffect(() => {
  if (profiles.length > 0 && cardIndex + 1 < profiles.length) {
    Image.prefetch(profiles[cardIndex + 1].image);
  }
}, [cardIndex, profiles]);


  const onSwiped = (index: number) => {
  // Get the current profile before updating
  const currentProfile = profiles[index];
  
  // Start fade out animation
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
    easing: Easing.out(Easing.quad)
  }).start(() => {
    // Update images and fade back in
    setCurrentImage(profiles[index + 1]?.image || currentImage);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.in(Easing.quad)
    }).start();
  });

  // Pulse animation for background
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
  if (!isButtonTriggeredRef.current) {
    showSwipeFeedback('right', profiles[index].name);
  }
  isButtonTriggeredRef.current = false;
  onSwiped(index);
};

const onSwipedTop = (index: number) => {
  if (!isButtonTriggeredRef.current) {
    showSwipeFeedback('top', profiles[index].name);
  }
  isButtonTriggeredRef.current = false;
  onSwiped(index);
};


const onSwipedAllCards = () => {
    setSwipedAll(true)
  }

  const resetDeck = () => {
    setCardIndex(0)
    setSwipedAll(false)
    setCurrentImage(profiles[0].image)
    swiperRef.current?.jumpToCardIndex(0)
  }



const showSwipeFeedback = (type: 'left' | 'right' | 'top', profileName: string) => {
  // Set feedback based on swipe type
  if (type === 'right') {
    setHeaderFeedback({ text: 'You liked', name: profileName })
  } else if (type === 'left') {
    setHeaderFeedback({ text: 'You passed on', name: profileName })
  } else if (type === 'top') {
    setHeaderFeedback({ text: 'You super liked', name: profileName })
  }

  // Animate out
  Animated.timing(headerOpacity, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
  }).start(() => {
    // Animate in with scale
    // headerScale.setValue(1.2)
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

  // --- RENDER METHODS ---
  const renderCard = (profile: Profile | null): React.ReactElement | null => {
    if (!profile) return null
    
    return (
      <View style={styles.card}>
        <Image
          source={{ uri: profile.image }}
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
          
          <Text style={styles.distance}>{profile.distance}</Text>

          {profile.height && (
            <Text style={styles.height}>{profile.height}</Text>
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

if (swipedAll || profiles.length === 0) {
    return (
      <View style={styles.completedContainer}>
        <StatusBar style="light" />
        <Animated.View style={[styles.completedEmojiContainer, {
          transform: [{
            scale: scaleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1]
            })
          }]
        }]}>
          <Text style={styles.completedEmoji}>🎉</Text>
        </Animated.View>
        <Text style={styles.completedTitle}>All Profiles Viewed</Text>
        <Text style={styles.completedSubtitle}>You've reached the end of the list. Check back later for new profiles.</Text>
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={resetDeck}
          activeOpacity={0.7}
        >
          <Text style={styles.resetButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background with smooth transition */}
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
        {/* Header */}
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
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-sharp" size={s(20)} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Swiper */}
        <View style={styles.swiperContainer}>
          <Swiper
            ref={swiperRef}
            cards={profiles}
            renderCard={renderCard}
            onSwipedLeft={onSwipedLeft}
            onSwipedRight={onSwipedRight}
            onSwipedTop={onSwipedTop}
            onSwipedAll={onSwipedAllCards}
            cardIndex={cardIndex}
            backgroundColor="transparent"
            stackSize={3}
            stackScale={5}
            stackSeparation={14}
            disableBottomSwipe
            animateOverlayLabelsOpacity
            horizontalThreshold={ 50 }
            verticalThreshold={ 50 }
            overlayLabels={{
              left: { 
                title: 'PASS', 
                style: { 
                  label: styles.overlayLabel, 
                  wrapper: styles.overlayWrapper 
                } 
              },
              right: { 
                title: 'LIKE', 
                style: { 
                  label: { ...styles.overlayLabel, ...styles.likeLabel }, 
                  wrapper: styles.overlayWrapper 
                } 
              },
              top: {
                title: 'SUPER LIKE',
                style: {
                  label: { ...styles.overlayLabel, ...styles.superLikeLabel },
                  wrapper: styles.overlayWrapper
                }
              }
            }}
            overlayOpacityHorizontalThreshold={10}
            swipeAnimationDuration={400}
          />
        </View>

        {/* Action Buttons */}
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
    </View>
  )
}

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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: s(18),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  settingsButton: {
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
    // borderRadius: s(40),
    padding: s(15),
    overflow: 'hidden',
    // backgroundColor: 'rgba(20,20,20,0.7)',
    // borderWidth: 1,
    // borderColor: 'rgba(255,255,255,0.1)',
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
  overlayLabel: {
    fontSize: s(32),
    fontWeight: 'bold',
    color: '#E55D5D',
    borderColor: '#E55D5D',
    borderWidth: 4,
    padding: s(15),
    borderRadius: s(15),
    textAlign: 'center',
    transform: [{ rotate: '-15deg' }],
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  likeLabel: {
    color: '#00C896',
    borderColor: '#00C896',
    transform: [{ rotate: '15deg' }],
  },
  overlayWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(100),
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: s(40),
  },
  completedEmojiContainer: {
    marginBottom: vs(30),
  },
  completedEmoji: {
    fontSize: s(80),
  },
  completedTitle: {
    fontSize: s(28),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: vs(15),
    letterSpacing: 0.5,
  },
  completedSubtitle: {
    fontSize: s(16),
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: vs(30),
    lineHeight: vs(24),
    paddingHorizontal: s(20),
  },
  resetButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: s(40),
    paddingVertical: vs(15),
    borderRadius: s(30),
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.4)',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: s(16),
    fontWeight: '600',
  },
  likeIndicator: {
    backgroundColor: '#00C896',
  },
  passIndicator: {
    backgroundColor: '#FF5771',
  },
  superLikeIndicator: {
    backgroundColor: '#5CDBFF',
  },
  headerName: {
    fontWeight: '700',
    fontStyle: 'italic',
  },
  superLikeLabel: {
    color: '#5CDBFF',
    fontSize: s(32),
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(92, 219, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});


export default SwipeScreen