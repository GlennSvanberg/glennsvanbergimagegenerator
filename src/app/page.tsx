"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { Camera, Sparkles, Heart, Download, Share2, Loader2, RefreshCw, AlertCircle, Settings, X, ChevronLeft, ChevronRight, ZoomIn, HelpCircle, Globe } from "lucide-react";
import { getSupabaseClient, type GlennPhoto } from "@/lib/supabase";
import { generateFluxImage, type FluxGenerationParams } from "@/lib/flux";



const funnyPrompts = [
  "Glenn som rymdfärare på Mars",
  "Glenn som vikingakung",
  "Glenn som superhelt med lasögon",
  "Glenn som kock som lagar köttbullar",
  "Glenn som pirat på äventyr",
  "Glenn som rockstjärna på scen",
  "Glenn som ninja i Tokyo",
  "Glenn som cowboy i vilda västern",
  "Glenn som trollkarl med trollstav",
  "Glenn som surfaren på vågor"
];

// Settings interface for image generation
interface ImageSettings {
  finetune_strength: number;
  aspect_ratio: string;
  steps: number;
  guidance: number;
  safety_tolerance: string;
  seed?: number;
}

// Default settings
const DEFAULT_SETTINGS: ImageSettings = {
  finetune_strength: 1.2,
  aspect_ratio: "1:1",
  steps: 50,
  guidance: 3.5,
  safety_tolerance: "6",
  seed: undefined
};

// Aspect ratio options
const ASPECT_RATIOS = [
  { value: "1:1", label: "Kvadrat (1:1)" },
  { value: "16:9", label: "Bredformat (16:9)" },
  { value: "9:16", label: "Stående (9:16)" },
  { value: "4:3", label: "Klassisk (4:3)" },
  { value: "3:4", label: "Stående klassisk (3:4)" },
  { value: "21:9", label: "Ultrawide (21:9)" },
  { value: "9:21", label: "Ultrahög (9:21)" }
];

