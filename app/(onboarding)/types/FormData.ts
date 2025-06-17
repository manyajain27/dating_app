
export interface IFormData {
    name: string;
    dob: string;
    gender: string;
    height: string;
    education: string;
    starSign: string;
    believesInStarSigns?: 'yes' | 'no' | 'kinda'; 
    lookingFor: string[];
    photos: string[];
    location_city: string;
    interests: string[];
    teasers: Record<string, string>;
    children: string;
  }
  


// props that are passed down to every screen component from the main flow controller.
export interface ScreenProps {
  formData: IFormData;
  updateFormData: (field: keyof IFormData, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  handleComplete: () => Promise<void>; // Changed to async
  setShowPhotoTipsModal?: (show: boolean) => void;
  isSaving?: boolean; // Add saving state
}

export interface TeaserCategory {
  id: string;
  title: string;
  teasers: string[];
}

// constants for teaser categories, easily accessible throughout the app.
export const TEASER_CATEGORIES: TeaserCategory[] = [
    {
      id: 'vibe_check',
      title: 'vibe check',
      teasers: [
        'friday night means...',
        'you’ll always catch me...',
        'i’m most myself when...',
        'my toxic trait is...',
        'i judge people for...',
      ],
    },
    {
      id: 'firsts',
      title: 'firsts & favs',
      teasers: [
        'my first crush was...',
        'the first thing i notice about someone...',
        'my go-to comfort movie is...',
        'first date energy =...',
        'favorite random fact about me...',
      ],
    },
    {
      id: 'hot_takes',
      title: 'hot takes',
      teasers: [
        'unpopular opinion:...',
        'dating apps would be better if...',
        'cancel me for this but i...',
        'i don’t trust people who...',
        'this gives me the ick...',
      ],
    },
    {
      id: 'the_deep_end',
      title: 'the deep end',
      teasers: [
        'something i wish more people asked me...',
        'a moment that changed me...',
        'i overthink about...',
        'what i’ve unlearned recently...',
        'i feel most alive when...',
      ],
    },
    {
      id: 'guilty',
      title: 'guilty pleasures',
      teasers: [
        'i pretend to hate it but i love...',
        'i rewatch this way too often...',
        'my search history would expose...',
        'i’d risk it all for...',
        'this makes me feel instantly better...',
      ],
    },
  ];
  
