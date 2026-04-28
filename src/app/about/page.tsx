'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ChevronRight, ChevronDown, FileText, X, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AboutSection {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  subItems?: { title: string; content: string; imageUrl?: string }[];
}

interface AboutContent {
  title: string;
  subtitle: string;
  sections: AboutSection[];
}

const STATIC_CONTENT: AboutContent = {
  title: 'About BuildbotAI',
  subtitle: 'From Wikipedia, the free encyclopedia of AI-assisted hardware synthesis.',
  sections: [
  ]
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(STATIC_CONTENT);
  const [loading, setLoading] = useState(true);
  const [expandedTOC, setExpandedTOC] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    async function fetchAboutContent() {
      if (!firestore) return;
      try {
        const docRef = doc(firestore, 'siteContent', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as AboutContent);
        }
      } catch (err) {
        console.error("Error fetching about content:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAboutContent();
  }, [firestore]);

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const toggleTOC = (id: string) => {
    setExpandedTOC(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setIsLightboxZoomed(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body text-foreground pt-32 pb-24 px-4 md:px-12 max-w-[1800px] w-full mx-auto">
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-start justify-center p-4 md:p-12 cursor-zoom-out overflow-y-auto scrollbar-hide"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                width: isLightboxZoomed ? '100%' : 'auto',
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "relative my-auto transition-all duration-500 ease-in-out",
                isLightboxZoomed ? "max-w-[1400px] w-full cursor-zoom-out" : "max-w-full max-h-full"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxZoomed(!isLightboxZoomed);
              }}
            >
              <button 
                onClick={closeLightbox}
                className="fixed top-8 right-8 text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold tracking-widest z-[110] bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
              >
                CLOSE <X className="h-5 w-5" />
              </button>
              
              {!isLightboxZoomed && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold whitespace-nowrap animate-pulse">
                  Click again to zoom to full width
                </div>
              )}

              <img 
                src={selectedImage} 
                alt="Preview" 
                className={cn(
                  "rounded-xl shadow-2xl border border-white/10 select-none",
                  isLightboxZoomed ? "w-full h-auto" : "max-w-full max-h-[85vh] object-contain"
                )}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative">

        {/* Sidebar TOC - Wikipedia Style */}
        <aside className="col-span-1 md:col-span-3 hidden md:block">
          <div className="sticky top-32 bg-card/30 backdrop-blur-2xl border border-border/40 p-6 rounded-2xl shadow-2xl overflow-hidden">
            <h3 className="font-headline font-bold text-lg mb-4 text-primary uppercase tracking-widest text-sm flex items-center gap-2 px-1">
              <FileText className="h-4 w-4" /> Contents
            </h3>
            <ul className="space-y-1.5 pl-1">
              {content.sections.map((section) => (
                <li key={section.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 group">
                    {section.subItems && section.subItems.length > 0 ? (
                      <button
                        onClick={() => toggleTOC(section.id)}
                        className="hover:bg-white/5 p-0.5 rounded transition-colors"
                      >
                        {expandedTOC[section.id] ?
                          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-cyan-400" /> :
                          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-cyan-400" />
                        }
                      </button>
                    ) : (
                      <div className="w-4" />
                    )}
                    <a href={`#${section.id}`} className="text-sm font-medium text-muted-foreground hover:text-cyan-400 transition-all">
                      {section.title}
                    </a>
                  </div>

                  {section.subItems && expandedTOC[section.id] && (
                    <ul className="ml-6 space-y-1.5 border-l border-white/10 pl-3 animate-in slide-in-from-top-1 duration-200">
                      {section.subItems.map((sub, sIdx) => (
                        <li key={sIdx}>
                          <a href={`#${section.id}-${sIdx}`} className="text-[12px] text-muted-foreground/60 hover:text-cyan-400 transition-all flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-border/40" />
                            {sub.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <div className="col-span-1 md:col-span-9 space-y-12">
          <div className="mb-16">
            <h1 className="font-headline text-5xl md:text-6xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-purple-500">
              {content.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
              {content.subtitle}
            </p>
          </div>

          {content.sections.map((section, index) => (
            <React.Fragment key={section.id}>
              <section id={section.id} className="scroll-mt-32 group">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="font-headline text-4xl font-bold text-foreground group-hover:text-cyan-400 transition-colors tracking-tight">
                    {section.title}
                  </h2>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-border/80 to-transparent" />
                </div>

                <div className="space-y-10 mb-10">
                  <div className="prose prose-invert prose-lg max-w-none prose-p:text-muted-foreground/90 prose-p:leading-relaxed prose-p:text-xl prose-li:text-muted-foreground/90 prose-li:text-lg prose-headings:text-foreground prose-strong:text-cyan-400">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                  {section.imageUrl && (
                    <div className="w-full space-y-4">
                      <div 
                        className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl cursor-zoom-in group/img"
                        onClick={() => setSelectedImage(section.imageUrl!)}
                      >
                        <img 
                          src={section.imageUrl} 
                          alt={section.title} 
                          className="w-full h-auto block transition-transform duration-500 group-hover/img:scale-[1.02]" 
                        />
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 text-xs font-bold tracking-widest text-primary scale-90 group-hover/img:scale-100 transition-transform">
                            <Maximize2 className="h-3.5 w-3.5" /> CLICK TO EXPAND
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-6">
                        <div className="h-px w-8 bg-primary/30" />
                        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/60">
                          Visual Matrix: <span className="text-primary/80">{section.title}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {section.subItems && section.subItems.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-2">
                    {section.subItems.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        id={`${section.id}-${sIdx}`}
                        className="rounded-2xl bg-card/10 border border-border/40 hover:bg-white/5 hover:border-primary/30 transition-all duration-500 group/item scroll-mt-32 overflow-hidden flex flex-col"
                      >
                        {sub.imageUrl && (
                          <div 
                            className="relative w-full overflow-hidden border-b border-white/5 cursor-zoom-in group/subimg"
                            onClick={() => setSelectedImage(sub.imageUrl!)}
                          >
                            <img 
                              src={sub.imageUrl} 
                              alt={sub.title} 
                              className="w-full h-auto block transition-transform duration-500 group-hover/subimg:scale-105" 
                            />
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/subimg:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="h-6 w-6 text-white drop-shadow-lg scale-50 group-hover/subimg:scale-100 transition-transform" />
                            </div>
                          </div>
                        )}
                        <div className="p-8 flex-1">
                          <h4 className="font-headline font-bold text-2xl text-primary mb-4 group-hover/item:text-cyan-400 transition-colors">
                            {sub.title}
                          </h4>
                          <div className="prose prose-invert prose-sm prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground">
                            <ReactMarkdown>{sub.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              {index < content.sections.length - 1 && (
                <div className="h-20" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

