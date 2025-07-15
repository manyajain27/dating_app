import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { create } from 'zustand';

// This is the full story object we'll use in the viewer
export interface StoryItem {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  user_id: string;
  user_name: string;
  profile_picture: string;
  created_at?: string; // Add created_at to the interface
}

// This is the preview object for the rail on the chat screen
export interface StoryPreview {
  story_id: string;
  user_id: string;
  user_name: string;
  profile_picture: string;
  is_viewed: boolean;
}

interface StoryState {
  storyPreviews: StoryPreview[];
  myStoriesCount: number;
  isViewerVisible: boolean;
  activeUserStories: StoryItem[];
  activeStoryIndex: number;
  loading: boolean;
  uploading: boolean;

  fetchStoryPreviews: (userId: string) => Promise<void>;
  openStoryViewer: (userId: string, viewerId: string) => void;
  closeStoryViewer: () => void;
  nextStory: () => void;
  previousStory: () => void;
  markStoryAsViewed: (storyId: string, viewerId: string) => void;
  createStory: (userId: string) => Promise<void>;
  deleteStory: (storyId: string, currentUserId: string) => Promise<void>; // Added deleteStory
}

export const useStoryStore = create<StoryState>((set, get) => ({
  storyPreviews: [],
  myStoriesCount: 0,
  isViewerVisible: false,
  activeUserStories: [],
  activeStoryIndex: 0,
  loading: false,
  uploading: false,

  // Fetch story previews for the chat screen rail
  fetchStoryPreviews: async (userId: string) => {
    set({ loading: true });
    try {
      const { data: previews, error: previewError } = await supabase.rpc('get_matched_users_stories', { p_user_id: userId });
      if (previewError) throw previewError;
      set({ storyPreviews: previews || [] });

      const { count, error: countError } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('user_id', userId).gt('expires_at', new Date().toISOString());
      if (countError) throw countError;
      set({ myStoriesCount: count || 0 });
    } catch (error) {
      console.error("Error fetching story previews:", error);
    } finally {
      set({ loading: false });
    }
  },

  // Open the viewer and load all stories for the selected user
  openStoryViewer: async (userId: string, viewerId: string) => {
    set({ loading: true, isViewerVisible: true, activeUserStories: [] });
    try {
      const { data, error } = await supabase.rpc('get_all_stories_by_user', { p_user_id: userId, p_viewer_id: viewerId });
      if (error) throw error;
      
      const stories: StoryItem[] = data.map((s: any) => ({
        id: s.story_id,
        media_url: s.media_url,
        media_type: s.media_type,
        user_id: s.user_id,
        user_name: s.user_name,
        profile_picture: s.profile_picture,
        created_at: s.created_at, // Ensure this is returned from your RPC
      }));

      set({ activeUserStories: stories, activeStoryIndex: 0 });
      if (stories.length > 0) {
        get().markStoryAsViewed(stories[0].id, viewerId);
      }
    } catch (error) {
      console.error("Error opening story viewer:", error);
      set({ isViewerVisible: false });
    } finally {
        set({ loading: false });
    }
  },
  
  closeStoryViewer: () => {
    set({ isViewerVisible: false, activeUserStories: [], activeStoryIndex: 0 });
  },

  // Navigate within the viewer
  nextStory: () => {
    const { activeStoryIndex, activeUserStories, closeStoryViewer } = get();
    if (activeStoryIndex < activeUserStories.length - 1) {
      set({ activeStoryIndex: activeStoryIndex + 1 });
    } else {
      closeStoryViewer();
    }
  },

  previousStory: () => {
    const { activeStoryIndex } = get();
    if (activeStoryIndex > 0) {
      set({ activeStoryIndex: activeStoryIndex - 1 });
    }
  },

  markStoryAsViewed: async (storyId: string, viewerId: string) => {
    try {
      await supabase.from('story_views').insert({ story_id: storyId, viewer_id: viewerId });
    } catch (error) {
      const RLS_ERROR_CODE = '23505'; // Unique violation
      if ((error as any)?.code !== RLS_ERROR_CODE) {
        console.error("Error marking story as viewed:", error);
      }
    }
  },

  // The complete creation flow
  createStory: async (userId: string) => {
    if (!userId) {
      alert("You must be logged in to create a story.");
      return;
    }
  
    set({ uploading: true });
  
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true, // ✅ allow multiple
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        selectionLimit: 5, // you can limit how many
      });
  
      if (result.canceled || !result.assets?.length) {
        set({ uploading: false });
        return;
      }
  
      for (const asset of result.assets) {
        const fileUri = asset.uri;
        const fileType = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
        const fileExt = asset.type === 'video' ? 'mp4' : 'jpg';
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;
  
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
  
        const { error: uploadError } = await supabase.storage
          .from('stories')
          .upload(filePath, decode(base64), {
            contentType: fileType,
          });
  
        if (uploadError) throw uploadError;
  
        const { data: urlData } = supabase.storage
          .from('stories')
          .getPublicUrl(filePath);
  
        if (!urlData?.publicUrl) throw new Error('Could not get public URL');
  
        const { error: insertError } = await supabase
          .from('stories')
          .insert({
            user_id: userId,
            media_url: urlData.publicUrl,
            media_type: asset.type,
          });
  
        if (insertError) throw insertError;
      }
  
      await get().fetchStoryPreviews(userId);
      router.replace('/chat');
  
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      set({ uploading: false });
    }
  },  

  // --- NEWLY ADDED DELETION LOGIC ---
  deleteStory: async (storyId: string, currentUserId: string) => {
    const { activeUserStories, activeStoryIndex, closeStoryViewer, fetchStoryPreviews } = get();

    // Store original state in case we need to revert on error
    const originalStories = [...activeUserStories];
    const storyToDelete = originalStories.find(s => s.id === storyId);

    if (!storyToDelete) return; // Should not happen, but a good safeguard

    // --- 1. Optimistic UI Update ---
    // This is the part that runs immediately to make the UI feel fast.
    const newActiveStories = originalStories.filter(s => s.id !== storyId);

    // If we just deleted the last story, close the viewer and we're done.
    if (newActiveStories.length === 0) {
      closeStoryViewer();
      router.replace('/chat');
    } else {
      // If stories remain, calculate the correct new index.
      // If the old index is now out of bounds (we deleted the last item),
      // then move to the new last item. Otherwise, the index stays the same.
      const newIndex = activeStoryIndex >= newActiveStories.length
        ? newActiveStories.length - 1
        : activeStoryIndex;

      set({
        activeUserStories: newActiveStories,
        activeStoryIndex: newIndex,
      });
    }

    // --- 2. Background Database and Storage Deletion ---
    // This happens after the UI has already updated.
    try {
      // Delete the record from the 'stories' table
      const { error: deleteError } = await supabase.from('stories').delete().match({ id: storyId });
      if (deleteError) throw deleteError;

      // Extract the file path from the URL to delete from Storage
      const filePath = storyToDelete.media_url.split('/stories/')[1];
      if (filePath) {
        const { error: storageError } = await supabase.storage.from('stories').remove([filePath]);
        if (storageError) {
          // Log this error but don't revert the UI, as the main record is gone.
          console.error("Failed to delete from storage, but DB record was removed:", storageError);
        }
      }
      // Refresh the story previews on the main chat screen in the background
      await fetchStoryPreviews(currentUserId);
    } catch (error) {
      console.error("Error deleting story from database:", error);
      // If the database deletion fails, revert the UI to its original state
      alert("Failed to delete story. Please try again.");
      set({ activeUserStories: originalStories, activeStoryIndex });
    }
  },
}));