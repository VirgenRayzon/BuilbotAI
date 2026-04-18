'use client';

import React, { useMemo } from 'react';
import { Bell, Check, Archive, ShieldCheck, History, Info, X } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, arrayUnion, writeBatch } from 'firebase/firestore';
import { useUserProfile } from '@/context/user-profile';
import { SystemNotification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export function NotificationCenter() {
    const firestore = useFirestore();
    const { profile } = useUserProfile();
    const [selectedNotification, setSelectedNotification] = React.useState<SystemNotification | null>(null);

    const notificationsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'system_notifications'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
    }, [firestore]);

    const { data: notifications, loading } = useCollection<SystemNotification>(notificationsQuery);

    const unreadCount = useMemo(() => {
        if (!notifications || !profile) return 0;
        return notifications.filter(n => !n.readBy.includes(profile.id)).length;
    }, [notifications, profile]);

    const handleMarkAsRead = async (notificationId: string) => {
        if (!firestore || !profile) return;
        const notificationRef = doc(firestore, 'system_notifications', notificationId);
        await updateDoc(notificationRef, {
            readBy: arrayUnion(profile.id)
        });
    };

    const handleMarkAllAsRead = async () => {
        if (!firestore || !profile || !notifications) return;
        const unreadNotifications = notifications.filter(n => !n.readBy.includes(profile.id));
        if (unreadNotifications.length === 0) return;

        const batch = writeBatch(firestore);
        unreadNotifications.forEach(n => {
            const ref = doc(firestore, 'system_notifications', n.id);
            batch.update(ref, {
                readBy: arrayUnion(profile!.id)
            });
        });
        await batch.commit();
    };

    const handleNotificationClick = (notification: SystemNotification) => {
        setSelectedNotification(notification);
        if (!notification.readBy.includes(profile?.id || '')) {
            handleMarkAsRead(notification.id);
        }
    };

    const getIcon = (type: SystemNotification['type']) => {
        switch (type) {
            case 'reservation_received': return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
            case 'item_archived': return <Archive className="h-4 w-4 text-orange-500" />;
            case 'status_changed': return <History className="h-4 w-4 text-blue-500" />;
            case 'user_cancelled': return <X className="h-4 w-4 text-rose-500" />;
            default: return <Info className="h-4 w-4 text-primary" />;
        }
    };

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative group transition-all">
                        {unreadCount > 0 ? (
                            <>
                                <Bell className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse shadow-sm">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </>
                        ) : (
                            <Bell className="h-5 w-5 text-foreground/60 group-hover:text-primary transition-colors" />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl" align="end">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <h3 className="font-headline font-bold text-sm">System Alerts</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-7 font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5"
                                onClick={handleMarkAllAsRead}
                            >
                                Mark all as read
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-20">
                                <span className="text-xs text-muted-foreground animate-pulse">Scanning alerts...</span>
                            </div>
                        ) : notifications && notifications.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "p-4 transition-colors relative group cursor-pointer",
                                            !notification.readBy.includes(profile?.id || '') ? "bg-primary/5" : "hover:bg-muted/30"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-grow space-y-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-xs truncate italic">{notification.title}</p>
                                                    {!notification.readBy.includes(profile?.id || '') && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[9px] text-muted-foreground/60 uppercase font-bold tracking-tight">
                                                        {notification.createdAt ? formatDistanceToNow(notification.createdAt instanceof Date ? notification.createdAt : notification.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                                    </span>
                                                    {!notification.readBy.includes(profile?.id || '') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 space-y-2 opacity-40">
                                <Bell className="h-8 w-8 text-muted-foreground" />
                                <p className="text-xs font-bold uppercase tracking-widest">No new alerts</p>
                            </div>
                        )}
                    </ScrollArea>
                    <div className="p-2 border-t border-white/5 bg-muted/20">
                        <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest h-8 opacity-60 hover:opacity-100">
                            View Audit Log
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="sm:max-w-[425px] bg-background/80 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                    <DialogHeader className="pt-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                {selectedNotification && getIcon(selectedNotification.type)}
                            </div>
                            <DialogTitle className="font-headline font-bold text-xl uppercase tracking-tight italic">
                                {selectedNotification?.title}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-black pb-2 border-b border-white/5">
                            System Alert Details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 shadow-inner relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10" />
                            <p className="text-sm font-medium leading-relaxed relative z-10 text-foreground/90">
                                {selectedNotification?.message}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <History className="h-3 w-3" />
                            {selectedNotification?.createdAt ? formatDistanceToNow(selectedNotification.createdAt instanceof Date ? selectedNotification.createdAt : selectedNotification.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[8px] h-4 border-white/10 bg-white/5 uppercase">
                                ID: {selectedNotification?.id.substring(0, 8)}
                            </Badge>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
