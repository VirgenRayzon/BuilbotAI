import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto py-12 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Logo />
            <p className="mt-4 text-muted-foreground max-w-sm">
              The ultimate platform for PC enthusiasts. Build and optimize
              your custom rigs with the power of AI.
            </p>
          </div>
          <div>
            <h3 className="font-semibold font-headline text-foreground">Product</h3>
            <nav className="mt-4 space-y-2">
              <Link href="/builder" className="block text-muted-foreground hover:text-foreground">Builder</Link>
              <Link href="/pre-builts" className="block text-muted-foreground hover:text-foreground">Pre-builts</Link>
              <Link href="/builder" className="block text-muted-foreground hover:text-foreground">Components</Link>
              <Link href="#" className="block text-muted-foreground hover:text-foreground">Pricing</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-semibold font-headline text-foreground">Support</h3>
            <nav className="mt-4 space-y-2">
              <Link href="#" className="block text-muted-foreground hover:text-foreground">Help Center</Link>
              <Link href="#" className="block text-muted-foreground hover:text-foreground">Compatibility Guide</Link>
              <Link href="#" className="block text-muted-foreground hover:text-foreground">Contact Us</Link>
            </nav>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Buildbot AI. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
