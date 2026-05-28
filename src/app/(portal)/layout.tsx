export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="font-bold text-lg mr-8">Mak-TIC Portal</div>
          <nav className="flex items-center space-x-6 text-sm font-medium overflow-x-auto">
            <a href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground">Dashboard</a>
            <a href="/projects" className="transition-colors hover:text-foreground/80 text-foreground">Projects</a>
            <a href="/mentors" className="transition-colors hover:text-foreground/80 text-foreground">Mentors</a>
            <a href="/challenges" className="transition-colors hover:text-foreground/80 text-foreground">Challenges</a>
            <a href="/forum" className="transition-colors hover:text-foreground/80 text-foreground">Community</a>
            <a href="/facilities" className="transition-colors hover:text-foreground/80 text-foreground">Facilities</a>
            <a href="/courses" className="transition-colors hover:text-foreground/80 text-foreground">LMS</a>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
