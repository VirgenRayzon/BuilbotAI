'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2,
    Check,
    Shield,
    Bot,
    Sparkles,
    Cpu,
    AlertTriangle,
    Plus,
    Trash2,
    CheckCircle2,
    Layers,
    ExternalLink,
    Zap,
    Brain,
    Gauge,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/context/user-profile';
import { useSiteSettings, type FineTunedProject } from '@/context/site-settings-context';
import { createAuditLog } from '@/firebase/audit';
import {
    testAiModelConnectionAction,
    updateSiteSettingsAction,
    invalidateAiModelCacheAction,
} from '@/app/actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Standard available Gemini API models with specs & badges
export const AVAILABLE_GEMINI_MODELS = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        tag: 'Recommended Default',
        tagColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        badgeVariant: 'default' as const,
        description: 'Next-generation ultra-efficient multimodal model. Best balance of speed, reasoning, and cost.',
        speed: 'Ultra Fast',
        contextWindow: '1M tokens',
        icon: Zap,
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        tag: 'Deep Reasoning',
        tagColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        badgeVariant: 'secondary' as const,
        description: 'Advanced reasoning and complex coding architecture. Ideal for highly intricate hardware compatibility queries.',
        speed: 'High Intelligence',
        contextWindow: '2M tokens',
        icon: Brain,
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        tag: 'Next-Gen Speed',
        tagColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        badgeVariant: 'outline' as const,
        description: 'High-throughput multimodal model engineered for low latency interactive experiences.',
        speed: 'Real-time',
        contextWindow: '1M tokens',
        icon: Zap,
    },
    {
        id: 'gemini-2.0-flash-lite',
        name: 'Gemini 2.0 Flash Lite',
        tag: 'Ultra-Low Latency',
        tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        badgeVariant: 'outline' as const,
        description: 'Lightweight workhorse model optimized for lightning-fast latency and minimal token consumption.',
        speed: 'Instant',
        contextWindow: '1M tokens',
        icon: Gauge,
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        tag: 'High Throughput',
        tagColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        badgeVariant: 'outline' as const,
        description: 'Established workhorse model with high throughput across diverse general tasks.',
        speed: 'Fast',
        contextWindow: '1M tokens',
        icon: Layers,
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        tag: 'Massive Context',
        tagColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        badgeVariant: 'outline' as const,
        description: '2M token context window model capable of ingesting massive technical datasets.',
        speed: 'Comprehensive',
        contextWindow: '2M tokens',
        icon: Brain,
    },
];

const DEFAULT_PROJECT_ENDPOINT = 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';

