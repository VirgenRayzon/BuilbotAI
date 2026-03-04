"use client";

import { useState, useEffect } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { Order, UserProfile } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package, CheckCircle2, Clock, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
    const { authUser, profile, loading: userLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [reservations, setReservations] = useState<Order[]>([]);
    const [reservationsLoading, setReservationsLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setEmail(profile.email || "");
        }
    }, [profile]);

    useEffect(() => {
        async function fetchReservations() {
            if (!authUser || !firestore) return;
            try {
                const q = query(
                    collection(firestore, "orders"),
                    where("userId", "==", authUser.uid)
                );
                const querySnapshot = await getDocs(q);
                const fetchedOrders: Order[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
                });

                // Sort by date descending
                fetchedOrders.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || 0;
                    const dateB = b.createdAt?.toDate?.() || 0;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });

                setReservations(fetchedOrders);
            } catch (error) {
                console.error("Error fetching reservations:", error);
                toast({
                    title: "Error",
                    description: "Failed to load reserved builds.",
                    variant: "destructive"
                });
            } finally {
                setReservationsLoading(false);
            }
        }

        if (authUser) {
            fetchReservations();
        } else if (!userLoading) {
            setReservationsLoading(false);
        }
    }, [authUser, firestore, userLoading, toast]);

    const handleSaveProfile = async () => {
        if (!authUser || !firestore) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(firestore, "users", authUser.uid), {
                name,
                // Email updates usually require auth credential re-authentication in Firebase Auth, 
                // but we can update the display email in the DB for now.
                email
            });
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Update Failed",
                description: "There was an error updating your profile.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
            case 'ongoing': return <Truck className="h-4 w-4 text-blue-500" />;
            case 'finished': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            default: return <Package className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getStatusText = (status: string) => {
        if (!status) return "Pending Approval";
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending': return "outline";
            case 'ongoing': return "secondary";
            case 'finished': return "default";
            default: return "outline";
        }
    };

    if (userLoading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-2xl font-bold mb-4">You are not signed in</h1>
                <p className="text-muted-foreground mb-8">Please sign in to view your profile and reservations.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
            <h1 className="text-3xl font-headline font-bold mb-8 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Your Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Details Column */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="Your Full Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!isEditing}
                                />
                                <p className="text-[10px] text-muted-foreground p-1">Note: This only updates your contact email, not your login email.</p>
                            </div>

                            <div className="pt-4 flex gap-2">
                                {isEditing ? (
                                    <>
                                        <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                                        <Button className="w-full" onClick={handleSaveProfile} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Reservations Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-headline font-bold flex items-center gap-2">
                            <Package className="h-5 w-5" /> My Reserved Builds
                        </h2>
                        <Badge variant="secondary">{reservations.length} total</Badge>
                    </div>

                    {reservationsLoading ? (
                        <Card>
                            <CardContent className="p-12 flex justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ) : reservations.length > 0 ? (
                        <div className="space-y-4">
                            {reservations.map((reservation) => (
                                <Card key={reservation.id} className="overflow-hidden">
                                    <div className="bg-muted/30 p-4 border-b flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <p className="font-semibold">{reservation.createdAt?.toDate().toLocaleDateString()}</p>
                                            <p className="text-xs text-muted-foreground font-mono">Order #{reservation.id.substring(0, 8)}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-primary">{formatCurrency(reservation.totalPrice)}</p>
                                                <p className="text-xs text-muted-foreground">{reservation.items.length} Parts</p>
                                            </div>
                                            <Badge variant={getStatusBadgeVariant(reservation.status || 'pending')} className="flex items-center gap-1.5 py-1 px-2.5">
                                                {getStatusIcon(reservation.status || 'pending')}
                                                {getStatusText(reservation.status || 'pending')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="divide-y max-h-[250px] overflow-y-auto">
                                            {reservation.items.map((item, idx) => (
                                                <div key={`${reservation.id}-item-${idx}`} className="p-3 px-4 flex justify-between items-center text-sm md:text-base hover:bg-muted/10 transition-colors">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.category}</span>
                                                        <span className="font-medium">{item.name}</span>
                                                    </div>
                                                    <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Package className="h-12 w-12 mb-4 opacity-20" />
                                <h3 className="text-lg font-medium mb-2">No reservations yet</h3>
                                <p className="mb-6">You haven't reserved any custom builds or pre-builts yet.</p>
                                <Button asChild>
                                    <a href="/builder">Start a Build</a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
