"use client";

import React from 'react';
import { Shield, Mail, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface ProfileHeroProps {
    profile: any;
    authUser: any;
    stats: any;
}

export function ProfileHero({ profile, authUser, stats }: ProfileHeroProps) {
    return (
        <div className="w-full bg-muted/30 border-b border-white/5 py-12 mb-8">
            <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary/20">
                            {profile?.name?.substring(0, 1).toUpperCase() || authUser?.email?.substring(0, 1).toUpperCase() || '?'}
                        </div>
                        {profile?.isSuperAdmin && (
                            <div className="absolute -bottom-2 -right-2 bg-background border border-white/10 rounded-lg p-1.5 shadow-lg">
                                <Shield className="h-4 w-4 text-primary" />
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <h1 className="text-4xl font-headline font-bold tracking-tight">
                                {profile?.name || "Member Name"}
                            </h1>
                            {profile?.isSuperAdmin && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    Super Admin
                                </Badge>
                            )}
                            {profile?.isManager && !profile?.isSuperAdmin && (
                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 hover:bg-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    Manager
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1.5 text-sm">
                                <Mail className="h-3.5 w-3.5" /> {authUser?.email}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span className="flex items-center gap-1.5 text-sm">
                                <Calendar className="h-3.5 w-3.5" /> Joined {authUser?.metadata?.creationTime ? new Date(authUser.metadata.creationTime).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Unknown'}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1" />

                    {(!profile?.isManager && !profile?.isSuperAdmin) && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full md:w-auto">
                            <div className="bg-background/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center md:items-start min-w-[120px]">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Total Builds</p>
                                <p className="text-2xl font-headline font-bold">{stats.totalBuilds}</p>
                            </div>
                            <div className="bg-background/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center md:items-start min-w-[120px]">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Active</p>
                                <p className="text-2xl font-headline font-bold text-primary">{stats.activeBuilds}</p>
                            </div>
                            <div className="bg-background/40 border border-white/5 rounded-2xl p-4 hidden md:flex flex-col items-start min-w-[140px]">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">Investment</p>
                                <p className="text-xl font-headline font-bold text-emerald-500">{formatCurrency(stats.totalValue)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
