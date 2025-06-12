import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import React, { useRef, useState } from 'react'
import { Dimensions, Text, TouchableOpacity, View, BlurView } from 'react-native'
import Swiper from 'react-native-deck-swiper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScaledSheet, s, vs } from 'react-native-size-matters'

const { width, height } = Dimensions.get('window')

// Type definitions
interface Profile {
  id: number
  name: string
  age: number
  bio: string
  distance: string
  image: string
  interests: string[]
}

interface OverlayLabelStyle {
  label: {
    backgroundColor: string
    borderColor: string
    color: string
    borderWidth: number
    fontSize: number
    fontWeight: string
    padding: number
    borderRadius: number
  }
  wrapper: {
    flexDirection: 'column'
    alignItems: 'flex-end' | 'flex-start'
    justifyContent: 'flex-start'
    marginTop: number
    marginLeft: number
  }
}

interface OverlayLabels {
  left: {
    title: string
    style: OverlayLabelStyle
  }
  right: {
    title: string
    style: OverlayLabelStyle
  }
}

// Sample profile data - replace with your actual user data
const profiles: Profile[] = [
  {
    id: 1,
    name: 'Sarah',
    age: 24,
    bio: 'Love hiking and coffee ☕',
    distance: '2 miles away',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
    interests: ['Photography', 'Travel', 'Music']
  },
  {
    id: 2,
    name: 'Emma',
    age: 26,
    bio: 'Artist and dog lover 🎨🐕',
    distance: '5 miles away',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
    interests: ['Art', 'Dogs', 'Yoga']
  },
  {
    id: 3,
    name: 'Jessica',
    age: 23,
    bio: 'Foodie and adventure seeker 🍕✈️',
    distance: '3 miles away',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
    interests: ['Food', 'Adventure', 'Books']
  },
  {
    id: 4,
    name: 'Maya',
    age: 28,
    bio: 'Fitness enthusiast 💪',
    distance: '1 mile away',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
    interests: ['Fitness', 'Cooking', 'Dancing']
  },
  {
    id: 5,
    name: 'Zoe',
    age: 25,
    bio: 'Nature lover and photographer 📸🌿',
    distance: '4 miles away',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
    interests: ['Nature', 'Photography', 'Hiking']
  },
  {
    id: 6,
    name: 'Lily',
    age: 27,
    bio: 'Part-time writer, full-time dreamer ✨',
    distance: '6 miles away',
    image: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=600&fit=crop&crop=face',
    interests: ['Writing', 'Books', 'Jazz']
  },
  {
    id: 7,
    name: 'Chloe',
    age: 22,
    bio: 'Design is my love language 💜',
    distance: '3 miles away',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face',
    interests: ['Design', 'Coffee', 'Running']
  },
  {
    id: 8,
    name: 'Isabella',
    age: 29,
    bio: 'Engineer with a passion for sustainability 🌱',
    distance: '2 miles away',
    image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=600&fit=crop&crop=face',
    interests: ['Tech', 'Nature', 'Climbing']
  },
  {
    id: 9,
    name: 'Ava',
    age: 24,
    bio: 'I bake, I dance, I binge K-dramas 🧁💃',
    distance: '5 miles away',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face',
    interests: ['Baking', 'Dancing', 'K-Dramas']
  },
  {
    id: 10,
    name: 'Nina',
    age: 26,
    bio: 'World explorer. Ask me where I\'ve been! 🗺️',
    distance: '4 miles away',
    image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=600&fit=crop&crop=face',
    interests: ['Travel', 'Photography', 'Vlogging']
  },
  {
    id: 11,
    name: 'Olivia',
    age: 28,
    bio: 'Yoga instructor with a soft spot for poetry 🧘‍♀️📖',
    distance: '2 miles away',
    image: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=600&fit=crop&crop=face',
    interests: ['Yoga', 'Poetry', 'Tea']
  },
  {
    id: 12,
    name: 'Mila',
    age: 25,
    bio: 'Craft beer snob and board game champion 🍺🎲',
    distance: '3 miles away',
    image: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?w=400&h=600&fit=crop&crop=face',
    interests: ['Board Games', 'Craft Beer', 'Trivia']
  },
  {
    id: 13,
    name: 'Sophia',
    age: 23,
    bio: 'I code by day and paint by night 💻🎨',
    distance: '1 mile away',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop&crop=face',
    interests: ['Coding', 'Painting', 'Gaming']
  },
  {
    id: 14,
    name: 'Ella',
    age: 30,
    bio: 'Plant mom 🌱 | Cat whisperer 🐱',
    distance: '5 miles away',
    image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=600&fit=crop&crop=face',
    interests: ['Gardening', 'Cats', 'Podcasts']
  },
  {
    id: 15,
    name: 'Grace',
    age: 27,
    bio: 'Let\'s talk films, feelings, and food 🍿💭',
    distance: '6 miles away',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
    interests: ['Cinema', 'Cooking', 'Philosophy']
  }
]

