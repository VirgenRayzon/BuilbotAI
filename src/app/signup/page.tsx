'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile } from '@/firebase/database';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  roleKey: z.string().optional(),
});

const MANAGER_KEY = "00216764";
const SUPER_ADMIN_KEY = "SUPER_ADMIN_123";

type RoleTab = "user" | "manager" | "superadmin";

export default function SignUpPage() {
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

    if (activeTab === "manager") {
      const keyStr = values.roleKey || "none";
      const keyDocSnap = await getDoc(doc(firestore, 'authKeys', keyStr)).catch(() => null);
      const isDbKey = keyDocSnap?.exists() && keyDocSnap.data()?.role === "manager";
      if (!isDbKey && keyStr !== "00216764") {
        form.setError('roleKey', { message: 'Incorrect manager key.' });
        setLoading(false);
        return;
      }
    }

    if (activeTab === "superadmin") {
      const keyStr = values.roleKey || "none";
      const keyDocSnap = await getDoc(doc(firestore, 'authKeys', keyStr)).catch(() => null);
      const isDbKey = keyDocSnap?.exists() && keyDocSnap.data()?.role === "superadmin";
      if (!isDbKey && keyStr !== "SUPER_ADMIN_123") {
        form.setError('roleKey', { message: 'Incorrect super admin key.' });
        setLoading(false);
        return;
      }
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const isManager = activeTab === "manager" || activeTab === "superadmin";
      const isSuperAdmin = activeTab === "superadmin";

      await createUserProfile(firestore, user.uid, {
        email: user.email!,
        isManager: isManager,
        isSuperAdmin: isSuperAdmin,
      });

      toast({
        title: 'Account Created',
        description: "You've been successfully signed up!",
      });

      if (isManager || isSuperAdmin) {
        router.push('/admin');
      } else {
        router.push('/builder');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign-up.');
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
      <Card className="w-full max-w-md mx-4 glass-panel border-primary/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
        <CardHeader>
          <CardTitle className="text-3xl font-headline font-bold uppercase tracking-tight">Create Identity</CardTitle>
          <CardDescription className="font-body text-muted-foreground/80">Register your secure architect credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-border/40 p-1 rounded-xl">
              <TabsTrigger value="user" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-headline font-bold uppercase text-[10px] tracking-widest">User</TabsTrigger>
              <TabsTrigger value="manager" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-headline font-bold uppercase text-[10px] tracking-widest">Manager</TabsTrigger>
              <TabsTrigger value="superadmin" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-headline font-bold uppercase text-[10px] tracking-widest">Admin</TabsTrigger>
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
              <Button type="submit" className="w-full font-headline font-bold uppercase tracking-[0.2em] h-12 bg-primary hover:bg-primary/90 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Session
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/signin" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
