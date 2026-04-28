'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, FileText, ChevronDown, ChevronUp, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUpload } from './image-upload';

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

export function AboutManagement() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('introduction');

  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAboutContent() {
      if (!firestore) return;
      try {
        const docRef = doc(firestore, 'siteContent', 'about');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setContent(docSnap.data() as AboutContent);
        } else {
          // Default content
          setContent({
            title: 'About BuildbotAI',
            subtitle: 'From Wikipedia, the free encyclopedia of AI-assisted hardware synthesis.',
            sections: [
              {
                id: 'introduction',
                title: 'Introduction',
                content: 'BuildbotAI (also known as Forge Architect AI) is an advanced artificial intelligence system designed to optimize and streamline the process of personal computer construction...'
              },
              {
                id: 'mission',
                title: 'Mission & Vision',
                content: 'The primary objective of the BuildbotAI project is the democratization of high-performance computing...'
              },
              {
                id: 'technology',
                title: 'Core Technology',
                content: 'BuildbotAI is constructed upon a highly scalable, modern web architecture...',
                subItems: [
                  { title: 'Reasoning Engine', content: 'Utilizes state-of-the-art Large Language Models (LLMs)...' },
                  { title: 'Dynamic Data Matrix', content: 'Maintains a real-time vector database of component pricing...' }
                ]
              }
            ]
          });
        }
      } catch (err) {
        console.error("Error fetching about content:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAboutContent();
  }, [firestore]);

  const handleSave = async () => {
    if (!firestore || !content) return;
    setSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', 'about'), {
        ...content,
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Changes Saved",
        description: "The About page has been updated successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Save Failed",
        description: "Failed to update About page content.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (id: string, field: 'title' | 'content' | 'imageUrl', value: string) => {
    if (!content) return;
    const newSections = content.sections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    );
    setContent({ ...content, sections: newSections });
  };

  const updateSubItem = (sectionId: string, subIndex: number, field: 'title' | 'content' | 'imageUrl', value: string) => {
    if (!content) return;
    const newSections = content.sections.map(s => {
      if (s.id !== sectionId) return s;
      const newSubItems = [...(s.subItems || [])];
      newSubItems[subIndex] = { ...newSubItems[subIndex], [field]: value };
      return { ...s, subItems: newSubItems };
    });
    setContent({ ...content, sections: newSections });
  };

  const handleAddSection = () => {
    if (!content) return;
    const newId = `section-${Date.now()}`;
    const newSection: AboutSection = {
      id: newId,
      title: 'New Section',
      content: 'Enter section content here...',
      subItems: []
    };
    setContent({
      ...content,
      sections: [...content.sections, newSection]
    });
    setExpandedSection(newId);
  };

  const handleAddSubItem = (sectionId: string) => {
    if (!content) return;
    const newSections = content.sections.map(s => {
      if (s.id !== sectionId) return s;
      return { 
        ...s, 
        subItems: [...(s.subItems || []), { title: 'New Sub-topic', content: 'Sub-topic content...' }] 
      };
    });
    setContent({ ...content, sections: newSections });
  };

  const handleDeleteSubItem = (sectionId: string, subIndex: number) => {
    if (!content) return;
    const newSections = content.sections.map(s => {
      if (s.id !== sectionId) return s;
      const newSubItems = (s.subItems || []).filter((_, i) => i !== subIndex);
      return { ...s, subItems: newSubItems };
    });
    setContent({ ...content, sections: newSections });
  };

  const handleDeleteSection = (id: string) => {
    if (!content) return;
    const newSections = content.sections.filter(s => s.id !== id);
    setContent({ ...content, sections: newSections });
    if (expandedSection === id) setExpandedSection(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-white/5 bg-muted/10 overflow-hidden">
      <CardHeader className="pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>About Page Editor</CardTitle>
              <CardDescription>Update content for the public About page. Use Markdown for formatting (e.g., * for bullets).</CardDescription>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="shadow-lg shadow-primary/20">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Main Title</Label>
            <Input 
              value={content?.title} 
              onChange={(e) => setContent(c => c ? { ...c, title: e.target.value } : null)}
              className="bg-background/50 border-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Subtitle</Label>
            <Input 
              value={content?.subtitle} 
              onChange={(e) => setContent(c => c ? { ...c, subtitle: e.target.value } : null)}
              className="bg-background/50 border-white/5"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Page Sections</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddSection}
              className="h-7 text-[10px] uppercase tracking-wider bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Section
            </Button>
          </div>
          <div className="space-y-3">
            {content?.sections.map((section) => (
              <div 
                key={section.id} 
                className={cn(
                  "border rounded-xl transition-all duration-300 relative group/section",
                  expandedSection === section.id ? "border-primary/30 bg-primary/5" : "border-white/5 bg-background/30"
                )}
              >
                <div className="flex items-center">
                  <button 
                    className="flex-1 px-4 py-3 flex items-center justify-between text-left"
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  >
                    <span className="font-bold text-sm flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", expandedSection === section.id ? "bg-primary" : "bg-muted-foreground/30")} />
                      {section.title}
                    </span>
                    {expandedSection === section.id ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mr-2 opacity-0 group-hover/section:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSection(section.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                {expandedSection === section.id && (
                  <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-tighter text-muted-foreground">Section Header</Label>
                      <Input 
                        value={section.title} 
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        className="bg-background/40 border-white/5 text-sm h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-tighter text-muted-foreground">Section Image</Label>
                      <ImageUpload 
                        value={section.imageUrl || ''} 
                        onChange={(val) => updateSection(section.id, 'imageUrl', val)}
                        className="bg-background/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-tighter text-muted-foreground">Body Content</Label>
                      <Textarea 
                        value={section.content} 
                        onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                        className="bg-background/40 border-white/5 text-sm min-h-[120px] leading-relaxed"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[9px] uppercase tracking-tighter text-muted-foreground">Sub-Topics</Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleAddSubItem(section.id)}
                          className="h-6 px-2 text-[9px] hover:bg-primary/10"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Sub-topic
                        </Button>
                      </div>
                      
                      <div className="space-y-3 pl-4 border-l border-white/10">
                        {section.subItems?.map((sub, idx) => (
                          <div key={idx} className="space-y-2 relative group/subitem pb-3 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="flex gap-2">
                              <Input 
                                value={sub.title} 
                                onChange={(e) => updateSubItem(section.id, idx, 'title', e.target.value)}
                                placeholder="Sub-topic Title"
                                className="bg-background/40 border-white/5 text-[13px] h-8 font-bold"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-40 hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() => handleDeleteSubItem(section.id, idx)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <ImageUpload 
                              value={sub.imageUrl || ''} 
                              onChange={(val) => updateSubItem(section.id, idx, 'imageUrl', val)}
                              className="bg-background/40"
                            />
                            <Textarea 
                              value={sub.content} 
                              onChange={(e) => updateSubItem(section.id, idx, 'content', e.target.value)}
                              placeholder="Sub-topic Content"
                              className="bg-background/40 border-white/5 text-[12px] min-h-[60px] leading-relaxed"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
