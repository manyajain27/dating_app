import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Video } from 'expo-av';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ListRenderItem,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Carousel from 'react-native-snap-carousel';

const { width: screenWidth } = Dimensions.get('window');

interface Post {
  id: string;
  user_id: string;
  caption?: string;
  media_urls: string[];
  media_type: string;
  location?: string;
  is_archived: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  isLiked: boolean;
  profiles: {
    id: string;
    name: string;
    profile_pictures: string[];
  };
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    name: string;
    profile_pictures: string[];
  };
}

interface Match {
  user1_id: string;
  user2_id: string;
}

// --- OPTIMIZED IMAGE COMPONENT ---
const OptimizedImage: React.FC<{ source: { uri?: string } | null; style?: any; placeholder?: boolean }> = ({ source, style, placeholder = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (source?.uri) {
    return (
      <View style={[style, { backgroundColor: '#f5f5f5' }]}>
        {loading && !error && (
          <View style={[style, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1 }]}>
            <ActivityIndicator size="small" color="#ff3b5c" />
          </View>
        )}
        {error && (
          <View style={[style, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1 }]}>
            <Text style={{ color: 'red', fontSize: 12 }}>Failed to load</Text>
          </View>
        )}
        <Image
          source={{ uri: source.uri }}
          style={[style, { opacity: loading ? 0 : 1 }]}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <Image
      source={require('@/assets/images/default-avatar.png')}
      style={style}
      contentFit="cover"
    />
  );
};

