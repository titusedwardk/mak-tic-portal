export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-primary text-primary-foreground shadow-sm">
        <div className="container flex h-16 items-center">
          <div className="font-bold text-lg mr-8">Mak-TIC Admin</div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a href="/admin/pipeline" className="transition-colors hover:text-primary-foreground/80">Pipeline</a>
            <a href="/admin/scoring" className="transition-colors hover:text-primary-foreground/80 text-primary-foreground/60">Scoring</a>
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
