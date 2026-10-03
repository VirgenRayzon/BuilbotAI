'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, limit, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, RefreshCw, Mail, Key, Shield, Layout, ExternalLink, Bot, Sparkles, Cpu, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/context/user-profile';
import { useSiteSettings } from '@/context/site-settings-context';
import { createAuditLog } from '@/firebase/audit';
import { testAiModelConnectionAction, updateSiteSettingsAction, invalidateAiModelCacheAction } from '@/app/actions';
import Link from 'next/link';

export function SuperAdminSettings() {
    const [managerKey, setManagerKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [originalManagerDocId, setOriginalManagerDocId] = useState<string | null>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const firestore = useFirestore();
    const { toast } = useToast();
    const { profile } = useUserProfile();
    const { aiModelProvider: activeAiProvider, fineTunedModelId: activeTunedModelId } = useSiteSettings();

    const [selectedAiProvider, setSelectedAiProvider] = useState<'default' | 'finetuned'>(activeAiProvider || 'default');
    const [customModelId, setCustomModelId] = useState<string>(activeTunedModelId || 'projects/781722135778/locations/us-central1/models/2614243376421142528@1');
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

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const result = await testAiModelConnectionAction(selectedAiProvider, customModelId);
            setTestResult(result);
            if (result.success) {
                toast({
                    title: "Model Connection Succeeded",
                    description: `${result.model} responded in ${result.latencyMs}ms.`,
                });
            } else if (result.isPermissionError) {
                toast({
                    title: "IAM Role Required in Google Cloud",
                    description: `Vertex AI User role needed for ${result.remediation?.serviceAccount}. Platform is operating with automatic fallback.`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Connection Test Failed",
                    description: result.error || "Unable to reach model endpoint",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            toast({
                title: "Test Failed",
                description: err.message || "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setTestingConnection(false);
        }
    };


    useEffect(() => {
        if (activeAiProvider) {
            setSelectedAiProvider(activeAiProvider);
        }
    }, [activeAiProvider]);

    useEffect(() => {
        if (activeTunedModelId) {
            setCustomModelId(activeTunedModelId);
        }
    }, [activeTunedModelId]);

    const handleSaveAiModelSettings = async () => {
        setSavingAiSettings(true);
        try {
            // 1. Guaranteed server-side persistence using Admin SDK
            await updateSiteSettingsAction({
                aiModelProvider: selectedAiProvider,
                fineTunedModelId: customModelId.trim(),
                updatedBy: profile?.email || 'Super Admin'
            });

            // 2. Client Firestore write for instant local reactivity
            if (firestore) {
                const siteSettingsRef = doc(firestore, 'siteSettings', 'main');
                await setDoc(siteSettingsRef, {
                    aiModelProvider: selectedAiProvider,
                    fineTunedModelId: customModelId.trim(),
                    lastUpdated: new Date().toISOString(),
                    updatedBy: profile?.email || 'Super Admin'
                }, { merge: true }).catch(() => {});
            }

            // 3. Invalidate server-side model cache
            await invalidateAiModelCacheAction().catch(() => {});

            // 4. Create audit log
            if (firestore) {
                await createAuditLog(firestore, {
                    actionName: 'updated',
                    actorId: profile?.id || 'unknown',
                    actorName: profile?.name || profile?.email || 'Super Admin',
                    actorEmail: profile?.email,
                    scope: 'System',
                    resourceName: 'AI Model Configuration',
                    details: `Switched active AI model to: ${selectedAiProvider === 'finetuned' ? 'Fine-Tuned Model (' + customModelId.trim() + ')' : 'Default Gemini 2.5 Flash'}`
                }).catch(() => {});
            }

            setIsAiDirty(false);

            toast({
                title: "AI Settings Saved",
                description: `Active model switched to: ${selectedAiProvider === 'finetuned' ? 'Fine-Tuned Model' : 'Default Gemini 2.5 Flash'}`
            });
        } catch (err: any) {
            console.error("Failed to update AI model settings:", err);
            toast({
                title: "Error saving AI settings",
                description: err?.message || "Failed to update configuration",
                variant: "destructive"
            });
        } finally {
            setSavingAiSettings(false);
        }
    };

    useEffect(() => {
        async function fetchKeys() {
            if (!firestore) return;
            try {
                const keysRef = collection(firestore, 'authKeys');
                const snapshot = await getDocs(query(keysRef));
                
                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.role === 'manager') {
                        setManagerKey(docSnap.id);
                        setOriginalManagerDocId(docSnap.id);
                    }
                });
            } catch (err) {
                console.error("Error fetching keys:", err);
                toast({
                    title: "Error fetching keys",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        }
        fetchKeys();
    }, [firestore, toast]);

    useEffect(() => {
        if (!firestore) return;
        const q = query(
            collection(firestore, 'keyRequests'), 
            where('status', '==', 'pending')
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            reqs.sort((a: any, b: any) => {
                const dateA = a.requestedAt?.toDate() || 0;
                const dateB = b.requestedAt?.toDate() || 0;
                return dateB - dateA;
            });
            setRequests(reqs);
        }, (err) => {
            console.error("Error listening to requests:", err);
        });

        return () => unsubscribe();
    }, [firestore]);

    useEffect(() => {
        if (!firestore) return;
        const q = query(
            collection(firestore, 'users'), 
            where('isManager', '==', true)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const m = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setManagers(m);
        }, (err) => {
            console.error("Error listening to managers:", err);
        });

        return () => unsubscribe();
    }, [firestore]);

    const handleSaveManagerKey = async () => {
        if (!firestore) return;
        if (!managerKey.trim()) {
            toast({ title: "Error", description: "Manager key cannot be empty", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (originalManagerDocId && originalManagerDocId !== managerKey) {
                await deleteDoc(doc(firestore, 'authKeys', originalManagerDocId));
            }
            await setDoc(doc(firestore, 'authKeys', managerKey), { role: 'manager' });
            setOriginalManagerDocId(managerKey);
            toast({ title: "Success", description: "Manager Key updated successfully" });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to update Manager Key", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleApproveRequest = async (request: any) => {
        if (!firestore) return;
        const newKey = Math.floor(10000000 + Math.random() * 90000000).toString();
        setActionLoading(request.id);
        try {
            // Find manager by email
            const managerQuery = query(collection(firestore, 'users'), where('email', '==', request.email), limit(1));
            const managerSnap = await getDocs(managerQuery);
            
            if (!managerSnap.empty) {
                const managerDoc = managerSnap.docs[0];
                const managerData = managerDoc.data();
                const updates: any = {
                    activeManagerKey: newKey
                };
                if (managerData.activeManagerKey) {
                    updates.deprecatedKeys = arrayUnion(managerData.activeManagerKey);
                }
                await updateDoc(doc(firestore, 'users', managerDoc.id), updates);
            }
            
            await updateDoc(doc(firestore, 'keyRequests', request.id), {
                status: 'approved',
                newKey: newKey,
                processedAt: serverTimestamp()
            });

            await createAuditLog(firestore, {
                actionName: 'auth_update',
                actorId: profile?.id || 'unknown',
                actorName: profile?.name || profile?.email || 'Unknown User',
                actorEmail: profile?.email,
                scope: 'User',
                resourceName: request.email,
                details: `Approved key reset request for manager`
            });
            
            toast({ 
                title: "Request Approved", 
                description: `New Key for ${request.email}: ${newKey}.`,
                duration: 10000 
            });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to approve request", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetManagerKey = async (manager: any) => {
        if (!firestore) return;
        const newKey = Math.floor(10000000 + Math.random() * 90000000).toString();
        setActionLoading(manager.id);
        try {
            const updates: any = {
                activeManagerKey: newKey
            };
            if (manager.activeManagerKey) {
                updates.deprecatedKeys = arrayUnion(manager.activeManagerKey);
            }
            await updateDoc(doc(firestore, 'users', manager.id), updates);
            
            await createAuditLog(firestore, {
                actionName: 'auth_update',
                actorId: profile?.id || 'unknown',
                actorName: profile?.name || profile?.email || 'Unknown User',
                actorEmail: profile?.email,
                scope: 'User',
                resourceName: manager.email,
                resourceId: manager.id,
                details: `Super Admin manually reset manager key`
            });

            toast({ 
                title: "Key Reset", 
                description: `New Key for ${manager.email}: ${newKey}.`,
                duration: 10000 
            });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to reset manager key", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!firestore) return;
        setActionLoading(requestId);
        try {
            await updateDoc(doc(firestore, 'keyRequests', requestId), {
                status: 'rejected',
                processedAt: serverTimestamp()
            });
            toast({ title: "Request Rejected", description: "The key reset request has been rejected." });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            <Card>
                <CardHeader>
                    <CardTitle>Access Keys</CardTitle>
                    <CardDescription>
                        Manage the access keys required for new signups.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Manager Key</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={managerKey} 
                                onChange={(e) => setManagerKey(e.target.value)} 
                                placeholder="Enter Manager Key"
                                type="password"
                            />
                            <Button onClick={handleSaveManagerKey} disabled={saving || managerKey === originalManagerDocId}>
                                Save
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Manager Accounts
                    </CardTitle>
                    <CardDescription>
                        Manage individual manager access keys and view key history.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {managers.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No manager accounts found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {managers.map((manager) => (
                                <div key={manager.id} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card/50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">{manager.email}</p>
                                            <p className="text-xs text-muted-foreground">ID: {manager.id}</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleResetManagerKey(manager)}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === manager.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                                            Reset Key
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center pt-2 border-t text-xs">
                                        <div className="space-y-1">
                                            <span className="text-muted-foreground">Active Key:</span>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-bold">
                                                    {manager.activeManagerKey || 'Legacy/None'}
                                                </code>
                                            </div>
                                        </div>
                                        {manager.deprecatedKeys && manager.deprecatedKeys.length > 0 && (
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Deprecated:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {manager.deprecatedKeys.map((k: string, i: number) => (
                                                        <code key={i} className="bg-muted px-1 py-0.5 rounded font-mono opacity-50 text-[10px]">
                                                            {k}
                                                        </code>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-primary" />
                        Key Reset Requests
                    </CardTitle>
                    <CardDescription>
                        Pending requests from managers who forgot their access key.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No pending requests found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req) => {
                                const requester = managers.find(m => m.email === req.email);
                                return (
                                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{req.email}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                                    {requester ? 'Registered' : 'New Account'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Requested: {req.requestedAt?.toDate().toLocaleString() || 'Just now'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRejectRequest(req.id)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                <span className="ml-2 hidden sm:inline">Reject</span>
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleApproveRequest(req)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                <span className="ml-2 hidden sm:inline">Approve</span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI MODEL CONFIGURATION */}
            <Card className="border-border/60 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5 text-primary" />
                                AI Model Intelligence Configuration
                            </CardTitle>
                            <CardDescription>
                                Switch between the default Gemini AI model and your fine-tuned Vertex AI model for platform intelligence.
                            </CardDescription>
                        </div>
                        <Badge 
                            variant="outline" 
                            className={selectedAiProvider === 'finetuned' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-primary/10 text-primary border-primary/30'}
                        >
                            {selectedAiProvider === 'finetuned' ? 'Fine-Tuned Active' : 'Default Model Active'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RadioGroup 
                        value={selectedAiProvider} 
                        onValueChange={(val: 'default' | 'finetuned') => { setSelectedAiProvider(val); setIsAiDirty(true); }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <div 
                            onClick={() => { setSelectedAiProvider('default'); setIsAiDirty(true); }}
                            className={`flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedAiProvider === 'default' 
                                    ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' 
                                    : 'border-border/40 bg-card/40 hover:bg-card/70'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <RadioGroupItem value="default" id="model-default" className="mt-1" />
                                <div className="space-y-1">
                                    <Label htmlFor="model-default" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        Default Gemini API
                                    </Label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Standard Google Gemini 2.5 Flash model via standard Generative Language API. Fast and cost-effective.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Engine: <span className="text-foreground font-mono">gemini-2.5-flash</span></span>
                                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">Standard</Badge>
                            </div>
                        </div>

                        <div 
                            onClick={() => { setSelectedAiProvider('finetuned'); setIsAiDirty(true); }}
                            className={`flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedAiProvider === 'finetuned' 
                                    ? 'border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                                    : 'border-border/40 bg-card/40 hover:bg-card/70'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <RadioGroupItem value="finetuned" id="model-finetuned" className="mt-1" />
                                <div className="space-y-1">
                                    <Label htmlFor="model-finetuned" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5 text-amber-500">
                                        <Cpu className="h-4 w-4" />
                                        Fine-Tuned Vertex Model
                                    </Label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Specialized fine-tuned model trained on custom hardware and PC building datasets in Google Cloud.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Deployment: <span className="text-amber-500 font-mono">Vertex AI</span></span>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-amber-500 border-amber-500/30">Custom</Badge>
                            </div>
                        </div>
                    </RadioGroup>

                    {selectedAiProvider === 'finetuned' && (
                        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="custom-model-id" className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                                    <Cpu className="h-3.5 w-3.5" />
                                    Vertex AI Model Resource Identifier / Endpoint
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    The fully-qualified Google Cloud Vertex AI resource path or deployed endpoint.
                                </p>
                            </div>
                            <Input
                                id="custom-model-id"
                                value={customModelId}
                                onChange={(e) => { setCustomModelId(e.target.value); setIsAiDirty(true); }}
                                placeholder="projects/7817221357778/locations/us-central1/models/..."
                                className="font-mono text-xs bg-background/80"
                            />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testingConnection || savingAiSettings || (selectedAiProvider === 'finetuned' && !customModelId.trim())}
                            className="text-xs gap-2"
                        >
                            {testingConnection ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Testing Connection...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    Test Model Connection
                                </>
                            )}
                        </Button>

                        <Button 
                            onClick={handleSaveAiModelSettings} 
                            disabled={savingAiSettings || (selectedAiProvider === 'finetuned' && !customModelId.trim())}
                            className="font-semibold"
                        >
                            {savingAiSettings ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Applying Model Settings...
                                </>
                            ) : (
                                "Apply AI Settings"
                            )}
                        </Button>
                    </div>

                    {testResult && (
                        <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                            testResult.success 
                                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                : testResult.isPermissionError 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                                    : 'bg-destructive/10 border-destructive/30 text-destructive-foreground'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold flex items-center gap-1.5">
                                    {testResult.success ? <Check className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                                    {testResult.success ? "Connection Verified" : "Permission Configuration Needed"}
                                </span>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                    {testResult.latencyMs}ms
                                </Badge>
                            </div>

                            {testResult.success ? (
                                <p className="text-muted-foreground font-mono text-[11px]">
                                    Response: "{testResult.response}"
                                </p>
                            ) : (
                                <div className="space-y-2 text-muted-foreground">
                                    <p className="text-amber-200">
                                        {testResult.remediation?.instructions || testResult.error}
                                    </p>
                                    {testResult.remediation && (
                                        <div className="p-2.5 rounded bg-background/60 border border-border/40 font-mono text-[11px] space-y-1">
                                            <div><span className="text-muted-foreground">Service Account:</span> <code className="text-foreground">{testResult.remediation.serviceAccount}</code></div>
                                            <div><span className="text-muted-foreground">Required Role:</span> <code className="text-amber-400 font-bold">{testResult.remediation.requiredRole}</code></div>
                                            <div><span className="text-muted-foreground">Project:</span> <code className="text-foreground">{testResult.remediation.project}</code></div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 pt-1 text-[11px] text-primary">
                                        <Shield className="h-3.5 w-3.5" />
                                        <span>Automatic fallback is active: user chats and AI tools will continue using Gemini 2.5 Flash without disruption.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* TEST_BUILDERS_AB_TESTING_START */}
            <Card className="border-primary/20 bg-background/50 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5 text-primary" />
                        Layout A/B Testing
                    </CardTitle>
                    <CardDescription>
                        Evaluate alternative designs for the PC Builder user interface. (Super Admin Only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col justify-between p-5 border border-border/40 rounded-2xl bg-card/40 hover:bg-card/70 transition-all group">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">Test Builder 1</h3>
                                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[9px] font-bold uppercase tracking-wider">FAB + Pinning</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Hides the "Your Build" sidebar panel by default, expanding the parts inventory list to full width. 
                                Adds a Floating Action Button (FAB) at the bottom-right that opens "Your Build" in a sliding drawer. 
                                Offers a "Pin to Sidebar" action to lock it in place as a docked left column (matching the default layout).
                            </p>
                        </div>
                        <div className="pt-5">
                            <Button asChild size="sm" className="w-full rounded-xl font-bold uppercase tracking-widest text-[9px]">
                                <Link href="/test-builder-1" className="flex items-center justify-center gap-1.5">
                                    Open Test Builder 1 <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between p-5 border border-border/40 rounded-2xl bg-card/40 hover:bg-card/70 transition-all group">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">Test Builder 2</h3>
                                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[9px] font-bold uppercase tracking-wider">Standalone + Browse</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Transforms "Your Build" into a standalone, dedicated status page. 
                                Each empty component category displays an explicit "+ Add" button. 
                                Clicking it navigates to a dedicated search page to filter and select components. 
                                Retains the exact same compatibility checks, power analysis, and reservation system.
                            </p>
                        </div>
                        <div className="pt-5">
                            <Button asChild size="sm" className="w-full rounded-xl font-bold uppercase tracking-widest text-[9px]">
                                <Link href="/test-builder-2" className="flex items-center justify-center gap-1.5">
                                    Open Test Builder 2 <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* TEST_BUILDERS_AB_TESTING_END */}
        </div>
    );
}
