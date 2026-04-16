'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { setDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  roleKey: z.string().optional(),
});

const MANAGER_KEY = "00216764";
const SUPER_ADMIN_KEY = "SUPER_ADMIN_123";

type RoleTab = "user" | "manager" | "superadmin";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RoleTab>("user");
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

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
           const keyDocSnap = await getDoc(doc(firestore, 'authKeys', keyStr)).catch(() => null);
           const isDbKey = keyDocSnap?.exists() && keyDocSnap.data()?.role === "manager";
           if (!isDbKey && keyStr !== "00216764") {
             await signOut(auth);
             form.setError('roleKey', { message: 'Incorrect manager key.' });
             setLoading(false);
             return;
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
        title: 'Signed In',
        description: 'Welcome back!',
      });

      // Redirect based on role
      if (effectiveProfile?.isSuperAdmin || effectiveProfile?.isManager) {
        router.push('/admin');
      } else {
        router.push('/builder');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign-in.');
    } finally {
      setLoading(false);
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
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="user">User</TabsTrigger>
              <TabsTrigger value="manager">Manager</TabsTrigger>
              <TabsTrigger value="superadmin">Super Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" {...field} />
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
