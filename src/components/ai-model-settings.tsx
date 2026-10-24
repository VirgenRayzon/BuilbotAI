'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
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
    Zap,
    Brain,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    X,
    SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/context/user-profile';
import { useSiteSettings, type FineTunedProject } from '@/context/site-settings-context';
import { type AiFeatureKey, type FeatureModelRouting } from '@/lib/ai-model-resolver';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function InfoPopover({ message, label = 'More information' }: { message: string; label?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    role="button"
                    tabIndex={0}
                    aria-label={label}
                    onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.stopPropagation();
                            event.preventDefault();
                        }
                    }}
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold leading-none text-slate-500 transition-colors hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-white/15 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
                >
                    !
                </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs border-slate-200 bg-white text-xs leading-relaxed text-slate-700 shadow-lg dark:border-white/10 dark:bg-[#141a23] dark:text-slate-200">
                {message}
            </TooltipContent>
        </Tooltip>
    );
}

// Standard available Gemini API models with specs & badges
export const AVAILABLE_GEMINI_MODELS = [
    {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        tag: 'Latest Gen',
        tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        badgeVariant: 'default' as const,
        description: 'The latest model recommended for updated features and improvements via the Interactions API.',
        speed: 'Next-Gen Speed',
        contextWindow: '1M tokens',
        icon: Zap,
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        tag: 'Default',
        tagColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        badgeVariant: 'default' as const,
        description: 'Marked as the recommended default, serving as the live fallback engine for chat and AI tools.',
        speed: 'Ultra Fast',
        contextWindow: '1M tokens',
        icon: Zap,
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        tag: 'Reasoning',
        tagColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        badgeVariant: 'secondary' as const,
        description: 'Fully operational for complex architectural reasoning and intricate compatibility validation.',
        speed: 'High Intelligence',
        contextWindow: '2M tokens',
        icon: Brain,
    },
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        tag: 'Throughput',
        tagColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        badgeVariant: 'outline' as const,
        description: 'Fully operational general-purpose model providing fast throughput across routine tasks.',
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
        description: 'Fully operational model featuring a 2M token context window for ingesting large specification datasets.',
        speed: 'Comprehensive',
        contextWindow: '2M tokens',
        icon: Brain,
    },
];

const DEFAULT_PROJECT_ENDPOINT = 'projects/781722135778/locations/us-central1/endpoints/2302171190132736000';

