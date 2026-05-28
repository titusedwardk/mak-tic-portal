import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Mak-TIC Portal</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 flex items-center" href="/login">
            Sign In
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Makerere University Technology & Innovation Center
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Submit your breakthrough ideas, access funding, connect with mentors, and turn your research into commercial reality.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 text-base">
                    Submit a Project
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    Innovator Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto max-w-6xl">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col space-y-3 items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="text-xl font-bold">Access Funding</h3>
                <p className="text-sm text-muted-foreground">Apply for grants, seed capital, and external innovation challenges.</p>
              </div>
              <div className="flex flex-col space-y-3 items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="text-xl font-bold">Expert Mentorship</h3>
                <p className="text-sm text-muted-foreground">Connect with industry experts, alumni, and faculty to refine your business model.</p>
              </div>
              <div className="flex flex-col space-y-3 items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                </div>
                <h3 className="text-xl font-bold">AI Evaluation</h3>
                <p className="text-sm text-muted-foreground">Get instant feedback, automated market viability scores, and SDG tracking.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2026 Makerere University Technology & Innovation Center (Mak-TIC). All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
