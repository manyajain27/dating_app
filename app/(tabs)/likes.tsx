import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { X, Heart, SlidersHorizontal } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

type MatchCard = {
  id: string;
  created_at: string;
  name: string;
  age: number;
  avatar_url: string;
};

const MatchesScreen: React.FC = () => {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        matched_at,
        user1:profiles!matches_user1_id_fkey (
          id, name, age, profile_pictures
        ),
        user2:profiles!matches_user2_id_fkey (
          id, name, age, profile_pictures
        )
      `)
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order('matched_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      setLoading(false);
      return;
    }

    const cleaned: MatchCard[] = data.map((match: any) => {
      const other = match.user1?.id === currentUserId ? match.user2 : match.user1;
      return {
        id: match.id,
        created_at: match.matched_at,
        name: other?.name || 'Unknown',
        age: other?.age || 0,
        avatar_url: other?.profile_pictures?.[0] || 'https://via.placeholder.com/150',
      };
    });

    setMatches(cleaned);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserId) fetchMatches();
  }, [currentUserId]);

  const groupMatches = () => {
    const today = dayjs().format('YYYY-MM-DD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const todayMatches = matches.filter(m => dayjs(m.created_at).format('YYYY-MM-DD') === today);
    const yesterdayMatches = matches.filter(m => dayjs(m.created_at).format('YYYY-MM-DD') === yesterday);
    const otherMatches = matches.filter(m => !todayMatches.includes(m) && !yesterdayMatches.includes(m));
    return [
      { title: 'Today', data: todayMatches },
      { title: 'Yesterday', data: yesterdayMatches },
      { title: 'Earlier', data: otherMatches },
    ];
  };

  const renderCard = ({ item }: { item: MatchCard }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.avatar_url }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.name}>{item.name}, {item.age}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Heart size={20} color="#fff" fill="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Your Matches</Text>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={18} color="#333" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>This is a list of people who have liked you and your matches.</Text>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : matches.length === 0 ? (
        <Text style={styles.emptyText}>No matches yet</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {groupMatches().map(section =>
            section.data.length > 0 && (
              <View key={section.title}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <FlatList
                  data={section.data}
                  renderItem={renderCard}
                  keyExtractor={item => item.id}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={{ justifyContent: 'space-between' }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                />
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const CARD_WIDTH = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#999',
  },
  card: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#ccc',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MatchesScreen;
