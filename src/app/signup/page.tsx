'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile } from '@/firebase/database';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/context/user-profile';
import React, { useEffect } from 'react';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    if (!auth || !firestore) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await createUserProfile(firestore, user.uid, {
        email: user.email!,
        isManager: false,
        isSuperAdmin: false,
      });

      toast({
        title: 'Account Created',
        description: "You've been successfully signed up!",
      });

      router.push('/builder');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "relative min-h-[calc(100vh-4rem)] flex items-center justify-center transition-colors duration-1000 overflow-hidden",
      isDark ? "text-foreground" : "text-slate-900"
    )}>
      <UnifiedBackground />

      <div className="w-full max-w-md mx-4 z-10 flex flex-col gap-3">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-all duration-300 group self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
        
        <Card className="w-full glass-panel border-primary/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
          <CardHeader>
            <CardTitle className="text-3xl font-headline font-bold uppercase tracking-tight">Create Identity</CardTitle>
            <CardDescription className="font-body text-muted-foreground/80">Register your secure architect credentials.</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Button type="submit" className="w-full font-headline font-bold uppercase tracking-[0.2em] h-12 bg-primary hover:bg-primary/90 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register Session
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/signin" className="underline hover:text-primary transition-colors">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
