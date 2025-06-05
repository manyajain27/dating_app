import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native'
import React, { useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Swiper from 'react-native-deck-swiper'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

// Sample profile data - replace with your actual user data
const profiles = [
  {
    id: 1,
    name: 'Sarah',
    age: 24,
    bio: 'Love hiking and coffee',
    distance: '2 miles away',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face',
    interests: ['Photography', 'Travel', 'Music']
  },
  {
    id: 2,
    name: 'Emma',
    age: 26,
    bio: 'Artist and dog lover',
    distance: '5 miles away',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face',
    interests: ['Art', 'Dogs', 'Yoga']
  },
  {
    id: 3,
    name: 'Jessica',
    age: 23,
    bio: 'Foodie and adventure seeker',
    distance: '3 miles away',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face',
    interests: ['Food', 'Adventure', 'Books']
  },
  {
    id: 4,
    name: 'Maya',
    age: 28,
    bio: 'Fitness enthusiast',
    distance: '1 mile away',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
    interests: ['Fitness', 'Cooking', 'Dancing']
  },
  {
    id: 5,
    name: 'Zoe',
    age: 25,
    bio: 'Nature lover and photographer',
    distance: '4 miles away',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
    interests: ['Nature', 'Photography', 'Hiking']
  }
]

const SwipeScreen = () => {
  const swiperRef = useRef(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [swipedAll, setSwipedAll] = useState(false)

  const renderCard = (profile, index) => {
    if (!profile) return null

    return (
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Image source={{ uri: profile.image }} style={styles.cardImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
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
              {profile.interests.map((interest, idx) => (
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

  const onSwiped = (cardIndex) => {
    console.log('Card swiped:', cardIndex)
    setCardIndex(prevIndex => prevIndex + 1)
  }

  const onSwipedAll = () => {
    console.log('All cards swiped!')
    setSwipedAll(true)
  }

  const onSwipedLeft = (cardIndex) => {
    console.log('Passed on:', profiles[cardIndex]?.name)
  }

  const onSwipedRight = (cardIndex) => {
    console.log('Liked:', profiles[cardIndex]?.name)
  }

  const resetDeck = () => {
    setCardIndex(0)
    setSwipedAll(false)
    swiperRef.current?.jumpToCardIndex(0)
  }

  const swipeLeft = () => {
    swiperRef.current?.swipeLeft()
  }

  const swipeRight = () => {
    swiperRef.current?.swipeRight()
  }

  const overlayLabels = {
    left: {
      title: 'PASS',
      style: {
        label: {
          backgroundColor: '#FF4458',
          borderColor: '#FF4458',
          color: 'white',
          borderWidth: 2,
          fontSize: 24,
          fontWeight: 'bold',
          padding: 10,
          borderRadius: 10
        },
        wrapper: {
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          marginTop: 50,
          marginLeft: -50
        }
      }
    },
    right: {
      title: 'LIKE',
      style: {
        label: {
          backgroundColor: '#4DD865',
          borderColor: '#4DD865',
          color: 'white',
          borderWidth: 2,
          fontSize: 24,
          fontWeight: 'bold',
          padding: 10,
          borderRadius: 10
        },
        wrapper: {
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          marginTop: 50,
          marginLeft: 50
        }
      }
    }
  }

  if (swipedAll) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.completedContainer}
        >
          <Text style={styles.completedTitle}>That's everyone!</Text>
          <Text style={styles.completedSubtitle}>Check back later for more profiles</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetDeck}>
            <Text style={styles.resetButtonText}>Start Over</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerSubtitle}>{cardIndex + 1} of {profiles.length}</Text>
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
          stackScale={8}
          stackSeparation={12}
          animateOverlayLabelsOpacity
          overlayLabels={overlayLabels}
          verticalSwipe={false}
          cardVerticalMargin={10}
          cardHorizontalMargin={30}
          swipeAnimationDuration={250}
          disableBottomSwipe={true}
          disableTopSwipe={true}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.passButton]} onPress={swipeLeft}>
          <Text style={styles.buttonIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={swipeRight}>
          <Text style={styles.buttonIcon}>♡</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white'
  },
  headerStats: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600'
  },
  swiperContainer: {
    flex: 1,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardContainer: {
    width: width * 0.85,
    height: height * 0.65,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15
  },
  card: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%'
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 25
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8
  },
  age: {
    fontSize: 22,
    color: 'white',
    fontWeight: '300'
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
    fontWeight: '500'
  },
  bio: {
    fontSize: 15,
    color: 'white',
    marginBottom: 12,
    lineHeight: 20
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  interestText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingBottom: 25,
    paddingTop: 15,
    gap: 50
  },
  actionButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10
  },
  passButton: {
    backgroundColor: '#FF4458'
  },
  likeButton: {
    backgroundColor: '#4DD865'
  },
  buttonIcon: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold'
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10
  },
  completedSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40
  },
  resetButton: {
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea'
  }
})

export default SwipeScreen