const HomeScreen: React.FC = () => {
  const { profile: currentUser, user, session, setTabBarVisible } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [commentsModalVisible, setCommentsModalVisible] = useState<boolean>(false);
  const [postMedia, setPostMedia] = useState<{ uri: string; type: 'image' | 'video' }[]>([]);
  const [postCaption, setPostCaption] = useState<string>('');
  const [carouselIndices, setCarouselIndices] = useState<{ [postId: string]: number }>({});
  const [isAndroid] = useState(Platform.OS === 'android');
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%', '85%'], []);


  // Toggle tab bar visibility on Android when comments modal opens/closes
  useEffect(() => {
    if (isAndroid) {
      setTabBarVisible(!commentsModalVisible);
    }
    // Cleanup to restore tab bar visibility when modal closes or component unmounts
    return () => {
      if (isAndroid) {
        setTabBarVisible(true);
      }
    };
  }, [commentsModalVisible, isAndroid, setTabBarVisible]);

  const handleCreatePost = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    setPostMedia([]);
    setPostCaption('');
  }, []);

  
  const fetchPosts = async (): Promise<Post[]> => {
    if (!user) return [];

    const { data: matchedUsers, error: matchError } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (matchError) throw matchError;

    const matchedUserIds = matchedUsers?.map((match: Match) =>
      match.user1_id === user.id ? match.user2_id : match.user1_id
    ) || [];
    const userIdsToFetch = [...new Set([...matchedUserIds, user.id])];

    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        id, user_id, caption, media_urls, media_type, location, likes_count, comments_count, created_at, is_archived,
        profiles!posts_user_id_fkey (id, name, profile_pictures),
        post_likes!post_likes_post_id_fkey (user_id)
      `)
      .in('user_id', userIdsToFetch)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const postsWithLikeStatus: Post[] = postsData?.map((post: any) => ({
      ...post,
      isLiked: post.post_likes?.some((like: any) => like.user_id === user.id) || false,
    })) || [];

    return postsWithLikeStatus;
  };

  const fetchComments = async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`*, profiles!post_comments_user_id_fkey (id, name, profile_pictures)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };



  // --- DATA FETCHING WITH REACT QUERY ---
  const {
    data: posts = [],
    isLoading,
    refetch,
    isRefetching
  } = useQuery<Post[], Error>({
    queryKey: ['posts', user?.id],
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000,
    enabled: !!user && !!currentUser,
  });

  const {
    data: comments = [],
    isLoading: commentsLoading
  } = useQuery<Comment[], Error>({
    queryKey: ['comments', selectedPost?.id],
    queryFn: () => fetchComments(selectedPost!.id),
    enabled: !!selectedPost,
    staleTime: 2 * 60 * 1000,
  });

  const likeMutation = useMutation<void, Error, { postId: string; isLiked: boolean }, { previousPosts?: Post[] }>({
    mutationFn: async ({ postId, isLiked }) => {
      if (isLiked) {
        const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['posts', user?.id] });
      const previousPosts = queryClient.getQueryData<Post[]>(['posts', user?.id]);
      queryClient.setQueryData<Post[]>(['posts', user?.id], (old) =>
        old?.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: !isLiked,
                likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
              }
            : post
        ) || []
      );
      return { previousPosts };
    },
    onError: (error: Error, variables, context) => {
      console.error('Error liking post:', error);
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', user?.id], context.previousPosts);
      }
      Alert.alert('Error', 'Could not update like status.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', user?.id] });
    },
  });

  const commentMutation = useMutation<any, Error, { postId: string; content: string }>({
    mutationFn: async ({ postId, content }) => {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: user!.id, content })
        .select('*, profiles!post_comments_user_id_fkey (id, name, profile_pictures)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(['comments', selectedPost?.id], (old) =>
        [newComment, ...(old || [])]
      );
      queryClient.setQueryData<Post[]>(['posts', user?.id], (old) =>
        old?.map(post =>
          post.id === selectedPost?.id
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ) || []
      );
      setCommentText('');
    },
    onError: (error: Error) => {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comments', selectedPost?.id] });
    },
  });

  const createPostMutation = useMutation<any, Error, { media: { uri: string; type: 'image' | 'video' }[]; caption: string }>({
    mutationFn: async ({ media, caption }) => {
      const mediaUrls: string[] = [];
      const mediaType = media.some(item => item.type === 'video') ? 'video' : 'image';
      for (const item of media) {
        const fileExt = item.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${user!.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const contentType = item.type === 'image' ? `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}` : `video/${fileExt}`;
        const file = {
          uri: item.uri,
          type: contentType,
          name: fileName,
        } as any;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file, {
            contentType,
            upsert: false,
          });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        if (!urlData?.publicUrl) throw new Error('Could not get public URL.');
        mediaUrls.push(urlData.publicUrl);
      }
      const newPostPayload = {
        user_id: user!.id,
        media_urls: mediaUrls,
        media_type: mediaType,
        caption: caption.trim(),
        likes_count: 0,
        comments_count: 0,
      };
      const { data: newPostData, error: insertError } = await supabase
        .from('posts')
        .insert(newPostPayload)
        .select(`
          *,
          profiles!posts_user_id_fkey (id, name, profile_pictures)
        `)
        .single();
      if (insertError) throw insertError;
      return {
        ...newPostData,
        isLiked: false,
      };
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<Post[]>(['posts', user?.id], (old) =>
        [newPost, ...(old || [])]
      );
      handleCloseBottomSheet();
      Alert.alert('Success', 'Your post has been shared!');
    },
    onError: (error: Error) => {
      console.error('Error creating post:', error);
      Alert.alert('Upload Failed', error.message || 'There was an issue uploading your post.');
    },
  });

  const handleLike = (postId: string) => {
    const post = (posts as Post[]).find((p: Post) => p.id === postId);
    if (!post || !user) return;
    likeMutation.mutate({ postId, isLiked: post.isLiked });
  };

  const handleComment = () => {
    if (!commentText.trim() || !user || !selectedPost) return;
    commentMutation.mutate({
      postId: selectedPost.id,
      content: commentText.trim()
    });
  };

  const openComments = (post: Post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
  };

  const closeComments = () => {
    setCommentsModalVisible(false);
    setSelectedPost(null);
    setCommentText('');
    Keyboard.dismiss();
  };

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant media library permissions to select content.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 10, // Increase upload limit to 10
    });

    if (!result.canceled) {
      const selectedMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image' as 'image' | 'video'
      }));
      setPostMedia(selectedMedia);
    }
  };

  const handleCreatePostSubmit = () => {
    if (!postMedia.length || !user || !currentUser) return;
    createPostMutation.mutate({
      media: postMedia,
      caption: postCaption
    });
  };

  const onRefresh = () => {
    refetch();
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);
    if (diffInSeconds < 60) return 'now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return `${Math.floor(diffInDays / 7)}w`;
  };

  // Fix renderMediaItem signature for Carousel
  const renderMediaItem = ({ item }: { item: { uri: string; type: 'image' | 'video' } }, carouselRef: any, activeIndex: number) => {
  if (item.type === 'video') {
    return (
      <View style={styles.mediaContainer}>
        <Video
          source={{ uri: item.uri }}
          style={styles.mediaItem}
          useNativeControls
          resizeMode="cover"
          isLooping
        />
      </View>
    );
  }
  return (
    <View style={styles.mediaContainer}>
      <OptimizedImage
        source={{ uri: item.uri }}
        style={styles.mediaItem}
      />
    </View>
  );
};

  const renderPost: ListRenderItem<Post> = ({ item: post }) => {
    const profilePicture = post.profiles?.profile_pictures?.[0] || null;
  
    return (
      <View style={styles.postContainer}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <OptimizedImage
              source={profilePicture ? { uri: profilePicture } : null}
              style={styles.profilePicture}
              placeholder
            />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{post.profiles?.name || 'Unknown'}</Text>
              {post.location && <Text style={styles.location}>{post.location}</Text>}
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        </View>
  
        <View style={styles.carouselContainer}>
          <Carousel
            data={post.media_urls.map(url => ({ uri: url, type: post.media_type as 'image' | 'video' }))}
            renderItem={(item, carouselRef) => renderMediaItem(item, carouselRef, carouselIndices[post.id] || 0)}
            sliderWidth={screenWidth}
            itemWidth={screenWidth}
            layout="default"
            vertical={false}
            onSnapToItem={(index) => setCarouselIndices(prev => ({ ...prev, [post.id]: index }))}
          />
          {post.media_urls.length > 1 && (
            <>
              <View style={styles.carouselDotsContainer}>
                {post.media_urls.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.carouselDot,
                      index === (carouselIndices[post.id] || 0) ? styles.carouselDotActive : styles.carouselDotInactive,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.carouselIndicator}>
                <Text style={styles.carouselIndicatorText}>
                  {(carouselIndices[post.id] || 0) + 1}/{post.media_urls.length}
                </Text>
              </View>
            </>
          )}
        </View>
  
        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              onPress={() => handleLike(post.id)}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={post.isLiked ? "heart" : "heart-outline"}
                size={24}
                color={post.isLiked ? "#ff3b5c" : "#262626"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openComments(post)}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#262626" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="paper-plane-outline" size={22} color="#262626" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="bookmark-outline" size={22} color="#262626" />
          </TouchableOpacity>
        </View>
  
        <View style={styles.postInfo}>
          {post.likes_count > 0 && (
            <Text style={styles.likesText}>{post.likes_count.toLocaleString()} likes</Text>
          )}
          {post.caption && (
            <Text style={styles.caption} numberOfLines={3}>
              <Text style={styles.captionUsername}>{post.profiles?.name} </Text>
              {post.caption}
            </Text>
          )}
          {post.comments_count > 0 && (
            <TouchableOpacity onPress={() => openComments(post)} style={styles.viewCommentsButton}>
              <Text style={styles.viewCommentsText}>View all {post.comments_count} comments</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = (): React.ReactElement => (
    <View style={styles.emptyState}>
      <Ionicons name="camera-outline" size={64} color="#c7c7cc" />
      <Text style={styles.emptyStateTitle}>No Posts Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Be the first to share a moment or start swiping to see posts from your matches.
      </Text>
    </View>
  );

  const renderComment: ListRenderItem<Comment> = ({ item: comment }) => (
    <View style={styles.commentContainer}>
      <OptimizedImage
        source={comment.profiles?.profile_pictures?.[0]
          ? { uri: comment.profiles.profile_pictures[0] }
          : null}
        style={styles.commentProfilePicture}
        placeholder
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>
          <Text style={styles.commentUsername}>{comment.profiles?.name || 'Unknown'} </Text>
          {comment.content}
        </Text>
        <Text style={styles.commentTime}>{formatTime(comment.created_at)}</Text>
      </View>
    </View>
  );

  if (!currentUser || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style='dark'/>
        <View style={styles.emptyState}>
          <Ionicons name="heart-circle-outline" size={64} color="#ff3b5c" />
          <Text style={styles.emptyStateTitle}>Welcome to Soulmate</Text>
          <Text style={styles.emptyStateSubtitle}>Please complete your profile to start seeing posts!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style='dark' />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Soulmate</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleCreatePost}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add-circle-outline" size={28} color="#262626" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chatbubbles-outline" size={26} color="#262626" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff3b5c" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor="#ff3b5c"
              colors={['#ff3b5c']}
            />
          }
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.feedContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: screenWidth + 200,
            offset: (screenWidth + 200) * index,
            index,
          })}
        />
      )}

