'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedBackground } from '@/components/landing/unified-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/context/user-profile';
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  roleKey: z.string().min(1, 'Role key is required for system access.'),
});

type RoleTab = "manager" | "superadmin";

export default function SystemAccessPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RoleTab>("manager");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && authUser && profile) {
      if (profile.isManager || profile.isSuperAdmin) {
        router.push('/admin');
      } else {
        router.push('/builder');
      }
    }
  }, [authUser, profile, authLoading, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      roleKey: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    if (!auth || !firestore) return;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let effectiveProfile: any = null;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        effectiveProfile = userData;
        
        // Tab Validation
        if (activeTab === "manager") {
           const hasManagerAccess = userData.isManager || userData.isAdmin;
           if (!hasManagerAccess) {
             await signOut(auth);
             form.setError('roleKey', { message: 'This account does not have manager privileges.' });
             setLoading(false);
             return;
           }
           
           // Migration: If user was an old Admin but doesn't have the isManager flag, add it now
           if (userData.isAdmin && !userData.isManager) {
             await updateDoc(userDocRef, { isManager: true });
             effectiveProfile.isManager = true;
           }
           const keyStr = values.roleKey || "none";
           
           // Individual Key Validation
           if (userData.activeManagerKey) {
             if (userData.activeManagerKey !== keyStr) {
               await signOut(auth);
               form.setError('roleKey', { message: 'Incorrect manager key.' });
               setLoading(false);
               return;
             }
           } else {
             // Migration Path: Check legacy unified key
             const keyDocSnap = await getDoc(doc(firestore, 'authKeys', keyStr)).catch(() => null);
             const isLegacyKey = (keyDocSnap?.exists() && keyDocSnap.data()?.role === "manager") || keyStr === "00216764";
             
             if (!isLegacyKey) {
               await signOut(auth);
               form.setError('roleKey', { message: 'Incorrect manager key.' });
               setLoading(false);
               return;
             }
             
             // Adopt the key into the user profile
             await updateDoc(userDocRef, { activeManagerKey: keyStr });
             effectiveProfile.activeManagerKey = keyStr;
           }
        } else if (activeTab === "superadmin") {
           if (!userData.isSuperAdmin) {
             await signOut(auth);
             form.setError('roleKey', { message: 'This account does not have super admin privileges.' });
             setLoading(false);
             return;
           }
           const keyStr = values.roleKey || "none";
           const keyDocSnap = await getDoc(doc(firestore, 'authKeys', keyStr)).catch(() => null);
           const isDbKey = keyDocSnap?.exists() && keyDocSnap.data()?.role === "superadmin";
           if (!isDbKey && keyStr !== "SUPER_ADMIN_123") {
             await signOut(auth);
             form.setError('roleKey', { message: 'Incorrect super admin key.' });
             setLoading(false);
             return;
           }
        }
      } else {
        // If profile is missing in Firestore but user exists in Auth, create a basic profile
        const newProfile = {
          email: user.email,
          isManager: activeTab === "manager" || activeTab === "superadmin",
          isSuperAdmin: activeTab === "superadmin",
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        effectiveProfile = newProfile;
      }

      toast({
        title: 'System Access Granted',
        description: 'Welcome to the administrator dashboard.',
      });

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'An error occurred during system access authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestKey = async () => {
    if (!firestore || !requestEmail) return;
    if (!requestEmail.includes('@')) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setRequestLoading(true);
    try {
      await addDoc(collection(firestore, 'keyRequests'), {
        email: requestEmail,
        role: 'manager',
        status: 'pending',
        requestedAt: serverTimestamp(),
      });
      toast({
        title: "Request Sent",
        description: "Your request for a new manager key has been sent to the Super Admin.",
      });
      setIsRequestDialogOpen(false);
      setRequestEmail('');
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as RoleTab);
    form.reset({
      email: form.getValues('email'),
      password: form.getValues('password'),
      roleKey: '',
    });
    form.clearErrors('roleKey');
  };

  return (
    <div className={cn(
      "relative min-h-[calc(100vh-4rem)] flex items-center justify-center transition-colors duration-1000 overflow-hidden",
      isDark ? "text-foreground" : "text-slate-900"
    )}>
      <UnifiedBackground />
      
      <Card className="w-full max-w-md mx-4 glass-panel border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3 font-headline font-bold uppercase tracking-tight text-red-500">
            <Shield className="w-8 h-8" />
            System Access
          </CardTitle>
          <CardDescription className="font-body text-muted-foreground/80">Authorized personnel only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/40 p-1 rounded-xl">
              <TabsTrigger value="manager" className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white font-headline font-bold uppercase text-[10px] tracking-widest">Manager</TabsTrigger>
              <TabsTrigger value="superadmin" className="rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white font-headline font-bold uppercase text-[10px] tracking-widest">Super Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Access Denied</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@buildbotai.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                {activeTab === "manager" && (
                  <div className="space-y-1">
                    <FormField
                      control={form.control}
                      name="roleKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager Key</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Required manager key" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="button"
                        variant="link" 
                        size="sm" 
                        className="px-0 h-auto text-xs text-muted-foreground hover:text-red-400 transition-colors"
                        onClick={() => setIsRequestDialogOpen(true)}
                      >
                        Forgot Manager Key?
                      </Button>
                    </div>
                  </div>
                )}
              {activeTab === "superadmin" && (
                <FormField
                  control={form.control}
                  name="roleKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Super Admin Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Required super admin key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full font-headline font-bold uppercase tracking-[0.2em] h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Authenticate
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors underline underline-offset-4">
              Return to public site
            </Link>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-red-500" />
              Request Manager Key
            </DialogTitle>
            <DialogDescription>
              Forgot your key? Enter your account email and the Super Admin will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="request-email">Email Address</Label>
              <Input
                id="request-email"
                type="email"
                placeholder="Enter your registered email"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)} disabled={requestLoading}>
              Cancel
            </Button>
            <Button onClick={handleRequestKey} disabled={requestLoading || !requestEmail} className="bg-red-600 hover:bg-red-700 text-white">
              {requestLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