const AI_FEATURES_CONFIG: Array<{
    key: AiFeatureKey;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    tag: string;
    speedNotes?: string;
}> = [
    {
        key: 'chatbot',
        name: 'Buildbot Chat Assistance',
        description: 'Interactive hardware consultant & floating chat assistant for real-time parts advice and compatibility questions.',
        icon: MessageSquare,
        tag: 'Chat Widget & API',
    },
    {
        key: 'buildAdvisor',
        name: 'Build Advisor Recommendation',
        description: 'Generates full 8-component builds with budget allocation, performance tiering, and Philippine retailer market research.',
        icon: Sparkles,
        tag: 'Recommendation Engine',
        speedNotes: 'Default Gemini API runs live web pricing research in ~35s without hitting timeouts.',
    },
    {
        key: 'prebuiltAdvisor',
        name: 'Prebuilt Builder Advisor',
        description: 'Evaluates prebuilt PC configurations, performs component balance checks, and suggests hardware upgrades.',
        icon: Cpu,
        tag: 'Prebuilt Systems',
    },
];

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
        featureModelRouting: activeFeatureRouting,
    } = useSiteSettings();

    // Active engine tab: choose whether to view/configure the Gemini catalog or Fine-Tuned projects
    const [activeEngineTab, setActiveEngineTab] = useState<'gemini' | 'finetuned'>(() => {
        return activeAiProvider === 'finetuned' ? 'finetuned' : 'gemini';
    });
    const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>(
        activeGeminiModel || 'gemini-2.5-flash'
    );

    // Per-feature model routing state
    const [featureRouting, setFeatureRouting] = useState<FeatureModelRouting>(() => {
        if (activeFeatureRouting) return activeFeatureRouting;
        return {
            chatbot: activeAiProvider || 'default',
            buildAdvisor: activeAiProvider || 'default',
            prebuiltAdvisor: activeAiProvider || 'default',
        };
    });

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

    useEffect(() => {
        if (activeFeatureRouting) {
            setFeatureRouting(activeFeatureRouting);
        }
    }, [activeFeatureRouting]);

    // Active project lookup
    const currentActiveProject = projects.find((p) => p.id === activeProjectId) || projects[0];
    const currentTunedEndpoint = currentActiveProject?.endpoint || DEFAULT_PROJECT_ENDPOINT;

    // Routing metrics across all features
    const routingValues = Object.values(featureRouting);
    const allVertex = routingValues.length > 0 && routingValues.every((v) => v === 'finetuned');
    const allGemini = routingValues.length > 0 && routingValues.every((v) => v === 'default');
    const currentRoutingMode: 'vertex' | 'gemini' | 'hybrid' = allVertex
        ? 'vertex'
        : allGemini
            ? 'gemini'
            : 'hybrid';

    // Bulk preset actions
    const handleRouteAll = (mode: 'default' | 'finetuned') => {
        setFeatureRouting({
            chatbot: mode,
            buildAdvisor: mode,
            prebuiltAdvisor: mode,
        });
        setIsAiDirty(true);
        toast({
            title: mode === 'default' ? 'All Workloads Routed to Gemini' : 'All Workloads Routed to Fine-Tuned',
            description: `Remember to click "Apply AI Settings" to save changes.`,
        });
    };

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
            const targetProvider = activeEngineTab === 'finetuned' ? 'finetuned' : 'default';
            const result = await testAiModelConnectionAction(
                targetProvider,
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
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            toast({
                title: 'Test Failed',
                description: message,
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
            const effectiveGlobalProvider: 'default' | 'finetuned' = allVertex ? 'finetuned' : 'default';

            const saveResult = await updateSiteSettingsAction({
                aiModelProvider: effectiveGlobalProvider,
                defaultGeminiModel: selectedGeminiModel,
                fineTunedModelId: currentTunedEndpoint,
                fineTunedProjects: projects,
                activeFineTunedProjectId: activeProjectId,
                featureModelRouting: featureRouting,
                updatedBy: profile?.email || 'Super Admin',
            });
            if (!saveResult.success) {
                throw new Error(saveResult.error || 'Failed to save AI settings.');
            }
            if (saveResult.resolvedProjects) setProjects(saveResult.resolvedProjects);

            await invalidateAiModelCacheAction().catch(() => { });

            if (firestore) {
                const summaryRouting = `Chatbot: ${featureRouting.chatbot}, Advisor: ${featureRouting.buildAdvisor}, Prebuilts: ${featureRouting.prebuiltAdvisor}`;
                const activeModelDesc = `Gemini: ${selectedGeminiModel} | Fine-Tuned: "${currentActiveProject?.name}" (${saveResult.resolvedEndpoint}) | Routing: [${summaryRouting}]`;

                await createAuditLog(firestore, {
                    actionName: 'updated',
                    actorId: profile?.id || 'unknown',
                    actorName: profile?.name || profile?.email || 'Super Admin',
                    actorEmail: profile?.email,
                    scope: 'System',
                    resourceName: 'AI Model Configuration',
                    details: `Updated AI Model Configuration: ${activeModelDesc}`,
                }).catch(() => { });
            }

            setIsAiDirty(false);

            toast({
                title: 'AI Settings Saved',
                description: `Settings live! Default Gemini: ${selectedGeminiModel}, Active Fine-Tuned: "${currentActiveProject?.name}".`,
            });
        } catch (err: unknown) {
            console.error('Failed to update AI model settings:', err);
            const message = err instanceof Error ? err.message : 'Failed to update configuration';
            toast({
                title: 'Error saving AI settings',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setSavingAiSettings(false);
        }
    };

    return (
        <TooltipProvider delayDuration={150}>
            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm">
                {/* COMPACT CARD HEADER */}
                <CardHeader className="p-3 border-b border-slate-100 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                <Bot className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-bold font-headline text-slate-900 dark:text-white flex items-center gap-1.5">
                                AI Model Routing & Inference Engine
                                <InfoPopover message="Configure official Gemini foundation models, manage fine-tuned Vertex AI project endpoints, and assign models to individual features." />
                            </CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                            {isAiDirty && (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                    Unsaved Changes
                                </Badge>
                            )}
                            <Badge
                                variant="outline"
                                className={
                                    currentRoutingMode === 'vertex'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs'
                                        : currentRoutingMode === 'gemini'
                                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 text-xs'
                                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs'
                                }
                            >
                                {currentRoutingMode === 'vertex'
                                    ? 'Vertex AI Active'
                                    : currentRoutingMode === 'gemini'
                                        ? 'Default Gemini Active'
                                        : 'Hybrid Routing Active'}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-3 space-y-3">
                    {/* SECTION 1: ENGINE STRIP & MODEL CATALOG */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                Model Engines & Active Catalogs
                            </Label>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Switch engine to manage variants
                            </span>
                        </div>

                        {/* HIGH-DENSITY ENGINE SELECTOR TABS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* GEMINI ENGINE BUTTON */}
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setActiveEngineTab('gemini');
                                    }
                                }}
                                onClick={() => setActiveEngineTab('gemini')}
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${activeEngineTab === 'gemini'
                                    ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 shadow-sm ring-1 ring-cyan-500/30'
                                    : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 hover:border-cyan-500/40 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                        className={`p-1.5 rounded-lg shrink-0 ${activeEngineTab === 'gemini'
                                            ? 'bg-cyan-500 text-white shadow-sm'
                                            : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                                            }`}
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                Default Gemini API
                                            </span>
                                            <InfoPopover label="About Gemini API" message="Official Google Gemini models via Generative Language API. Used for general intelligence and fallback." />
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            Active:{' '}
                                            <span className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
                                                {selectedGeminiModel}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={activeEngineTab === 'gemini' ? 'default' : 'outline'}
                                    className={
                                        activeEngineTab === 'gemini'
                                            ? 'bg-cyan-600 text-white text-[9px] uppercase tracking-wider shrink-0'
                                            : 'text-[9px] uppercase tracking-wider text-slate-500 border-slate-300 dark:border-white/10 shrink-0'
                                    }
                                >
                                    {activeEngineTab === 'gemini' ? 'Configuring' : `${AVAILABLE_GEMINI_MODELS.length} Models`}
                                </Badge>
                            </div>

                            {/* VERTEX AI ENGINE BUTTON */}
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setActiveEngineTab('finetuned');
                                    }
                                }}
                                onClick={() => setActiveEngineTab('finetuned')}
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${activeEngineTab === 'finetuned'
                                    ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30'
                                    : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 hover:border-amber-500/40 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                        className={`p-1.5 rounded-lg shrink-0 ${activeEngineTab === 'finetuned'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            }`}
                                    >
                                        <Cpu className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                Fine-Tuned Vertex Model
                                            </span>
                                            <InfoPopover label="About Vertex AI" message="Custom fine-tuned PC hardware models on Google Cloud Vertex AI endpoints." />
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            Active:{' '}
                                            <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold truncate">
                                                {currentActiveProject?.name || 'No Project'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={activeEngineTab === 'finetuned' ? 'default' : 'outline'}
                                    className={
                                        activeEngineTab === 'finetuned'
                                            ? 'bg-amber-600 text-white text-[9px] uppercase tracking-wider shrink-0'
                                            : 'text-[9px] uppercase tracking-wider text-amber-500 border-amber-500/30 shrink-0'
                                    }
                                >
                                    {activeEngineTab === 'finetuned' ? 'Configuring' : `${projects.length} Registered`}
                                </Badge>
                            </div>
                        </div>

                        {/* COMPACT GEMINI MODEL CARDS VIEW */}
                        {activeEngineTab === 'gemini' && (
                            <div className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.02] dark:bg-cyan-500/[0.03] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3 text-cyan-500" />
                                        Select Active Foundation Model:
                                    </span>
                                    <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">
                                        Active: <strong>{selectedGeminiModel}</strong>
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                    {AVAILABLE_GEMINI_MODELS.map((model) => {
                                        const isSelected = selectedGeminiModel === model.id;
                                        const Icon = model.icon;

                                        return (
                                            <div
                                                key={model.id}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        setSelectedGeminiModel(model.id);
                                                        setIsAiDirty(true);
                                                    }
                                                }}
                                                onClick={() => {
                                                    setSelectedGeminiModel(model.id);
                                                    setIsAiDirty(true);
                                                }}
                                                className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative ${isSelected
                                                    ? 'border-cyan-500 bg-white dark:bg-[#131c2d] ring-1 ring-cyan-500 shadow-sm'
                                                    : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 hover:border-cyan-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between w-full gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <Icon className={`h-3 w-3 shrink-0 ${isSelected ? 'text-cyan-500' : 'text-slate-400'}`} />
                                                        <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                                                            {model.name.replace('Gemini ', '')}
                                                        </span>
                                                    </div>
                                                    {isSelected ? (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                                                    ) : (
                                                        <InfoPopover label={model.name} message={model.description} />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100 dark:border-white/5 text-[9px]">
                                                    <span className={`px-1.5 py-0.2 rounded border font-semibold ${model.tagColor}`}>
                                                        {model.tag}
                                                    </span>
                                                    <span className="text-slate-400 font-mono">
                                                        {model.contextWindow}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* COMPACT VERTEX PROJECTS VIEW */}
                        {activeEngineTab === 'finetuned' && (
                            <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10 space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Cpu className="h-3.5 w-3.5 text-amber-500" />
                                        Registered Fine-Tuned Projects ({projects.length})
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsAddingProject(!isAddingProject)}
                                        className="h-7 text-xs gap-1 border-amber-400/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                                    >
                                        {isAddingProject ? <ChevronUp size={13} /> : <Plus size={13} />}
                                        {isAddingProject ? 'Close' : 'Register Project'}
                                    </Button>
                                </div>

                                {/* COLLAPSIBLE ADD PROJECT PANEL */}
                                {isAddingProject && (
                                    <div className="p-2.5 rounded-lg border border-amber-400/30 bg-white dark:bg-[#161d2b] shadow-sm space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="proj-name" className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                                    Project Name
                                                </Label>
                                                <Input
                                                    id="proj-name"
                                                    value={newProjectName}
                                                    onChange={(e) => setNewProjectName(e.target.value)}
                                                    placeholder="e.g. Buildbot Hardware Expert v2"
                                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor="proj-endpoint" className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                                                    Vertex AI Endpoint / Resource Link
                                                </Label>
                                                <Input
                                                    id="proj-endpoint"
                                                    value={newProjectEndpoint}
                                                    onChange={(e) => setNewProjectEndpoint(e.target.value)}
                                                    placeholder="projects/.../locations/.../endpoints/..."
                                                    className="h-8 font-mono text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-1.5 pt-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setIsAddingProject(false)}
                                                className="h-7 text-xs"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleAddProject}
                                                className="h-7 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white gap-1"
                                            >
                                                <Plus size={13} />
                                                Save & Select
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* COMPACT PROJECTS LIST */}
                                {projects.length === 0 ? (
                                    <div className="p-4 text-center rounded-lg border border-dashed border-amber-300 dark:border-amber-500/30 bg-white/50 dark:bg-black/20 space-y-1.5">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">No Fine-Tuned Projects Registered</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Click &quot;Register Project&quot; above to connect your custom Vertex AI endpoint.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {projects.map((proj) => {
                                            const isSelected = activeProjectId === proj.id;

                                            return (
                                                <div
                                                    key={proj.id}
                                                    onClick={() => {
                                                        setActiveProjectId(proj.id);
                                                        setIsAiDirty(true);
                                                    }}
                                                    className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${isSelected
                                                        ? 'border-amber-500 bg-white dark:bg-[#161d2b] ring-1 ring-amber-500/30 shadow-sm'
                                                        : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 hover:border-amber-500/30'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div
                                                            className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                                                                ? 'border-amber-500 bg-amber-500 text-white'
                                                                : 'border-slate-300 dark:border-white/20'
                                                                }`}
                                                        >
                                                            {isSelected && <Check size={10} strokeWidth={3} />}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                                                    {proj.name}
                                                                </span>
                                                                {isSelected && (
                                                                    <Badge className="bg-amber-500 text-white text-[8px] uppercase tracking-wider h-4 px-1.5">
                                                                        Active
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                                                                {proj.endpoint}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setProjectToDelete(proj);
                                                        }}
                                                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg shrink-0"
                                                        title="Delete project"
                                                    >
                                                        <Trash2 size={13} />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: WORKLOAD ROUTING MATRIX (HIGH DENSITY ROWS) */}
                    <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.02] dark:bg-indigo-500/[0.03] space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                <Brain className="h-4 w-4 text-indigo-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                    Workload Routing Matrix
                                </span>
                                <InfoPopover label="Workload Routing" message="Assign each platform feature to either Default Gemini API or Fine-Tuned Vertex AI." />
                            </div>

                            {/* QUICK PRESET TOOLBAR */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRouteAll('default')}
                                    className="h-6 px-2 text-[10px] border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                                >
                                    <Sparkles size={11} className="mr-1" />
                                    Route All to Gemini
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRouteAll('finetuned')}
                                    className="h-6 px-2 text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                >
                                    <Cpu size={11} className="mr-1" />
                                    Route All to Vertex
                                </Button>
                            </div>
                        </div>

                        {/* COMPACT MATRIX ROWS */}
                        <div className="space-y-1.5">
                            {AI_FEATURES_CONFIG.map((feat) => {
                                const currentRoute = featureRouting[feat.key] || 'default';
                                const Icon = feat.icon;
                                const isDefault = currentRoute === 'default';

                                return (
                                    <div
                                        key={feat.key}
                                        className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131c2d] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                <Icon className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                        {feat.name}
                                                    </span>
                                                    <InfoPopover label={feat.name} message={feat.description} />
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                                                        {feat.tag}
                                                    </Badge>
                                                </div>
                                                {feat.speedNotes && (
                                                    <p className="text-[10px] text-cyan-600 dark:text-cyan-400 truncate">
                                                        💡 {feat.speedNotes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* INLINE SEGMENTED TOGGLE */}
                                        <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-black/30 shrink-0 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFeatureRouting((prev) => ({ ...prev, [feat.key]: 'default' }));
                                                    setIsAiDirty(true);
                                                }}
                                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${isDefault
                                                    ? 'bg-cyan-600 text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <Sparkles size={11} />
                                                <span>Gemini API</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFeatureRouting((prev) => ({ ...prev, [feat.key]: 'finetuned' }));
                                                    setIsAiDirty(true);
                                                }}
                                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${!isDefault
                                                    ? 'bg-amber-600 text-white shadow-sm'
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <Cpu size={11} />
                                                <span>Fine-Tuned</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION 3: FOOTER ACTIONS & DIAGNOSTICS */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testingConnection || savingAiSettings}
                            className="h-8 text-xs gap-1.5 border-slate-300 dark:border-white/10"
                        >
                            {testingConnection ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Testing Connection...
                                </>
                            ) : activeEngineTab === 'finetuned' ? (
                                <>
                                    <Cpu className="h-3.5 w-3.5 text-amber-500" />
                                    Test Vertex AI Endpoint
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                                    Test Gemini Connection
                                </>
                            )}
                        </Button>

                        <div className="flex items-center justify-end gap-2">
                            <Button
                                onClick={handleSaveAiModelSettings}
                                disabled={savingAiSettings}
                                className="h-8 px-4 font-semibold bg-cyan-600 hover:bg-cyan-500 text-white text-xs uppercase tracking-wider"
                            >
                                {savingAiSettings ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    'Apply AI Settings'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* CONNECTION TEST RESULT BANNER */}
                    {testResult && (
                        <div
                            className={`p-2.5 rounded-xl border text-xs space-y-1.5 relative ${testResult.success
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                : testResult.isPermissionError
                                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
                                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold flex items-center gap-1.5">
                                    {testResult.success ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    )}
                                    {testResult.success
                                        ? `Connection Verified (${testResult.model})`
                                        : 'Configuration Action Required'}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className="font-mono text-[9px] h-4 px-1.5">
                                        {testResult.latencyMs}ms
                                    </Badge>
                                    <button
                                        type="button"
                                        onClick={() => setTestResult(null)}
                                        className="h-4 w-4 inline-flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>

                            {testResult.success ? (
                                <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate">
                                    Response: &quot;{testResult.response}&quot;
                                </p>
                            ) : (
                                <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                                    <p className="text-amber-800 dark:text-amber-200">
                                        {testResult.remediation?.instructions || testResult.error}
                                    </p>
                                    {testResult.remediation && (
                                        <div className="p-2 rounded bg-white/70 dark:bg-black/40 border border-slate-200 dark:border-white/10 font-mono text-[10px] space-y-0.5">
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
                                    <div className="flex items-center gap-1.5 pt-0.5 text-[10px] text-cyan-700 dark:text-cyan-400">
                                        <Shield className="h-3 w-3 shrink-0" />
                                        <span>
                                            Automatic fallback active: platform uses Gemini 2.5 Flash without disruption.
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
                            <AlertDialogTitle className="text-base font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                                <Trash2 className="h-4 w-4 text-rose-500" />
                                Delete Fine-Tuned Project?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">&quot;{projectToDelete?.name}&quot;</strong>? This will remove its endpoint resource link from your registered fine-tuned configurations.
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
        </TooltipProvider>
    );
}