export function AiModelSettings() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { profile } = useUserProfile();
    const {
        aiModelProvider: activeAiProvider,
        fineTunedModelId: activeTunedModelId,
        defaultGeminiModel: activeGeminiModel,
        fineTunedProjects: activeProjects,
        activeFineTunedProjectId: initialActiveProjectId,
    } = useSiteSettings();

    // Model selection state
    const [selectedAiProvider, setSelectedAiProvider] = useState<'default' | 'finetuned'>(
        activeAiProvider || 'default'
    );
    const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>(
        activeGeminiModel || 'gemini-2.5-flash'
    );

    // Fine-tuned projects state
    const [projects, setProjects] = useState<FineTunedProject[]>(() => {
        if (activeProjects && activeProjects.length > 0) return activeProjects;
        return [
            {
                id: 'default-prod-endpoint',
                name: 'Buildbot Production Hardware Tuning',
                endpoint: activeTunedModelId || DEFAULT_PROJECT_ENDPOINT,
                createdAt: new Date().toISOString(),
            },
        ];
    });

    const [activeProjectId, setActiveProjectId] = useState<string>(() => {
        if (initialActiveProjectId && projects.some((p) => p.id === initialActiveProjectId)) {
            return initialActiveProjectId;
        }
        return projects[0]?.id || 'default-prod-endpoint';
    });

    // Form inputs for adding a new fine-tuned project
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectEndpoint, setNewProjectEndpoint] = useState('');
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<FineTunedProject | null>(null);

    // Saving and testing states
    const [savingAiSettings, setSavingAiSettings] = useState(false);
    const [isAiDirty, setIsAiDirty] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        model?: string;
        response?: string;
        latencyMs: number;
        error?: string;
        isPermissionError?: boolean;
        remediation?: {
            serviceAccount: string;
            requiredRole: string;
            project: string;
            instructions: string;
        };
    } | null>(null);

    // Synchronize from context
    useEffect(() => {
        if (activeAiProvider) setSelectedAiProvider(activeAiProvider);
    }, [activeAiProvider]);

    useEffect(() => {
        if (activeGeminiModel) setSelectedGeminiModel(activeGeminiModel);
    }, [activeGeminiModel]);

    useEffect(() => {
        if (activeProjects && activeProjects.length > 0) {
            setProjects(activeProjects);
        }
    }, [activeProjects]);

    useEffect(() => {
        if (initialActiveProjectId) {
            setActiveProjectId(initialActiveProjectId);
        }
    }, [initialActiveProjectId]);

    // Active project lookup
    const currentActiveProject = projects.find((p) => p.id === activeProjectId) || projects[0];
    const currentTunedEndpoint = currentActiveProject?.endpoint || DEFAULT_PROJECT_ENDPOINT;

    // Handle adding a new named project
    const handleAddProject = () => {
        const trimmedName = newProjectName.trim();
        const trimmedEndpoint = newProjectEndpoint.trim();

        if (!trimmedName) {
            toast({
                title: 'Project Name Required',
                description: 'Please specify a descriptive name for your fine-tuned project.',
                variant: 'destructive',
            });
            return;
        }

        if (!trimmedEndpoint) {
            toast({
                title: 'Project Link / Endpoint Required',
                description: 'Please paste the fully-qualified Vertex AI resource link or endpoint.',
                variant: 'destructive',
            });
            return;
        }

        const newId = `proj-${Date.now()}`;
        const newProj: FineTunedProject = {
            id: newId,
            name: trimmedName,
            endpoint: trimmedEndpoint,
            createdAt: new Date().toISOString(),
        };

        const updated = [...projects, newProj];
        setProjects(updated);
        setActiveProjectId(newId);
        setNewProjectName('');
        setNewProjectEndpoint('');
        setIsAddingProject(false);
        setIsAiDirty(true);

        toast({
            title: 'Project Added & Selected',
            description: `"${trimmedName}" is now registered and selected as the active model.`,
        });
    };

    // Handle confirming project deletion
    const handleConfirmDeleteProject = () => {
        if (!projectToDelete) return;
        const targetId = projectToDelete.id;
        const targetName = projectToDelete.name;

        const updated = projects.filter((p) => p.id !== targetId);
        setProjects(updated);
        if (activeProjectId === targetId) {
            setActiveProjectId(updated[0]?.id || '');
        }
        setIsAiDirty(true);
        setProjectToDelete(null);

        toast({
            title: 'Project Deleted',
            description: `"${targetName}" has been removed from registered fine-tuned projects.`,
        });
    };

    // Test Model Connection
    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const result = await testAiModelConnectionAction(
                selectedAiProvider,
                currentTunedEndpoint,
                selectedGeminiModel
            );
            setTestResult(result);
            if (result.success) {
                toast({
                    title: 'Model Connection Succeeded',
                    description: `${result.model} responded in ${result.latencyMs}ms.`,
                });
            } else if (result.isPermissionError) {
                toast({
                    title: 'IAM Role Required in Google Cloud',
                    description: `Vertex AI User role needed for ${result.remediation?.serviceAccount}. Platform is operating with automatic fallback.`,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Connection Test Failed',
                    description: result.error || 'Unable to reach model endpoint',
                    variant: 'destructive',
                });
            }
        } catch (err: any) {
            toast({
                title: 'Test Failed',
                description: err.message || 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setTestingConnection(false);
        }
    };

    // Save and Apply Settings
    const handleSaveAiModelSettings = async () => {
        setSavingAiSettings(true);
        try {
            // 1. Server-side persistence via Admin SDK
            await updateSiteSettingsAction({
                aiModelProvider: selectedAiProvider,
                defaultGeminiModel: selectedGeminiModel,
                fineTunedModelId: currentTunedEndpoint,
                fineTunedProjects: projects,
                activeFineTunedProjectId: activeProjectId,
                updatedBy: profile?.email || 'Super Admin',
            });

            // 2. Client Firestore write for local reactivity
            if (firestore) {
                const siteSettingsRef = doc(firestore, 'siteSettings', 'main');
                await setDoc(
                    siteSettingsRef,
                    {
                        aiModelProvider: selectedAiProvider,
                        defaultGeminiModel: selectedGeminiModel,
                        fineTunedModelId: currentTunedEndpoint,
                        fineTunedProjects: projects,
                        activeFineTunedProjectId: activeProjectId,
                        lastUpdated: new Date().toISOString(),
                        updatedBy: profile?.email || 'Super Admin',
                    },
                    { merge: true }
                ).catch(() => {});
            }

            // 3. Invalidate server-side model cache
            await invalidateAiModelCacheAction().catch(() => {});

            // 4. Create audit log
            if (firestore) {
                const activeModelDesc =
                    selectedAiProvider === 'finetuned'
                        ? `Fine-Tuned Model: "${currentActiveProject?.name}" (${currentTunedEndpoint})`
                        : `Default Gemini API: ${selectedGeminiModel}`;

                await createAuditLog(firestore, {
                    actionName: 'updated',
                    actorId: profile?.id || 'unknown',
                    actorName: profile?.name || profile?.email || 'Super Admin',
                    actorEmail: profile?.email,
                    scope: 'System',
                    resourceName: 'AI Model Configuration',
                    details: `Switched active AI model to: ${activeModelDesc}`,
                }).catch(() => {});
            }

            setIsAiDirty(false);

            toast({
                title: 'AI Settings Saved',
                description:
                    selectedAiProvider === 'finetuned'
                        ? `Fine-Tuned Model "${currentActiveProject?.name}" is now live!`
                        : `Default model switched to ${selectedGeminiModel}!`,
            });
        } catch (err: any) {
            console.error('Failed to update AI model settings:', err);
            toast({
                title: 'Error saving AI settings',
                description: err?.message || 'Failed to update configuration',
                variant: 'destructive',
            });
        } finally {
            setSavingAiSettings(false);
        }
    };

    return (
        <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                            <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            AI Model Routing & Inference Engine
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                            Switch between official Gemini AI models and your fine-tuned Vertex AI project endpoints for platform intelligence.
                        </CardDescription>
                    </div>
                    <Badge
                        variant="outline"
                        className={
                            selectedAiProvider === 'finetuned'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                        }
                    >
                        {selectedAiProvider === 'finetuned' ? 'Fine-Tuned Active' : 'Default Gemini Active'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                {/* PROVIDER SELECTION TILES */}
                <RadioGroup
                    value={selectedAiProvider}
                    onValueChange={(val: 'default' | 'finetuned') => {
                        setSelectedAiProvider(val);
                        setIsAiDirty(true);
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {/* OPTION 1: DEFAULT GEMINI API */}
                    <div
                        onClick={() => {
                            setSelectedAiProvider('default');
                            setIsAiDirty(true);
                        }}
                        className={`flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAiProvider === 'default'
                                ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 shadow-sm'
                                : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem value="default" id="model-default" className="mt-1" />
                            <div className="space-y-1">
                                <Label
                                    htmlFor="model-default"
                                    className="font-semibold text-sm cursor-pointer flex items-center gap-1.5 text-slate-900 dark:text-white"
                                >
                                    <Sparkles className="h-4 w-4 text-cyan-500" />
                                    Default Gemini API
                                </Label>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Official Google Gemini foundation models via Generative Language API. Choose from the complete family of Gemini models below.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                            <span>
                                Active Model:{' '}
                                <span className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                                    {selectedGeminiModel}
                                </span>
                            </span>
                            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                                {AVAILABLE_GEMINI_MODELS.length} Models Available
                            </Badge>
                        </div>
                    </div>

                    {/* OPTION 2: FINE-TUNED VERTEX MODEL */}
                    <div
                        onClick={() => {
                            setSelectedAiProvider('finetuned');
                            setIsAiDirty(true);
                        }}
                        className={`flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAiProvider === 'finetuned'
                                ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm'
                                : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <RadioGroupItem value="finetuned" id="model-finetuned" className="mt-1" />
                            <div className="space-y-1">
                                <Label
                                    htmlFor="model-finetuned"
                                    className="font-semibold text-sm cursor-pointer flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
                                >
                                    <Cpu className="h-4 w-4" />
                                    Fine-Tuned Vertex Model
                                </Label>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Custom fine-tuned models trained on PC building datasets and hardware catalogs. Manage named projects and endpoints below.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate mr-2">
                                Active Project:{' '}
                                <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold truncate">
                                    {currentActiveProject?.name || 'No Project'}
                                </span>
                            </span>
                            <Badge
                                variant="outline"
                                className="text-[9px] uppercase tracking-wider text-amber-500 border-amber-500/30 shrink-0"
                            >
                                {projects.length} Registered
                            </Badge>
                        </div>
                    </div>
                </RadioGroup>

                {/* CONDITIONAL SECTION: DEFAULT GEMINI MODELS CATALOG */}
                {selectedAiProvider === 'default' && (
                    <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.02] dark:bg-cyan-500/[0.04] space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-cyan-500" />
                                    Select Gemini Model Variant
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Choose which Gemini model powers chat conversations, compatibility checking, and recommendation engines.
                                </p>
                            </div>
                            <Badge variant="outline" className="text-xs font-mono text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                                Selected: {selectedGeminiModel}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {AVAILABLE_GEMINI_MODELS.map((model) => {
                                const isSelected = selectedGeminiModel === model.id;
                                const Icon = model.icon;

                                return (
                                    <div
                                        key={model.id}
                                        onClick={() => {
                                            setSelectedGeminiModel(model.id);
                                            setIsAiDirty(true);
                                        }}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                            isSelected
                                                ? 'border-cyan-500 bg-white dark:bg-[#131c2d] ring-2 ring-cyan-500/20 shadow-md'
                                                : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`p-1.5 rounded-lg ${
                                                            isSelected
                                                                ? 'bg-cyan-500 text-white'
                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        <Icon size={14} />
                                                    </div>
                                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                        {model.name}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle2 className="h-4 w-4 text-cyan-500 shrink-0" />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${model.tagColor}`}
                                                >
                                                    {model.tag}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {model.speed}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {model.description}
                                            </p>
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                            <span>Identifier:</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-bold">
                                                {model.id}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* CONDITIONAL SECTION: NAMED FINE-TUNED PROJECTS (VERTEX AI) */}
                {selectedAiProvider === 'finetuned' && (
                    <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/15 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    Named Fine-Tuned Projects (Vertex AI)
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    Register fine-tuned projects and choose which project model the platform routes to.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAddingProject(!isAddingProject)}
                                className="text-xs gap-1.5 border-amber-400/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                            >
                                <Plus size={14} />
                                {isAddingProject ? 'Cancel' : 'Add Project'}
                            </Button>
                        </div>

                        {/* ADD PROJECT FORM */}
                        {isAddingProject && (
                            <div className="p-4 rounded-xl border border-amber-400/40 bg-white dark:bg-[#161d2b] shadow-sm space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Register New Fine-Tuned Project
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="proj-name" className="text-xs font-semibold text-slate-900 dark:text-white">
                                            Project Name
                                        </Label>
                                        <Input
                                            id="proj-name"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            placeholder="e.g. Buildbot Hardware Expert v2"
                                            className="text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="proj-endpoint" className="text-xs font-semibold text-slate-900 dark:text-white">
                                            Project Link / Endpoint
                                        </Label>
                                        <Input
                                            id="proj-endpoint"
                                            value={newProjectEndpoint}
                                            onChange={(e) => setNewProjectEndpoint(e.target.value)}
                                            placeholder="projects/781722135778/locations/us-central1/endpoints/..."
                                            className="font-mono text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsAddingProject(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleAddProject}
                                        className="text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
                                    >
                                        <Plus size={14} />
                                        Save & Select Project
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* LIST OF REGISTERED NAMED PROJECTS */}
                        <div className="space-y-2.5">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Select Active Project Model ({projects.length})
                            </Label>

                            {projects.length === 0 ? (
                                <div className="p-8 text-center rounded-xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-white/50 dark:bg-black/20 space-y-3">
                                    <div className="h-10 w-10 mx-auto rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <Cpu size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">No Fine-Tuned Projects Registered</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                            Add a project name and its Vertex AI resource link or endpoint to route platform intelligence to your custom model.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsAddingProject(true)}
                                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold gap-1.5"
                                    >
                                        <Plus size={14} />
                                        Register Project
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {projects.map((proj) => {
                                        const isSelected = activeProjectId === proj.id;

                                        return (
                                            <div
                                                key={proj.id}
                                                onClick={() => {
                                                    setActiveProjectId(proj.id);
                                                    setIsAiDirty(true);
                                                }}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                                    isSelected
                                                        ? 'border-amber-500 bg-white dark:bg-[#161d2b] ring-2 ring-amber-500/20 shadow-md'
                                                        : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div
                                                        className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                                                            isSelected
                                                                ? 'bg-amber-500 text-white'
                                                                : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                                                        }`}
                                                    >
                                                        <Cpu size={16} />
                                                    </div>

                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                                                                {proj.name}
                                                            </span>
                                                            {isSelected ? (
                                                                <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[9px] uppercase tracking-wider">
                                                                    Active Model
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-[9px] text-slate-500 border-slate-300 dark:border-white/10"
                                                                >
                                                                    Available
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all leading-tight">
                                                            {proj.endpoint}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        color="red"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProjectToDelete(proj);
                                                        }}
                                                        className="h-8 px-2.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 rounded-lg border border-transparent hover:border-rose-500/20 font-semibold"
                                                        title="Delete project"
                                                    >
                                                        <Trash2 size={14} />
                                                        <span className="inline font-bold">Delete</span>
                                                    </Button>
                                                    <div
                                                        className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                                                            isSelected
                                                                ? 'border-amber-500 bg-amber-500 text-white'
                                                                : 'border-slate-300 dark:border-white/20'
                                                        }`}
                                                    >
                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TEST & SAVE CONTROLS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={testingConnection || savingAiSettings}
                        className="text-xs gap-2 border-slate-300 dark:border-white/10"
                    >
                        {testingConnection ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Testing Connection...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                                Test Model Connection
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleSaveAiModelSettings}
                        disabled={savingAiSettings}
                        className="font-semibold bg-cyan-600 hover:bg-cyan-500 text-white text-xs uppercase tracking-wider"
                    >
                        {savingAiSettings ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Applying Model Settings...
                            </>
                        ) : (
                            'Apply AI Settings'
                        )}
                    </Button>
                </div>

                {/* CONNECTION TEST RESULT DISPLAY */}
                {testResult && (
                    <div
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                            testResult.success
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                : testResult.isPermissionError
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5">
                                {testResult.success ? (
                                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                )}
                                {testResult.success
                                    ? `Connection Verified (${testResult.model})`
                                    : 'Permission Configuration Needed'}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                                {testResult.latencyMs}ms
                            </Badge>
                        </div>

                        {testResult.success ? (
                            <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                Response: "{testResult.response}"
                            </p>
                        ) : (
                            <div className="space-y-2 text-slate-700 dark:text-slate-300">
                                <p className="text-amber-800 dark:text-amber-200">
                                    {testResult.remediation?.instructions || testResult.error}
                                </p>
                                {testResult.remediation && (
                                    <div className="p-2.5 rounded bg-white/70 dark:bg-black/40 border border-slate-200 dark:border-white/10 font-mono text-[11px] space-y-1">
                                        <div>
                                            <span className="text-slate-500">Service Account:</span>{' '}
                                            <code className="text-slate-900 dark:text-white">
                                                {testResult.remediation.serviceAccount}
                                            </code>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Required Role:</span>{' '}
                                            <code className="text-amber-600 dark:text-amber-400 font-bold">
                                                {testResult.remediation.requiredRole}
                                            </code>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Project:</span>{' '}
                                            <code className="text-slate-900 dark:text-white">
                                                {testResult.remediation.project}
                                            </code>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 pt-1 text-[11px] text-cyan-700 dark:text-cyan-400">
                                    <Shield className="h-3.5 w-3.5" />
                                    <span>
                                        Automatic fallback is active: user chats and AI tools will continue using Gemini 2.5 Flash without disruption.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            {/* CONFIRM DELETE PROJECT DIALOG */}
            <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
                <AlertDialogContent className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-rose-500" />
                            Delete Fine-Tuned Project?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{projectToDelete?.name}"</strong>? This will remove its endpoint resource link from your registered fine-tuned configurations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 pt-2">
                        <AlertDialogCancel className="rounded-xl text-xs font-bold uppercase tracking-wider border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteProject}
                            className="rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20"
                        >
                            Delete Project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
