
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/context/user-profile';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function StartPage() {
    const { authUser, loading } = useUserProfile();
    const router = useRouter();

    useEffect(() => {
        if (!loading && authUser) {
            router.replace('/builder');
        }
    }, [authUser, loading, router]);

    if (loading || authUser) {
        return (
            <div className="flex items-center justify-center min-h-screen -mt-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }
    
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Welcome to Buildbot AI</CardTitle>
          <CardDescription className="pt-2">Your AI-powered PC building guide. Sign in or create an account to get started.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button asChild size="lg">
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
