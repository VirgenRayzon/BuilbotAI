"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User as UserIcon, Mail, Shield, Key, Loader2, ArrowUpRight, ServerCrash, PlugZap, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountDetailsProps {
    profile: any;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    name: string;
    setName: (val: string) => void;
    email: string;
    setEmail: (val: string) => void;
    isSaving: boolean;
    handleSaveProfile: () => void;
    superAdminKey: string;
    setSuperAdminKey: (val: string) => void;
    originalSuperAdminKey: string;
    isSavingKey: boolean;
    handleSaveSuperAdminKey: () => void;
    emergency: {
        isMaintenanceMode: boolean;
        handleToggleMaintenance: () => void;
        isStorageKillSwitch: boolean;
        handleToggleStorageKillSwitch: () => void;
        isAiKillSwitch: boolean;
        handleToggleAiKillSwitch: () => void;
    };
}

export function AccountDetails({
    profile,
    isEditing,
    setIsEditing,
    name,
    setName,
    email,
    setEmail,
    isSaving,
    handleSaveProfile,
    superAdminKey,
    setSuperAdminKey,
    originalSuperAdminKey,
    isSavingKey,
    handleSaveSuperAdminKey,
    emergency
}: AccountDetailsProps) {
    return (
        <Card className="border-white/5 bg-muted/10 overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Account Details</CardTitle>
                        <CardDescription>Manage your identity</CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className={cn("relative z-30", isEditing ? "text-primary" : "text-muted-foreground")}
                    >
                        {isEditing ? "Cancel" : "Edit"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                    <div className="relative group">
                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-focus-within:opacity-100" />
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditing}
                            className="pl-10 h-10 bg-background/50 border-white/5 focus-visible:ring-primary/30"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground ml-1">Contact Email</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50 transition-opacity group-focus-within:opacity-100" />
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditing}
                            className="pl-10 h-10 bg-background/50 border-white/5 focus-visible:ring-primary/30"
                        />
                    </div>
                </div>

                {profile?.isSuperAdmin && (
                    <>
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <Label htmlFor="superAdminKey" className="text-xs uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <Key className="h-3 w-3" /> Super Admin Key
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    id="superAdminKey"
                                    value={superAdminKey}
                                    onChange={(e) => setSuperAdminKey(e.target.value)}
                                    disabled={!isEditing}
                                    className="h-10 bg-background/50 border-white/5 focus-visible:ring-primary/30"
                                    type="password"
                                />
                                {isEditing && (
                                    <Button size="sm" onClick={handleSaveSuperAdminKey} disabled={isSavingKey || superAdminKey === originalSuperAdminKey}>
                                        {isSavingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <EmergencyToggle 
                                icon={ServerCrash} title="Maintenance Mode" label="System Status"
                                active={emergency.isMaintenanceMode} onClick={emergency.handleToggleMaintenance} 
                            />
                            <EmergencyToggle 
                                icon={PlugZap} title="Chaos Mode" label="Storage Status"
                                active={emergency.isStorageKillSwitch} onClick={emergency.handleToggleStorageKillSwitch}
                                activeColor="text-amber-500" activeBg="bg-amber-600"
                            />
                            <EmergencyToggle 
                                icon={BrainCircuit} title="AI Kill Switch" label="Neural Status"
                                active={emergency.isAiKillSwitch} onClick={emergency.handleToggleAiKillSwitch}
                                activeColor="text-rose-500" activeBg="bg-rose-600"
                            />
                        </div>
                    </>
                )}

                {isEditing && (
                    <Button className="w-full mt-2" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
                        Update Profile
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

function EmergencyToggle({ icon: Icon, title, label, active, onClick, activeColor = "text-destructive", activeBg = "bg-destructive" }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-background/30 transition-all hover:border-primary/20">
            <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Icon className={cn("h-3 w-3", active ? `${activeColor} animate-pulse` : "text-muted-foreground")} /> {label}
                </p>
                <p className="text-sm font-bold font-headline">{title}</p>
            </div>
            <Button
                size="sm"
                variant={active ? "destructive" : "outline"}
                className={cn("h-8 text-[10px] uppercase font-black", active && activeBg !== "bg-destructive" && `${activeBg} text-white border-none`)}
                onClick={onClick}
            >
                {active ? "ACTIVE" : "OFF"}
            </Button>
        </div>
    );
}
