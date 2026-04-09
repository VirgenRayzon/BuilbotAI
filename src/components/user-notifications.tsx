
"use client";

import { useState, useMemo } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useCollection } from "@/firebase/firestore/use-collection";
import { Bell, BellRing, Check, Trash2, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

export function UserNotifications() {
    const { authUser, loading } = useUserProfile();
    const firestore = useFirestore();
    const [open, setOpen] = useState(false);

    const notificationsQuery = useMemo(() => {
        if (!firestore || !authUser) return null;
        return query(
            collection(firestore, "notifications"),
            where("userId", "==", authUser.uid)
        );
    }, [firestore, authUser]);

    const { data: rawNotifications, loading: notificationsLoading } = useCollection<Notification>(notificationsQuery);

    const notifications = useMemo(() => {
        if (!rawNotifications) return [];
        return [...rawNotifications].sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });
    }, [rawNotifications]);

    const unreadCount = useMemo(() => {
        return notifications?.filter(n => !n.read).length || 0;
    }, [notifications]);

    const markAsRead = async (id: string) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, "notifications", id), {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!firestore || !notifications) return;
        try {
            const unread = notifications.filter(n => !n.read);
            if (unread.length === 0) return;

            const batch = writeBatch(firestore);
            unread.forEach(n => {
                batch.update(doc(firestore, "notifications", n.id), { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        // We could implement deletion, but for now we just mark as read/hide
        // Or we can actually delete from Firestore
        // For this implementation, let's stick to mark as read
    };

    if (!authUser || loading) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 group transition-all">
                    {unreadCount > 0 ? (
                        <>
                            <BellRing className="h-5 w-5 text-primary animate-pulse group-hover:scale-110 transition-transform" />
                            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 bg-destructive text-[10px] animate-in zoom-in">
                                {unreadCount}
                            </Badge>
                        </>
                    ) : (
                        <Bell className="h-5 w-5 text-foreground/60 group-hover:text-primary transition-colors" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl z-[100]" align="end">
                <div className="flex items-center justify-between p-4 bg-primary/5">
                    <h4 className="text-sm font-bold font-headline uppercase tracking-wider">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary hover:text-primary/80 px-2" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>
                <Separator className="opacity-30" />
                <ScrollArea className="h-80">
                    {notificationsLoading ? (
                        <div className="flex items-center justify-center h-full p-8 text-muted-foreground italic text-xs">
                             Loading updates...
                        </div>
                    ) : notifications && notifications.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {notifications.map((notification) => (
                                <div 
                                    key={notification.id} 
                                    className={`p-4 transition-colors hover:bg-white/5 relative group cursor-pointer ${!notification.read ? 'bg-primary/5 ring-1 ring-inset ring-primary/10' : ''}`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!notification.read ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {notification.title.includes('Cancelled') ? <Trash2 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={`text-xs font-bold leading-none ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Clock className="h-3 w-3 text-muted-foreground/50" />
                                                <span className="text-[10px] text-muted-foreground/60">
                                                    {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />
                                        )}
                                    </div>
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!notification.read && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-2">
                            <Bell className="h-8 w-8 text-muted-foreground/20" />
                            <p className="text-xs text-muted-foreground">No notifications yet.</p>
                        </div>
                    )}
                </ScrollArea>
                <Separator className="opacity-30" />
                <div className="p-2 bg-muted/20 text-center">
                    <Button variant="ghost" size="sm" className="w-full text-[10px] text-muted-foreground hover:text-primary" asChild>
                        <a href="/profile">View All Reservations</a>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
