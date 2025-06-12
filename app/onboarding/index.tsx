import { Calendar, Camera, Check, ChevronLeft, GraduationCap, Heart, MapPin, Plus, Ruler, Sparkles, Star, Users, X } from 'lucide-react';
import React, { useState } from 'react';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    height: '',
    education: '',
    starSign: '',
    lookingFor: [],
    photos: [],
    location: '',
    interests: [],
    teasers: {},
    children: ''
  });
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showPhotoTipsModal, setShowPhotoTipsModal] = useState(false);

  const steps = [
    'name', 'dob', 'gender', 'height', 'starSign', 'education', 
    'lookingFor', 'photos', 'location', 'interests', 'teasers', 'children', 'complete'
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1) { // DOB step triggers age modal
      setShowAgeModal(true);
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const confirmAge = () => {
    setShowAgeModal(false);
    setCurrentStep(prev => prev + 1);
  };

  const handleComplete = () => {
    // Here you would typically send the formData to your backend API
    console.log('Onboarding complete. Final data:', formData);
    nextStep(); // Move to the final success screen
  };

  // Name Screen
  const NameScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-4">what's your name?</h1>
          <p className="text-purple-200">let's keep it real</p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
            placeholder="your first name"
            autoFocus
          />
        </div>
        
        <button
          onClick={nextStep}
          disabled={!formData.name.trim()}
          className={`w-full mt-8 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
            formData.name.trim() 
              ? 'bg-white text-purple-900 hover:bg-purple-50 transform hover:scale-105' 
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          continue
        </button>
      </div>
    </div>
  );

  // DOB Screen
  const DOBScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-pink-900 via-rose-900 to-orange-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Calendar className="w-16 h-16 text-pink-200 mx-auto mb-6" />
          <h1 className="text-4xl font-light text-white mb-4">when were you born?</h1>
          <p className="text-pink-200">we need to verify you're 18+</p>
        </div>
        
        <input
          type="date"
          value={formData.dob}
          onChange={(e) => updateFormData('dob', e.target.value)}
          className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-300"
        />
        
        <button
          onClick={nextStep}
          disabled={!formData.dob}
          className={`w-full mt-8 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
            formData.dob 
              ? 'bg-white text-pink-900 hover:bg-pink-50 transform hover:scale-105' 
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          continue
        </button>
      </div>
    </div>
  );

  // Age Confirmation Modal
  const AgeModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">age verification</h2>
          <p className="text-gray-600 mb-8">you must be 18 or older to use this app. by continuing, you confirm that you meet this requirement.</p>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowAgeModal(false)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
            >
              cancel
            </button>
            <button
              onClick={confirmAge}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-medium hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Gender Screen
  const GenderScreen = () => {
    const genders = ['woman', 'man', 'non-binary', 'prefer not to say'];
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-teal-900 via-cyan-900 to-blue-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <Users className="w-16 h-16 text-teal-200 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-white mb-4">i am a</h1>
            <p className="text-teal-200">express yourself authentically</p>
          </div>
          
          <div className="space-y-4">
            {genders.map((gender) => (
              <button
                key={gender}
                onClick={() => updateFormData('gender', gender)}
                className={`w-full px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
                  formData.gender === gender
                    ? 'bg-white text-teal-900 transform scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
          
          {formData.gender && (
            <button
              onClick={nextStep}
              className="w-full mt-8 px-6 py-4 bg-white text-teal-900 rounded-2xl font-medium hover:bg-teal-50 transform hover:scale-105 transition-all duration-300"
            >
              continue
            </button>
          )}
        </div>
      </div>
    );
  };

  // Height Screen
  const HeightScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Ruler className="w-16 h-16 text-emerald-200 mx-auto mb-6" />
          <h1 className="text-4xl font-light text-white mb-4">how tall are you?</h1>
          <p className="text-emerald-200">just curious</p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={formData.height}
            onChange={(e) => updateFormData('height', e.target.value)}
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-300"
            placeholder="5'8&quot; or 173cm"
          />
        </div>
        
        <button
          onClick={nextStep}
          disabled={!formData.height.trim()}
          className={`w-full mt-8 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
            formData.height.trim() 
              ? 'bg-white text-emerald-900 hover:bg-emerald-50 transform hover:scale-105' 
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          continue
        </button>
      </div>
    </div>
  );

  // Star Sign Screen
  const StarSignScreen = () => {
    const signs = [
      'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
    ];
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <Star className="w-16 h-16 text-violet-200 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-white mb-4">what's your sign?</h1>
            <p className="text-violet-200">cosmic compatibility</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {signs.map((sign) => (
              <button
                key={sign}
                onClick={() => updateFormData('starSign', sign)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  formData.starSign === sign
                    ? 'bg-white text-violet-900 transform scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {sign}
              </button>
            ))}
          </div>
          
          {formData.starSign && (
            <button
              onClick={nextStep}
              className="w-full mt-8 px-6 py-4 bg-white text-violet-900 rounded-2xl font-medium hover:bg-violet-50 transform hover:scale-105 transition-all duration-300"
            >
              continue
            </button>
          )}
        </div>
      </div>
    );
  };

  // Education Screen
  const EducationScreen = () => {
    const educationLevels = [
      'high school', 'some college', 'bachelors degree', 'masters degree', 
      'phd', 'trade school', 'prefer not to say'
    ];
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <GraduationCap className="w-16 h-16 text-indigo-200 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-white mb-4">education level?</h1>
            <p className="text-indigo-200">just getting to know you</p>
          </div>
          
          <div className="space-y-4">
            {educationLevels.map((level) => (
              <button
                key={level}
                onClick={() => updateFormData('education', level)}
                className={`w-full px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
                  formData.education === level
                    ? 'bg-white text-indigo-900 transform scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          
          {formData.education && (
            <button
              onClick={nextStep}
              className="w-full mt-8 px-6 py-4 bg-white text-indigo-900 rounded-2xl font-medium hover:bg-indigo-50 transform hover:scale-105 transition-all duration-300"
            >
              continue
            </button>
          )}
        </div>
      </div>
    );
  };

  // Looking For Screen
  const LookingForScreen = () => {
    const options = [
      'long term relationship', 'short term dating', 'friends with benefits', 
      'situationship', 'one night stand', 'just friends', 'figuring it out'
    ];
    
    const toggleOption = (option) => {
      const current = formData.lookingFor || [];
      if (current.includes(option)) {
        updateFormData('lookingFor', current.filter(item => item !== option));
      } else {
        updateFormData('lookingFor', [...current, option]);
      }
    };
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-rose-900 via-pink-900 to-red-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <Heart className="w-16 h-16 text-rose-200 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-white mb-4">what are you looking for?</h1>
            <p className="text-rose-200">select all that apply</p>
          </div>
          
          <div className="space-y-4">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className={`w-full px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
                  formData.lookingFor?.includes(option)
                    ? 'bg-white text-rose-900 transform scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          
          {formData.lookingFor?.length > 0 && (
            <button
              onClick={nextStep}
              className="w-full mt-8 px-6 py-4 bg-white text-rose-900 rounded-2xl font-medium hover:bg-rose-50 transform hover:scale-105 transition-all duration-300"
            >
              continue
            </button>
          )}
        </div>
      </div>
    );
  };

  // Photos Screen
  const PhotosScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-amber-900 via-orange-900 to-red-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <Camera className="w-16 h-16 text-amber-200 mx-auto mb-6" />
          <h1 className="text-4xl font-light text-white mb-4">add your photos</h1>
          <p className="text-amber-200">show your best self (min. 1 photo)</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="aspect-square bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all duration-300 group"
              // Add onClick to handle photo uploads
            >
              <Plus className="w-8 h-8 text-white/50 group-hover:text-white group-hover:scale-110 transition-all" />
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowPhotoTipsModal(true)}
          className="w-full mb-4 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-medium hover:bg-white/20 transition-all duration-300"
        >
          photo tips
        </button>
        
        <button
          onClick={nextStep}
          // disabled={formData.photos.length === 0} // Enable this once photo upload logic is implemented
          className={`w-full px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
            true // formData.photos.length > 0
            ? 'bg-white text-amber-900 hover:bg-amber-50 transform hover:scale-105'
            : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          continue
        </button>
      </div>
    </div>
  );

  // Photo Tips Modal
  const PhotoTipsModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">photo tips</h2>
          <button
            onClick={() => setShowPhotoTipsModal(false)}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">natural lighting is everything</h3>
            <p className="text-gray-600 text-sm">take photos near windows or outdoors during golden hour</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">show your genuine smile</h3>
            <p className="text-gray-600 text-sm">think of something that makes you happy</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">variety is key</h3>
            <p className="text-gray-600 text-sm">mix close-ups, full body, and activity shots</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">be yourself</h3>
            <p className="text-gray-600 text-sm">authentic photos attract the right people</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Location Screen
  const LocationScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-cyan-900 via-teal-900 to-emerald-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <MapPin className="w-16 h-16 text-cyan-200 mx-auto mb-6" />
          <h1 className="text-4xl font-light text-white mb-4">where are you based?</h1>
          <p className="text-cyan-200">we'll find people nearby</p>
        </div>
        
        <input
          type="text"
          value={formData.location}
          onChange={(e) => updateFormData('location', e.target.value)}
          className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300"
          placeholder="city, state"
        />
        
        <button
          onClick={nextStep}
          disabled={!formData.location.trim()}
          className={`w-full mt-8 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
            formData.location.trim() 
              ? 'bg-white text-cyan-900 hover:bg-cyan-50 transform hover:scale-105' 
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          continue
        </button>
      </div>
    </div>
  );

  // Interests Screen
  const InterestsScreen = () => {
    const interests = [
      'music', 'travel', 'fitness', 'food', 'art', 'movies', 'books', 'gaming',
      'hiking', 'dancing', 'photography', 'cooking', 'yoga', 'wine', 'coffee', 'dogs',
      'cats', 'fashion', 'sports', 'netflix', 'beach', 'outdoors', 'concerts', 'museums'
    ];
    
    const toggleInterest = (interest) => {
      const current = formData.interests || [];
      if (current.includes(interest)) {
        updateFormData('interests', current.filter(item => item !== interest));
      } else if (current.length < 10) {
        updateFormData('interests', [...current, interest]);
      }
    };
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-lime-900 via-green-900 to-emerald-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <Sparkles className="w-16 h-16 text-lime-200 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-white mb-4">what do you like?</h1>
            <p className="text-lime-200">pick up to 10 interests</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-8">
            {interests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                disabled={!formData.interests?.includes(interest) && formData.interests?.length >= 10}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  formData.interests?.includes(interest)
                    ? 'bg-white text-lime-900 transform scale-105'
                    : formData.interests?.length >= 10
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
          
          <div className="text-center text-lime-200 mb-6">
            {formData.interests?.length || 0}/10 selected
          </div>
          
          {formData.interests?.length > 0 && (
            <button
              onClick={nextStep}
              className="w-full px-6 py-4 bg-white text-lime-900 rounded-2xl font-medium hover:bg-lime-50 transform hover:scale-105 transition-all duration-300"
            >
              continue
            </button>
          )}
        </div>
      </div>
    );
  };

  // Teasers Screen
  const TeasersScreen = () => {
    const teaserCategories = {
      'my opinion': [
        'it annoys me when...',
        'i think everyone should...',
        'unpopular opinion but...',
        'hot take:...',
        'controversial but...'
      ],
      'random fact': [
        'fun fact about me...',
        'something you wouldn\'t guess...',
        'i secretly love...',
        'random skill i have...',
        'weird thing about me...'
      ],
      'green flag': [
        'i appreciate when...',
        'my love language is...',
        'i value people who...',
        'what attracts me most...',
        'i love when someone...'
      ],
      'red flag': [
        'immediate no if...',
        'dealbreaker for me...',
        'i can\'t stand when...',
        'instant turnoff...',
        'please don\'t...'
      ]
    };
    
    const [selectedCategory, setSelectedCategory] = useState('my opinion');
    
    const selectTeaser = (teaser) => {
      updateFormData('teasers', { ...formData.teasers, [selectedCategory]: teaser });
    };
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-violet-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <Sparkles className="w-16 h-16 text-fuchsia-200 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-white mb-4">conversation starters</h1>
            <p className="text-fuchsia-200">pick teasers to spark chats</p>
          </div>
          
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {Object.keys(teaserCategories).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-white text-fuchsia-900'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="space-y-4 mb-8">
            {teaserCategories[selectedCategory].map((teaser) => (
              <button
                key={teaser}
                onClick={() => selectTeaser(teaser)}
                className={`w-full px-6 py-4 rounded-2xl font-medium text-left transition-all duration-300 ${
                  formData.teasers?.[selectedCategory] === teaser
                    ? 'bg-white text-fuchsia-900 transform scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {teaser}
            	</button>
            ))}
          </div>
          
          <button
          onClick={nextStep}
          className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-medium hover:bg-white/20 transition-all duration-300"
        >
          {Object.keys(formData.teasers || {}).length > 0 ? 'continue' : 'skip for now'}
        </button>
        </div>
      </div>
    );
  };

  // Children Screen (Completed)
  const ChildrenScreen = () => {
    const options = [
      'want kids someday', 'have kids', 'don\'t want kids', 'unsure about kids'
    ];
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <Heart className="w-16 h-16 text-sky-200 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-white mb-4">kids?</h1>
            <p className="text-sky-200">important to be on the same page</p>
          </div>
          
          <div className="space-y-4">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => updateFormData('children', option)}
                className={`w-full px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
                  formData.children === option
                    ? 'bg-white text-sky-900 transform scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {formData.children && (
            <button
              onClick={handleComplete}
              className="w-full mt-8 px-6 py-4 bg-white text-sky-900 rounded-2xl font-medium hover:bg-sky-50 transform hover:scale-105 transition-all duration-300"
            >
              complete profile
            </button>
          )}
        </div>
      </div>
    );
  };

  // Success Screen
  const SuccessScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900">
      <div className="text-center">
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">all set, {formData.name}!</h1>
        <p className="text-lg text-green-200 mb-8">your profile is ready. get ready to connect.</p>
        <button
          className="px-8 py-4 bg-white text-green-900 rounded-2xl font-medium hover:bg-green-50 transform hover:scale-105 transition-all duration-300"
        >
          start matching
        </button>
      </div>
    </div>
  );
  
  const screens = [
    <NameScreen />, <DOBScreen />, <GenderScreen />, <HeightScreen />, 
    <StarSignScreen />, <EducationScreen />, <LookingForScreen />, 
    <PhotosScreen />, <LocationScreen />, <InterestsScreen />, 
    <TeasersScreen />, <ChildrenScreen />, <SuccessScreen />
  ];

  const ProgressBar = () => {
    const progress = (currentStep / (steps.length - 2)) * 100; // -2 to exclude name and complete screen
    return (
      <div className="fixed top-0 left-0 w-full h-1.5 bg-white/10 z-20">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  return (
    <div className="relative">
      {currentStep < steps.length -1 && <ProgressBar />}

      {currentStep > 0 && currentStep < steps.length - 1 && (
        <button 
          onClick={prevStep} 
          className="absolute top-6 left-6 z-30 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {showAgeModal && <AgeModal />}
      {showPhotoTipsModal && <PhotoTipsModal />}
      
      {screens[currentStep]}
    </div>
  );
};

export default OnboardingFlow;