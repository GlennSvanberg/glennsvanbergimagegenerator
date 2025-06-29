"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, ExternalLink, Globe, Palette, ChefHat, MapPin } from "lucide-react";

// Site data
const sites = [
  {
    id: "glenn-generator",
    name: "Glenn Generator",
    url: "/",
    description: "Skapa fantastiska AI-bilder av Glenn med avancerad bildgenerering",
    thumbnail: "/pages/glenngenerator.png",
    category: "AI & Kreativitet",
    icon: Camera,
    color: "from-purple-600 to-pink-600"
  },
  {
    id: "malasidor",
    name: "Målasidor.se",
    url: "https://målasidor.se",
    description: "Roliga målarsidor för barn med Glenn-motiv",
    thumbnail: "/pages/malasidor.png",
    category: "Kreativitet",
    icon: Palette,
    color: "from-pink-500 to-orange-500"
  },
  {
    id: "allaheterglenn",
    name: "Alla Heter Glenn",
    url: "https://allaheterglenn.se",
    description: "Upptäck alla som heter Glenn i Sverige",
    thumbnail: "/pages/allaheterglenn.png",
    category: "Upptäck",
    icon: Globe,
    color: "from-blue-500 to-purple-500"
  },
  {
    id: "airecept",
    name: "AI-Recept.se",
    url: "https://ai-recept.se",
    description: "Smarta AI-genererade recept för alla smaker och tillfällen",
    thumbnail: "/pages/airecept.png",
    category: "Mat & Dryck",
    icon: ChefHat,
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "travelpal",
    name: "TravelPal",
    url: "https://pal-thkn.vercel.app/",
    description: "Din personliga resevän som vet vad du älskar och hittar perfekta äventyr",
    thumbnail: "/pages/travelpal.png",
    category: "Resor",
    icon: MapPin,
    color: "from-cyan-500 to-blue-600"
  }
];

export default function PagesPage() {
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
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="relative">
                <Globe className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-pulse" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-purple-700 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent">
                Glenn Center
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Alla mina fantastiska sidor samlade på ett ställe
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 relative">
        {/* Introduction */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Välkommen till Glenn Center! Här hittar du alla mina fantastiska sidor och projekt. 
            Från AI-bildgenerering och kreativa aktiviteter till reserekommendationer och recept - hela Glenn-universumet på ett ställe!
          </p>
        </div>

        {/* Sites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {sites.map((site) => {
            return (
              <Card key={site.id} className="group overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:-translate-y-2">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={site.thumbnail}
                        alt={`Screenshot of ${site.name}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {/* Category badge overlay */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${site.color} text-white shadow-lg`}>
                          {site.category}
                        </span>
                      </div>
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="absolute bottom-4 right-4">
                          {site.url === '/' ? (
                            <a href={site.url} className="block bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                              <ExternalLink className="h-4 w-4 text-white" />
                            </a>
                          ) : (
                            <a href={site.url} target="_blank" rel="noopener noreferrer" className="block bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                              <ExternalLink className="h-4 w-4 text-white" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {site.name}
                      </h3>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                      {site.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                        {site.url === '/' ? 'glennsvanberg.se' : site.url.replace('https://', '')}
                      </span>
                      
                      <Button
                        asChild
                        size="sm"
                        className={`bg-gradient-to-r ${site.color} hover:shadow-lg transition-all duration-300 text-white border-0`}
                      >
                        {site.url === '/' ? (
                          <a href={site.url}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Besök sida
                          </a>
                        ) : (
                          <a href={site.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Besök sida
                          </a>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="text-center mt-16">
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto border border-white/20 dark:border-slate-700/50">
            <Camera className="h-12 w-12 text-purple-600/50 dark:text-purple-400/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Fler sidor kommer snart!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Glenn-universumet växer ständigt. Håll utkik efter nya spännande sidor!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 