// Safety tolerance options
const SAFETY_OPTIONS = [
  { value: "0", label: "Strikt filtrering" },
  { value: "2", label: "Måttlig filtrering" },
  { value: "6", label: "Tillåtande filtrering" }
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentProgressStep, setCurrentProgressStep] = useState("");
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<GlennPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFunnyPrompt, setCurrentFunnyPrompt] = useState("");
  const [settings, setSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<GlennPhoto | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number>(0);

  // Debug environment variables on component mount
  useEffect(() => {
    console.log('🔧 Environment Check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
    console.log('Expected Supabase URL should contain: zqwbcxhfwxuialdbdbxo.supabase.co');
  }, []);

  // Funny progress steps for Glenn generation
  const funnyProgressSteps = [
    "Odlar skägg åt Glenn...",
    "Kalibrerar ögonavstånd...",
    "Justerar hårlängd och volym...", 
    "Programmerar Glenns charm...",
    "Laddar ner svenska uttryck...",
    "Optimerar leendekurva...",
    "Installerar svenskhet.exe...",
    "Renderar Glenn-attityd...",
    "Kompilerar personlighet...",
    "Syncroniserar med Värmland...",
    "Applicerar nordisk cool...",
    "Finjusterar ögonskratt...",
    "Laddar Glenn-essensen...",
    "Konfigurerar karisma...",
    "Beräknar optimal pose...",
    "Mixar humor och charm...",
    "Polerar slutresultatet...",
    "Kvalitetskontrollerar Glenn...",
    "Sparar mästerverk...",
    "Förbereder för debut..."
  ];

  // Set random funny prompt as placeholder
  useEffect(() => {
    const randomPrompt = funnyPrompts[Math.floor(Math.random() * funnyPrompts.length)];
    setCurrentFunnyPrompt(randomPrompt);
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('glenn-image-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('glenn-image-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  // Fetch photos from Supabase storage
  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = getSupabaseClient();
      if (!supabase) {
        setPhotos([]);
        setError("Saknar Supabase-konfiguration (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
        return;
      }

      console.log('🔍 Fetching photos from Supabase...');
      console.log('📋 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔑 Anon Key present:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      // List all files in the glennsvanberg bucket
      console.log('📂 Listing files in glennsvanberg bucket...');
      const { data: files, error: listError } = await supabase.storage
        .from('glennsvanberg')
        .list('', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      console.log('📁 List response:', { files, error: listError });

      if (listError) {
        console.error('❌ List error:', listError);
        throw listError;
      }

      if (!files || files.length === 0) {
        console.log('📭 No files found in bucket');
        setPhotos([]);
        return;
      }

      console.log(`📸 Found ${files.length} files:`, files.map(f => f.name));

      // Filter image files and get public URLs
      const imageFiles = files.filter(file => 
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      console.log(`🖼️ Found ${imageFiles.length} image files:`, imageFiles.map(f => f.name));

      const photosWithUrls: GlennPhoto[] = await Promise.all(
        imageFiles.map(async (file, index) => {
          // Get public URL for each image
          const { data } = supabase.storage
            .from('glennsvanberg')
            .getPublicUrl(file.name);

          console.log(`🔗 Public URL for ${file.name}:`, data.publicUrl);

          return {
            id: file.id || `photo-${index}`,
            name: file.name,
            url: data.publicUrl,
            fullPath: file.name,
            created_at: file.created_at || new Date().toISOString(),
            updated_at: file.updated_at || new Date().toISOString(),
            size: file.metadata?.size || 0,
            metadata: file.metadata
          };
        })
      );

      console.log('✅ Final photos array:', photosWithUrls);
      setPhotos(photosWithUrls);
    } catch (err) {
      console.error('💥 Error fetching photos:', err);
      setError(err instanceof Error ? err.message : 'Kunde inte ladda bilder');
    } finally {
      setIsLoading(false);
    }
  };

  // Load photos on component mount
  useEffect(() => {
    fetchPhotos();
  }, []);

  // Progress simulation based on 10-second estimate with funny steps
  const simulateProgress = (onComplete: () => void) => {
    let progress = 0;
    let isCompleted = false;
    let lastStepIndex = -1;
    
    const updateProgress = () => {
      if (isCompleted) return;
      
      if (progress < 20) {
        // Slow start (0-20% in ~2 seconds)
        progress += Math.random() * 3 + 1;
      } else if (progress < 50) {
        // Medium progress (20-50% in ~3 seconds)
        progress += Math.random() * 2.5 + 1.5;
      } else if (progress < 80) {
        // Steady progress (50-80% in ~3 seconds)
        progress += Math.random() * 2 + 1;
      } else if (progress < 95) {
        // Slower progress (80-95% in ~2 seconds)
        progress += Math.random() * 1 + 0.5;
      } else {
        // Very slow progress (95-99% - wait for actual completion)
        progress += Math.random() * 0.3 + 0.1;
      }
      
      // Cap at 99% until actual completion
      progress = Math.min(progress, 99);
      setGenerationProgress(Math.round(progress));
      
      // Update funny step based on progress
      const stepIndex = Math.floor((progress / 100) * funnyProgressSteps.length);
      if (stepIndex !== lastStepIndex && stepIndex < funnyProgressSteps.length) {
        setCurrentProgressStep(funnyProgressSteps[stepIndex]);
        lastStepIndex = stepIndex;
      }
    };
    
    // Start with first step
    setCurrentProgressStep(funnyProgressSteps[0]);
    
    const intervalId = setInterval(updateProgress, 200); // Slightly slower updates for 10-second timing
    
    // Return function to complete progress
    return () => {
      isCompleted = true;
      clearInterval(intervalId);
      
      // Show final step
      setCurrentProgressStep("🎉 Glenn är klar!");
      
      // Animate to 100%
      let currentProgress = progress;
      const completeInterval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress >= 100) {
          currentProgress = 100;
          setGenerationProgress(100);
          clearInterval(completeInterval);
          setTimeout(onComplete, 200);
        } else {
          setGenerationProgress(Math.round(currentProgress));
        }
      }, 50);
    };
  };

  // Check if Glenn is mentioned in the prompt
  const hasGlennInPrompt = (text: string): boolean => {
    return text.toLowerCase().includes('glenn');
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    // Validate that Glenn is mentioned in the prompt
    if (!hasGlennInPrompt(prompt)) {
      setGenerationError("Glenn måste vara med i beskrivningen för att fine-tuningen ska fungera! Lägg till 'Glenn' i din prompt.");
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStatus("Skapar Glenn med AI-magi...");
    setGenerationProgress(0);
    setCurrentProgressStep("");
    
    // Start progress simulation
    const completeProgress = simulateProgress(() => {
      setGenerationStatus("🎉 Ny Glenn skapad!");
    });
    
    try {
      console.log("🎨 Genererar bild med prompt:", prompt);
      console.log("⚙️ Använder inställningar:", settings);
      
      // Prepare settings for API (exclude undefined values)
      const apiSettings: Partial<FluxGenerationParams> = {
        finetune_strength: settings.finetune_strength,
        aspect_ratio: settings.aspect_ratio,
        steps: settings.steps,
        guidance: settings.guidance,
        safety_tolerance: settings.safety_tolerance,
      };
      
      // Only include seed if it's defined and not empty
      if (settings.seed !== undefined && settings.seed !== null && !isNaN(settings.seed)) {
        apiSettings.seed = settings.seed;
      }
      
      // Generate, download and store in Supabase (all handled by generateFluxImage)
      const supabaseUrl = await generateFluxImage(prompt, apiSettings);
      
      console.log("✅ Image generation and storage complete:", supabaseUrl);
      
      // Complete the progress bar
      completeProgress();
      
      // Refresh photo list to show new image
      await fetchPhotos();
      
      // Clear form and set new random prompt
      setPrompt("");
      const randomPrompt = funnyPrompts[Math.floor(Math.random() * funnyPrompts.length)];
      setCurrentFunnyPrompt(randomPrompt);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setGenerationStatus("");
        setGenerationProgress(0);
        setCurrentProgressStep("");
      }, 3000);
      
    } catch (err) {
      console.error("💥 Generation error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel uppstod';
      setGenerationError(errorMessage);
      setGenerationStatus("");
      setGenerationProgress(0);
      setCurrentProgressStep("");
      // Stop progress simulation on error
      completeProgress();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
      e.preventDefault(); // Prevent new line in textarea
      handleGenerate();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Max height of ~3 lines
  };

  // Reset textarea height when prompt is cleared
  useEffect(() => {
    if (!prompt) {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '48px'; // Reset to minimum height
      }
    }
  }, [prompt]);

  const toggleLike = (photoId: string) => {
    setLikedPhotos(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(photoId)) {
        newLikes.delete(photoId);
      } else {
        newLikes.add(photoId);
      }
      return newLikes;
    });
  };

  // Fullscreen image viewer functions
  const openFullscreen = (photo: GlennPhoto, index: number) => {
    setFullscreenImage(photo);
    setFullscreenIndex(index);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const navigateFullscreen = useCallback((direction: 'prev' | 'next') => {
    if (!fullscreenImage || photos.length === 0) return;
    
    let newIndex = fullscreenIndex;
    if (direction === 'prev') {
      newIndex = fullscreenIndex > 0 ? fullscreenIndex - 1 : photos.length - 1;
    } else {
      newIndex = fullscreenIndex < photos.length - 1 ? fullscreenIndex + 1 : 0;
    }
    
    setFullscreenIndex(newIndex);
    setFullscreenImage(photos[newIndex]);
  }, [fullscreenImage, fullscreenIndex, photos]);

  // Handle keyboard navigation in fullscreen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!fullscreenImage) return;
      
      switch (e.key) {
        case 'Escape':
          closeFullscreen();
          break;
        case 'ArrowLeft':
          navigateFullscreen('prev');
          break;
        case 'ArrowRight':
          navigateFullscreen('next');
          break;
      }
    };

    if (fullscreenImage) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [fullscreenImage, fullscreenIndex, photos, navigateFullscreen]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    if (fullscreenImage) {
      document.body.classList.add('fullscreen-open');
    } else {
      document.body.classList.remove('fullscreen-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('fullscreen-open');
    };
  }, [fullscreenImage]);

  // Copy image to clipboard
  const copyImageToClipboard = async (imageUrl: string): Promise<void> => {
    console.log('📋 Kopierar bild:', imageUrl);
    
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('Clipboard API not supported');
      }

      // Try to fetch image with CORS
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Make sure it's an image type
      if (!blob.type.startsWith('image/')) {
        throw new Error('Invalid image type');
      }
      
      // Copy to clipboard
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      
      console.log('✅ Bild kopierad till urklipp!');
      
    } catch (error) {
      console.error('❌ Kunde inte kopiera bild:', error);
      
      // Fallback - try to copy URL instead
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(imageUrl);
          console.log('📋 Bildlänk kopierad till urklipp som fallback!');
        } else {
          throw new Error('Clipboard not available');
        }
      } catch (urlError) {
        console.error('❌ Kunde inte kopiera bildlänk:', urlError);
        alert('Kunde inte kopiera bild. Försök högerklicka och "Kopiera bild" istället.');
      }
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="relative">
                <Camera className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-purple-700 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent">
                Glennerator
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">för dig som vill ha lite mer Glenn</p>
          </div>
        </div>
      </header>



      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-12 relative">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Laddar Glenns bilder...</p>
              <p className="text-sm text-slate-500 dark:text-slate-500">Hämtar alla varianter av Glenn från molnet</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <Camera className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Oj! Glenn försvann!</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <Button onClick={fetchPhotos} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Hitta Glenn igen
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && photos.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <Camera className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">Inga Glenns hittades!</p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                Det verkar som om alla Glenns är på semester. Ladda upp några bilder för att komma igång!
              </p>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {!isLoading && !error && photos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12 max-w-7xl mx-auto justify-items-center">
            {photos.map((photo, index) => {
              return (
                <Card key={photo.id} className="w-full max-w-sm group overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:-translate-y-1">
                  <CardContent className="p-0 relative">
                    <div className="relative overflow-hidden rounded-lg cursor-pointer" onClick={() => openFullscreen(photo, index)}>
                      <div className="relative aspect-[4/5]">
                        <Image
                          src={photo.url}
                          alt={`Glenn - ${photo.name}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        
                        {/* Fullscreen icon overlay */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                            <ZoomIn className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute bottom-4 right-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(photo.id);
                              }}
                              title="Gilla denna Glenn"
                            >
                              <Heart className={`h-4 w-4 ${likedPhotos.has(photo.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyImageToClipboard(photo.url);
                              }}
                              title="Kopiera Glenn"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(photo.url, '_blank');
                              }}
                              title="Ladda ner Glenn"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Generation Section */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50 shadow-2xl pb-[env(safe-area-inset-bottom)]">
          <div className="container mx-auto max-w-4xl p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  {!isGenerating && (
                    <div className="absolute inset-0 animate-ping">
                      <Sparkles className="h-6 w-6 text-purple-600/50 dark:text-purple-400/50" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Skapa din egen Glenn!
                </h2>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowGuidelines(true)}
                  variant="outline"
                  size="sm"
                  className="h-12 w-12 p-0 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  title="Prompt-guide för bästa resultat"
                >
                  <HelpCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  size="sm"
                  className="h-12 w-12 p-0 bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  title="Inställningar för bildgenerering"
                >
                  <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>
              </div>
            </div>

            {/* Generation Status with Progress Bar */}
            {(isGenerating || generationStatus) && (
              <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-3">
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    {generationStatus}
                  </span>
                  {isGenerating && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 ml-auto">
                      {generationProgress}%
                    </span>
                  )}
                </div>
                
                {/* Progress Bar */}
                {isGenerating && (
                  <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-3 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                      style={{ width: `${generationProgress}%` }}
                    >
                      {/* Animated shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                )}
                
                {/* Funny progress step indicator */}
                {isGenerating && currentProgressStep && (
                  <div className="text-center mt-3">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300 italic">
                      {currentProgressStep}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Generation Error */}
            {generationError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      {generationError}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setGenerationError(null)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}
            
            {/* Input Section */}
            <div className="flex gap-3 items-start">
              <div className="flex-1 relative">
                <textarea
                  placeholder="Beskriv din Glenn..."
                  value={prompt}
                  onChange={handleTextareaChange}
                  onKeyPress={handleKeyPress}
                  disabled={isGenerating}
                  rows={1}
                  className="min-h-[48px] w-full px-4 py-3 text-base bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none overflow-hidden outline-none transition-all duration-200 leading-relaxed"
                  style={{ maxHeight: '120px' }}
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl animate-pulse" />
                )}
              </div>
              
              <Button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="hidden sm:inline">Skapar Glenn...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="hidden sm:inline">Generera Glenn</span>
                  </div>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
              ✨ Drivs av AI-magi • Tryck Enter för att skapa • Ex: &quot;{currentFunnyPrompt}&quot;
            </p>
          </div>
        </div>

        {/* Fullscreen Image Viewer */}
        {fullscreenImage && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
            {/* Close button */}
            <Button
              onClick={closeFullscreen}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 h-10 w-10 p-0 text-white hover:bg-white/20 rounded-full"
              title="Stäng (Escape)"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  onClick={() => navigateFullscreen('prev')}
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Föregående bild (←)"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  onClick={() => navigateFullscreen('next')}
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 p-0 text-white hover:bg-white/20 rounded-full"
                  title="Nästa bild (→)"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image container */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div className="relative w-full h-full flex items-center justify-center" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
                <Image
                  src={fullscreenImage.url}
                  alt={`Glenn - ${fullscreenImage.name}`}
                  fill
                  className="object-contain rounded-lg"
                  priority
                  sizes="100vw"
                />
              </div>
            </div>

            {/* Image info and actions overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <span className="text-sm opacity-90">
                      {fullscreenIndex + 1} av {photos.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={() => toggleLike(fullscreenImage.id)}
                      title="Gilla denna Glenn"
                    >
                      <Heart className={`h-4 w-4 ${likedPhotos.has(fullscreenImage.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={() => copyImageToClipboard(fullscreenImage.url)}
                      title="Kopiera Glenn"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                      onClick={() => window.open(fullscreenImage.url, '_blank')}
                      title="Ladda ner Glenn"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-white/80 text-sm mt-2 truncate">
                  {fullscreenImage.name}
                </p>
              </div>
            </div>

            {/* Click outside to close */}
            <div 
              className="absolute inset-0 -z-10" 
              onClick={closeFullscreen}
            />
          </div>
        )}

        {/* Settings Dialog */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Inställningar för bildgenerering
                  </h2>
                </div>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Settings Content */}
              <div className="p-6 space-y-6">
                {/* Finetune Strength */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">
                      Finetune-styrka
                    </label>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {settings.finetune_strength}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.finetune_strength}
                    onChange={(e) => setSettings(prev => ({ ...prev, finetune_strength: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Styr hur starkt Glenn-konceptet visas. 0.0 = knappt synligt, 1.0 = standard (rekommenderad), 2.0 = maximalt starkt. 
                    Öka om Glenn inte syns tillräckligt tydligt, minska om du ser artefakter.
                  </p>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    Bildformat
                  </label>
                  <select
                    value={settings.aspect_ratio}
                    onChange={(e) => setSettings(prev => ({ ...prev, aspect_ratio: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {ASPECT_RATIOS.map(ratio => (
                      <option key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Välj bildformat för din Glenn. Kvadrat fungerar bra för porträtt, bredformat för landskapsbilder.
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">
                      Genereringssteg
                    </label>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {settings.steps}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={settings.steps}
                    onChange={(e) => setSettings(prev => ({ ...prev, steps: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Antal inferenssteg. Fler steg = bättre kvalitet men tar längre tid. 20-30 är ofta tillräckligt, 50 ger högsta kvalitet.
                  </p>
                </div>

                {/* Guidance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">
                      Prompt-styrka
                    </label>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {settings.guidance}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={settings.guidance}
                    onChange={(e) => setSettings(prev => ({ ...prev, guidance: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Hur noga AI:n följer din beskrivning. Högre värden = följer texten striktare, lägre = mer kreativ frihet. 3.5 är en bra balans.
                  </p>
                </div>

                {/* Safety Tolerance */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    Säkerhetsfiltrering
                  </label>
                  <select
                    value={settings.safety_tolerance}
                    onChange={(e) => setSettings(prev => ({ ...prev, safety_tolerance: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {SAFETY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Styr hur strikt innehållsfiltrering som används. Strikt = säkrast, Tillåtande = mest kreativ frihet.
                  </p>
                </div>

                {/* Seed */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    Slumptal (seed) - Valfritt
                  </label>
                  <input
                    type="number"
                    placeholder="Lämna tomt för slumpmässigt"
                    value={settings.seed || ""}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      seed: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Använd samma seed för att få liknande resultat. Lämna tomt för helt nya variationer varje gång.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                  variant="outline"
                  size="sm"
                >
                  Återställ till standard
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Stäng
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Guidelines Dialog */}
        {showGuidelines && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGuidelines(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Prompt-guide: Så skapar du bästa Glenn!
                  </h2>
                </div>
                <Button
                  onClick={() => setShowGuidelines(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Guidelines Content */}
              <div className="p-6 space-y-6">
                {/* Introduction */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    🎯 Viktigaste regeln
                  </h3>
                  <p className="text-purple-800 dark:text-purple-200">
                    <strong>Inkludera alltid &quot;Glenn&quot; i din beskrivning!</strong> Glenn måste vara en del av prompten för att fine-tuningen ska fungera.
                  </p>
                </div>

                {/* Best Practices */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-400">✨</span>
                      Bästa tips för fantastiska Glenn-bilder
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-semibold text-green-700 dark:text-green-300">Var specifik och tydlig</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Använd exakta färgnamn, detaljerade beskrivningar och tydliga verb. Undvik vaga termer.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                          Exempel: &quot;Glenn i röd flanellskjorta&quot; istället för &quot;Glenn i snygg skjorta&quot;
                        </p>
                      </div>

                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">Börja enkelt, bygg sedan</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Testa grundläggande ändringar först, lägg sedan till komplexitet. AI:n hanterar iterativ redigering mycket bra.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                          Exempel: Först &quot;Glenn som kock&quot;, sedan &quot;Glenn som kock som lagar pasta i italienskt kök&quot;
                        </p>
                      </div>

                      <div className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-semibold text-orange-700 dark:text-orange-300">Bevara medvetet</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Säg uttryckligen vad som ska vara oförändrat. Använd fraser som &quot;behåll samma ansiktsdrag/komposition/belysning&quot;.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                          Exempel: &quot;Glenn som astronaut, behåll samma ansiktsuttryck och belysning&quot;
                        </p>
                      </div>

                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Namnge personer direkt</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Använd &quot;Glenn&quot; eller specifika beskrivningar istället för pronomen som &quot;han&quot;, &quot;den&quot; eller &quot;denna&quot;.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                          Exempel: &quot;Glenn med kort svart hår&quot; istället för &quot;han&quot;
                        </p>
                      </div>

                      <div className="border-l-4 border-pink-500 pl-4">
                        <h4 className="font-semibold text-pink-700 dark:text-pink-300">Kontrollera komposition explicit</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          När du ändrar bakgrund eller miljö, specificera &quot;behåll exakt kameravinkel, position och inramning&quot;.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                          Exempel: &quot;Glenn på stranden, behåll samma kameravinkel och position&quot;
                        </p>
                      </div>

                      <div className="border-l-4 border-teal-500 pl-4">
                        <h4 className="font-semibold text-teal-700 dark:text-teal-300">Välj verb noggrant</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          &quot;Transformera&quot; kan innebära total förändring, medan &quot;byt kläder&quot; eller &quot;ersätt bakgrund&quot; ger mer kontroll.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                          Exempel: &quot;Byt Glenns t-shirt till kostym&quot; istället för &quot;transformera Glenn&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-purple-600 dark:text-purple-400">💡</span>
                      Exempel på bra prompts
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="font-medium text-green-600 dark:text-green-400">Bra:</p>
                        <p className="text-slate-700 dark:text-slate-300">&quot;Glenn som astronaut i vit rymddräkt på månens yta, behåll samma ansiktsuttryck&quot;</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="font-medium text-green-600 dark:text-green-400">Bra:</p>
                        <p className="text-slate-700 dark:text-slate-300">&quot;Glenn som kock i vitt kockmössa och förkläde som lagar pasta i modernt kök&quot;</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="font-medium text-red-600 dark:text-red-400">Undvik:</p>
                        <p className="text-slate-700 dark:text-slate-300">&quot;Han som något coolt&quot; (för vagt, ingen Glenn-referens)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={() => setShowGuidelines(false)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Förstått! Låt oss skapa Glenn!
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom spacer to account for fixed input */}
        <div className="h-40" />
      </main>

      {/* Floating Glenn Center Link */}
      <div className="fixed top-28 right-4 z-40 hidden lg:block">
        <Button
          asChild
          variant="outline"
          className="bg-white/80 dark:bg-slate-900/70 backdrop-blur border border-slate-200/70 dark:border-slate-700/70 text-slate-800 dark:text-slate-100 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl h-10 px-3"
        >
          <a href="/center" className="flex items-center gap-2" title="Besök Glenn Center">
            <Globe className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span className="text-sm font-semibold">Glenn Center</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