const SwipeScreen: React.FC = () => {
  const swiperRef = useRef<Swiper<Profile>>(null)
  const [cardIndex, setCardIndex] = useState<number>(0)
  const [swipedAll, setSwipedAll] = useState<boolean>(false)

  const currentProfile = profiles[cardIndex] || profiles[0]

  const renderCard = (profile: Profile | null, index: number): React.ReactElement | null => {
    if (!profile) return null

    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Image 
            source={{ uri: profile.image }} 
            style={styles.cardImage}
            contentFit="cover"
            transition={300}
            placeholder={require('@/assets/images/placeholder.png')}
            placeholderContentFit='contain'
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
            style={styles.cardGradient}
          />
          
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.age}>{profile.age}</Text>
            </View>
            <Text style={styles.distance}>{profile.distance}</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest: string, idx: number) => (
                <View key={idx} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    )
  }

  const onSwiped = (cardIndex: number): void => {
    console.log('Card swiped:', cardIndex)
    setCardIndex((prevIndex: number) => prevIndex + 1)
  }

  const onSwipedAll = (): void => {
    console.log('All cards swiped!')
    setSwipedAll(true)
  }

  const onSwipedLeft = (cardIndex: number): void => {
    console.log('Passed on:', profiles[cardIndex]?.name)
  }

  const onSwipedRight = (cardIndex: number): void => {
    console.log('Liked:', profiles[cardIndex]?.name)
  }

  const resetDeck = (): void => {
    setCardIndex(0)
    setSwipedAll(false)
    if (swiperRef.current) {
      swiperRef.current.jumpToCardIndex(0)
    }
  }

  const swipeLeft = (): void => {
    console.log('Pass button pressed, cardIndex:', cardIndex, 'profiles length:', profiles.length)
    if (swiperRef.current && cardIndex < profiles.length) {
      console.log('Attempting to swipe left...')
      swiperRef.current.swipeLeft()
    } else {
      console.log('Cannot swipe left - ref or cardIndex issue')
    }
  }

  const swipeRight = (): void => {
    console.log('Like button pressed, cardIndex:', cardIndex, 'profiles length:', profiles.length)
    if (swiperRef.current && cardIndex < profiles.length) {
      console.log('Attempting to swipe right...')
      swiperRef.current.swipeRight()
    } else {
      console.log('Cannot swipe right - ref or cardIndex issue')
    }
  }

  const overlayLabels: OverlayLabels = {
    left: {
      title: 'NOPE',
      style: {
        label: {
          backgroundColor: 'rgba(255, 59, 92, 0.9)',
          borderColor: '#FF3B5C',
          color: 'white',
          borderWidth: 2,
          fontSize: s(22),
          fontWeight: '800',
          padding: s(12),
          borderRadius: s(25)
        },
        wrapper: {
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          marginTop: vs(60),
          marginLeft: s(-40)
        }
      }
    },
    right: {
      title: 'LIKE ♡',
      style: {
        label: {
          backgroundColor: 'rgba(76, 201, 240, 0.9)',
          borderColor: '#4CC9F0',
          color: 'white',
          borderWidth: 2,
          fontSize: s(22),
          fontWeight: '800',
          padding: s(12),
          borderRadius: s(25)
        },
        wrapper: {
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          marginTop: vs(60),
          marginLeft: s(40)
        }
      }
    }
  }

  if (swipedAll) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.completedContainer}
        >
          <View style={styles.completedContent}>
            <Text style={styles.completedEmoji}>✨</Text>
            <Text style={styles.completedTitle}>You're all caught up!</Text>
            <Text style={styles.completedSubtitle}>Check back later for more amazing people</Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetDeck}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.resetButtonGradient}
              >
                <Text style={styles.resetButtonText}>Explore Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    )
  }

  return (
    <>
      {/* Dynamic Background */}
      <View style={styles.backgroundContainer}>
        <Image 
          source={{ uri: currentProfile.image }} 
          style={styles.backgroundImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.2)',
            'rgba(100, 100, 100, 0.35)',
            'rgba(255, 255, 255, 0.3)'
          ]}
          style={styles.backgroundOverlay}
        />
      </View>

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Discover</Text>
            <View style={styles.headerStats}>
              <Text style={styles.headerSubtitle}>{cardIndex + 1}/{profiles.length}</Text>
            </View>
          </View>
        </View>

        {/* Swiper */}
        <View style={styles.swiperContainer}>
          <Swiper
            ref={swiperRef}
            cards={profiles}
            renderCard={renderCard}
            onSwiped={onSwiped}
            onSwipedAll={onSwipedAll}
            onSwipedLeft={onSwipedLeft}
            onSwipedRight={onSwipedRight}
            cardIndex={cardIndex}
            backgroundColor="transparent"
            stackSize={3}
            stackScale={6}
            stackSeparation={s(8)}
            animateOverlayLabelsOpacity
            overlayLabels={overlayLabels}
            verticalSwipe={false}
            cardVerticalMargin={vs(15)}
            cardHorizontalMargin={s(25)}
            swipeAnimationDuration={300}
            disableBottomSwipe={true}
            disableTopSwipe={true}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.passButton]} 
            onPress={swipeLeft}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF3B5C', '#FF6B8A']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonIcon}>✕</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.superLikeButton]} 
            onPress={() => console.log('Super like!')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD93D', '#FF9A56']}
              style={styles.buttonGradient}
            >
              <Text style={[styles.buttonIcon, { fontSize: s(20) }]}>★</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton]} 
            onPress={swipeRight}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CC9F0', '#7209B7']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonIcon}>♡</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = ScaledSheet.create({
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: s(25),
    paddingTop: vs(10),
    paddingBottom: vs(25),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: s(20),
    paddingVertical: vs(15),
    borderRadius: s(25),
    backdropFilter: 'blur(20px)',
  },
  headerTitle: {
    fontSize: s(32),
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(20),
  },
  headerSubtitle: {
    fontSize: s(15),
    color: 'white',
    fontWeight: '700',
  },
  swiperContainer: {
    flex: 1,
    paddingBottom: vs(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: width * 0.88,
    height: height * 0.58,
    borderRadius: s(30),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: vs(20),
    },
    shadowOpacity: 0.5,
    shadowRadius: s(25),
    elevation: 20,
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  card: {
    flex: 1,
    borderRadius: s(30),
    overflow: 'hidden',
    position: 'relative',
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
    height: '65%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: s(20),
    paddingBottom: vs(25),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: vs(4),
  },
  name: {
    fontSize: s(30),
    fontWeight: '800',
    color: 'white',
    marginRight: s(8),
    letterSpacing: 0.5,
  },
  age: {
    fontSize: s(22),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  distance: {
    fontSize: s(14),
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: vs(6),
    fontWeight: '600',
  },
  bio: {
    fontSize: s(16),
    color: 'white',
    marginBottom: vs(12),
    lineHeight: vs(22),
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: vs(4),
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(15),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: s(6),
    marginBottom: vs(6),
  },
  interestText: {
    color: 'white',
    fontSize: s(12),
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(40),
    paddingBottom: vs(60),
    paddingTop: vs(5),
    gap: s(25),
    zIndex: 10,
    elevation: 10,
  },
  actionButton: {
    width: s(65),
    height: s(65),
    borderRadius: s(32.5),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: vs(8),
    },
    shadowOpacity: 0.3,
    shadowRadius: s(15),
    elevation: 15,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: s(32.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  passButton: {},
  superLikeButton: {
    width: s(55),
    height: s(55),
  },
  likeButton: {},
  buttonIcon: {
    fontSize: s(24),
    color: 'white',
    fontWeight: '800',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedContent: {
    alignItems: 'center',
    padding: s(40),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: s(30),
    margin: s(20),
  },
  completedEmoji: {
    fontSize: s(60),
    marginBottom: vs(20),
  },
  completedTitle: {
    fontSize: s(36),
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: vs(12),
    letterSpacing: 0.5,
  },
  completedSubtitle: {
    fontSize: s(18),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: vs(40),
    fontWeight: '500',
  },
  resetButton: {
    borderRadius: s(25),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: vs(8),
    },
    shadowOpacity: 0.3,
    shadowRadius: s(12),
    elevation: 12,
  },
  resetButtonGradient: {
    paddingHorizontal: s(35),
    paddingVertical: vs(18),
    borderRadius: s(25),
  },
  resetButtonText: {
    fontSize: s(18),
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
})

export default SwipeScreen