{isAndroid ? (
  // Android: Use a full-screen view with KeyboardAvoidingView
  commentsModalVisible && (
    <View style={styles.androidModalOverlay}>
      <SafeAreaView style={styles.androidModalContainer} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.androidModalContainer}
          behavior="padding"
          keyboardVerticalOffset={0} // Reduced to minimize extra padding
          keyboardShouldPersistTaps="handled" // Ensure taps dismiss keyboard
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeComments}
              style={styles.modalCloseButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#262626" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={styles.modalSpacer} />
          </View>

          {commentsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ff3b5c" />
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              style={styles.commentsList}
              contentContainerStyle={styles.commentsListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          <View style={styles.androidCommentInputContainer}>
            <TextInput
              style={styles.commentTextInput}
              placeholder="Add a comment..."
              placeholderTextColor="#8e8e93"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleComment}
            />
            <TouchableOpacity
              onPress={handleComment}
              disabled={!commentText.trim() || commentMutation.isPending}
              style={styles.commentSendButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {commentMutation.isPending ? (
                <ActivityIndicator size="small" color="#ff3b5c" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={commentText.trim() ? "#ff3b5c" : "#c7c7cc"}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
) : (
  // iOS: Keep the original Modal (unchanged)
  <Modal
    visible={commentsModalVisible}
    animationType="slide"
    onRequestClose={closeComments}
    presentationStyle="formSheet"
  >
    <SafeAreaView style={styles.modalContainer} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={closeComments}
            style={styles.modalCloseButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-down" size={28} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Comments</Text>
          <View style={styles.modalSpacer} />
        </View>

        {commentsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#ff3b5c" />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentTextInput}
            placeholder="Add a comment..."
            placeholderTextColor="#8e8e93"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleComment}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleComment}
            disabled={!commentText.trim() || commentMutation.isPending}
            style={styles.commentSendButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {commentMutation.isPending ? (
              <ActivityIndicator size="small" color="#ff3b5c" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() ? "#ff3b5c" : "#c7c7cc"}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>
)}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.bottomSheetInner}>
              <Text style={styles.bottomSheetTitle}>Create a Post</Text>
              
              <BottomSheetTextInput
                style={styles.postCaptionInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#8e8e93"
                value={postCaption}
                onChangeText={setPostCaption}
                multiline
                maxLength={2200}
                textAlignVertical="top"
              />
              
              {postMedia.length > 0 && (
                <View style={styles.imagePreviewContainer}>
                  <FlatList
                    data={postMedia}
                    renderItem={({ item, index }) => (
                      <View style={styles.mediaPreviewWrapper}>
                        {item.type === 'video' ? (
                          <View style={styles.mediaPreview}>
                            <Text style={styles.videoPlaceholder}>Video Preview</Text>
                          </View>
                        ) : (
                          <OptimizedImage
                            source={{ uri: item.uri }}
                            style={styles.mediaPreview}
                          />
                        )}
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => setPostMedia(prev => prev.filter((_, i) => i !== index))}
                          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                        >
                          <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.9)" />
                        </TouchableOpacity>
                      </View>
                    )}
                    keyExtractor={(_, index) => index.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.mediaPreviewList}
                  />
                </View>
              )}
              
              <View style={styles.bottomSheetActions}>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={handlePickMedia}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="image-outline" size={22} color="#ff3b5c" />
                  <Text style={styles.imagePickerText}>Photo/Video</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.postSubmitButton,
                    { opacity: (createPostMutation.isPending || (!postCaption.trim() && !postMedia.length)) ? 0.5 : 1 }
                  ]}
                  onPress={handleCreatePostSubmit}
                  disabled={createPostMutation.isPending || (!postCaption.trim() && !postMedia.length)}
                >
                  {createPostMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.postSubmitText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#ff3b5c',
    letterSpacing: -0.5,
  },
  headerActions: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerButton: { 
    marginLeft: 20,
    padding: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Feed
  feedContainer: {
    paddingBottom: 100,
  },

  // Post Item
  postContainer: { 
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  postHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
  },
  profilePicture: { 
    width: 36, 
    height: 36, 
    borderRadius: 18,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#262626',
    lineHeight: 18,
  },
  location: { 
    fontSize: 12, 
    color: '#8e8e93',
    lineHeight: 16,
    marginTop: 1,
  },
  moreButton: {
    padding: 8,
  },
  
  // Post Image
  postImage: { 
    width: screenWidth, 
    height: screenWidth,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  
  // Post Actions
  postActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  leftActions: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  actionButton: { 
    marginRight: 16,
    padding: 4,
  },
  
  // Post Info
  postInfo: { 
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  likesText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#262626',
    lineHeight: 18,
  },
  caption: { 
    fontSize: 14, 
    color: '#262626',
    lineHeight: 20,
    marginTop: 4,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewCommentsButton: {
    marginTop: 6,
  },
  viewCommentsText: { 
    fontSize: 14, 
    color: '#8e8e93',
    lineHeight: 18,
  },
  timeText: { 
    fontSize: 12, 
    color: '#c7c7cc',
    marginTop: 6,
    lineHeight: 16,
  },

  // Empty State
  emptyContainer: { 
    flex: 1 
  },
  emptyState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40,
  },
  emptyStateTitle: { 
    fontSize: 22, 
    fontWeight: '600', 
    color: '#262626',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: { 
    fontSize: 16, 
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Modal
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dbdbdb',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#262626',
    textAlign: 'center',
    flex: 1,
  },
  modalSpacer: {
    width: 36,
  },

  // Comments
  commentsList: { 
    flex: 1 
  },
  commentsListContent: { 
    paddingBottom: 20 
  },
  commentContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  commentProfilePicture: { 
    width: 32, 
    height: 32, 
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: { 
    flex: 1 
  },
  commentText: { 
    fontSize: 14, 
    color: '#262626',
    lineHeight: 20,
  },
  commentUsername: { 
    fontWeight: '600' 
  },
  commentTime: { 
    fontSize: 12, 
    color: '#8e8e93',
    marginTop: 4,
    lineHeight: 16,
  },
  commentInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 72,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dbdbdb',
    backgroundColor: '#ffffff'
  },
  commentTextInput: { 
    flex: 1, 
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#262626',
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f8f8f8',
  },
  commentSendButton: {
    padding: 8,
  },

  // Bottom Sheet
  bottomSheetBackground: { 
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandle: { 
    backgroundColor: '#c7c7cc',
    width: 36,
    height: 4,
  },
  bottomSheetContent: { 
    flex: 1,
    paddingHorizontal: 20,
  },
  bottomSheetInner: { 
    flex: 1 
  },
  bottomSheetTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#262626',
    textAlign: 'center',
    marginBottom: 20,
  },
  postCaptionInput: { 
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#262626',
    minHeight: 100,
    backgroundColor: '#f8f8f8',
    marginBottom: 20,
  },
  imagePreviewContainer: { 
    position: 'relative',
    marginBottom: 20,
  },
  imagePreview: { 
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: { 
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  bottomSheetActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 20,
  },
  imagePickerButton: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff3b5c',
  },
  imagePickerText: { 
    fontSize: 16, 
    color: '#ff3b5c',
    marginLeft: 8,
    fontWeight: '500',
  },
  postSubmitButton: { 
    backgroundColor: '#ff3b5c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  postSubmitText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#ffffff' 
  },
  mediaContainer: {
    width: screenWidth,
    height: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  mediaItem: {
    width: screenWidth,
    height: screenWidth,
  },
  videoPlaceholder: {
    color: '#fff',
    fontSize: 16,
  },
  mediaPreviewWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  mediaPreviewList: {
    paddingHorizontal: 10,
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselDotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  carouselDotActive: {
    backgroundColor: '#ff3b5c',
  },
  carouselDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  carouselIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Add these to your styles object
androidModalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#ffffff',
  zIndex: 1000,
},
androidModalContainer: {
  flex: 1,
  backgroundColor: '#ffffff',
  marginBottom: 10,

},
androidCommentInputContainer: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: '#dbdbdb',
  backgroundColor: '#ffffff',
},

});

export default HomeScreen;