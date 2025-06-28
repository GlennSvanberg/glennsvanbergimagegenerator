"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Heart, Download, Share2, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { supabase, type GlennPhoto } from "@/lib/supabase";
import { generateFluxImage } from "@/lib/flux";

const typeColors = {
  portrait: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  landscape: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  adventure: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  creative: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  candid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  lifestyle: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  artistic: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  professional: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  nature: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  casual: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const swedishCategories = {
  portrait: "porträtt",
  landscape: "landskap", 
  adventure: "äventyr",
  creative: "kreativ",
  candid: "naturlig",
  lifestyle: "livsstil",
  artistic: "konstnärlig",
  professional: "seriös",
  nature: "natur",
  casual: "avslappnad"
};

// Function to categorize photos based on filename or metadata
const categorizePhoto = (filename: string): keyof typeof typeColors => {
  const name = filename.toLowerCase();
  if (name.includes('portrait') || name.includes('headshot')) return 'portrait';
  if (name.includes('landscape') || name.includes('wide')) return 'landscape';
  if (name.includes('adventure') || name.includes('outdoor')) return 'adventure';
  if (name.includes('creative') || name.includes('art')) return 'creative';
  if (name.includes('candid') || name.includes('natural')) return 'candid';
  if (name.includes('lifestyle') || name.includes('life')) return 'lifestyle';
  if (name.includes('artistic') || name.includes('abstract')) return 'artistic';
  if (name.includes('professional') || name.includes('business')) return 'professional';
  if (name.includes('nature') || name.includes('forest') || name.includes('tree')) return 'nature';
  return 'casual';
};

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

  // Fetch photos from Supabase storage
  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      setError(null);

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

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
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
      
      // Generate, download and store in Supabase (all handled by generateFluxImage)
      const supabaseUrl = await generateFluxImage(prompt);
      
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <Camera className="h-10 w-10 text-primary" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-purple-700 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent">
                Glenn Svanberg
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Alla heter inte Glenn... men jag gör det!</p>
            </div>
          </div>
            

        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 relative">
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
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6 mb-12">
                        {photos.map((photo) => {
              const category = categorizePhoto(photo.name);
              const swedishCategory = swedishCategories[category];
              return (
                <Card key={photo.id} className="break-inside-avoid group overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:-translate-y-1">
                  <CardContent className="p-0 relative">
                    <div className="relative overflow-hidden rounded-lg">
                      <div className="relative aspect-[4/5]">
                        <Image
                          src={photo.url}
                          alt={`Glenn - ${photo.name}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      
                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                  <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex items-center justify-between">
                              <Badge className={`${typeColors[category]} border-0 shadow-lg`}>
                                {swedishCategory}
                              </Badge>
                              <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                onClick={() => toggleLike(photo.id)}
                                title="Gilla denna Glenn"
                              >
                                <Heart className={`h-4 w-4 ${likedPhotos.has(photo.id) ? 'fill-red-500 text-red-500' : ''}`} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                title="Dela Glenn"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                onClick={() => window.open(photo.url, '_blank')}
                                title="Ladda ner Glenn"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-white/90 text-sm">
                            <Heart className="h-3 w-3" />
                            <span>{Math.floor(Math.random() * 50) + 20 + (likedPhotos.has(photo.id) ? 1 : 0)}</span>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-white/20 dark:border-slate-700/50 p-6 shadow-2xl">
          <div className="container mx-auto max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                {!isGenerating && (
                  <div className="absolute inset-0 animate-ping">
                    <Sparkles className="h-6 w-6 text-purple-600/50 dark:text-purple-400/50" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Skapa en ny Glenn!
              </h2>
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
            
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  placeholder={`Beskriv din Glenn... (t.ex. "${currentFunnyPrompt}")`}
                  value={prompt}
                  onChange={handleTextareaChange}
                  onKeyPress={handleKeyPress}
                  disabled={isGenerating}
                  rows={1}
                  className="min-h-[48px] w-full px-4 py-3 text-base bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none overflow-hidden outline-none transition-all duration-200"
                  style={{ maxHeight: '120px' }}
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl animate-pulse" />
                )}
              </div>
              

              
              <Button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Skapar Glenn...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Generera Glenn</span>
                  </div>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
              ✨ Drivs av AI-magi • Tryck Enter eller klicka för att skapa din egen Glenn
            </p>
          </div>
        </div>

        {/* Bottom spacer to account for fixed input */}
        <div className="h-40" />
      </main>
    </div>
  );
}
