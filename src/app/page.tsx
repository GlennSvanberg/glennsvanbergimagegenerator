"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Heart, Download, Share2, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { supabase, type GlennPhoto } from "@/lib/supabase";

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
    console.log('Expected URL should contain: zqwbcxhfwxuialdbdbxo.supabase.co');
  }, []);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    console.log("Genererar bild med prompt:", prompt);
    
    // Simulate generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setPrompt("");
      // Set new random prompt
      const randomPrompt = funnyPrompts[Math.floor(Math.random() * funnyPrompts.length)];
      setCurrentFunnyPrompt(randomPrompt);
    }, 3000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

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

  const getRandomFunnyPrompt = () => {
    const randomPrompt = funnyPrompts[Math.floor(Math.random() * funnyPrompts.length)];
    setPrompt(randomPrompt);
  };

  const totalLikes = photos.length * 35 + likedPhotos.size;

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
          
          {/* Fun stats and link */}
          <div className="flex justify-center mt-4 gap-6 text-sm text-slate-500 dark:text-slate-400 flex-wrap items-center">
            <span>{photos.length} Bilder av Glenn</span>
            <span>•</span>
            <span>{totalLikes} Hjärtan</span>
            <span>•</span>
            <span>AI-Genererat Kaos</span>
            <span>•</span>
            <a 
              href="https://allaheterglenn.se" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
            >
              Alla Heter Glenn <ExternalLink className="h-3 w-3" />
            </a>
            {!isLoading && (
              <>
                <span>•</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchPhotos}
                  className="h-auto p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Uppdatera
                </Button>
              </>
            )}
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
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-6 w-6 text-purple-600/50 dark:text-purple-400/50" />
                </div>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Skapa en ny Glenn!
              </h2>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder={`Beskriv din Glenn... (t.ex. "${currentFunnyPrompt}")`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isGenerating}
                  className="h-12 px-4 text-base bg-white/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 rounded-xl"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl animate-pulse" />
                )}
              </div>
              
              <Button 
                onClick={getRandomFunnyPrompt}
                variant="outline"
                className="h-12 px-4 text-sm border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl"
                disabled={isGenerating}
                title="Få en rolig idé"
              >
                🎲
              </Button>
              
              <Button 
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Skapar magi...</span>
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
