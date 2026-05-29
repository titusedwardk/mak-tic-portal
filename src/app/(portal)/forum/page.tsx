import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { CreatePostForm } from "./CreatePostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  MessageCircle, 
  Pin, 
  Search, 
  ArrowRight,
  TrendingUp,
  FileText,
  User,
  Clock,
  ChevronRight
} from "lucide-react";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ForumPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const selectedSlug = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "";

  const supabase = await createClient();

  // 1. Fetch categories and include post titles to calculate counts safely
  const { data: rawCategories, error: catError } = await supabase
    .from("forum_categories")
    .select(`
      id, name, description, slug, sort_order,
      forum_posts ( id )
    `)
    .order("sort_order", { ascending: true });

  const categories = rawCategories?.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    slug: c.slug,
    sort_order: c.sort_order,
    postCount: c.forum_posts?.length || 0,
  })) || [];

  // Find active category ID if slug is selected
  const activeCategory = categories.find(c => c.slug === selectedSlug);

  // 2. Fetch posts (with profiles and categories)
  let postsQuery = supabase
    .from("forum_posts")
    .select(`
      id,
      title,
      body,
      is_pinned,
      reply_count,
      created_at,
      profiles ( full_name, role ),
      forum_categories ( name, slug )
    `);

  if (activeCategory) {
    postsQuery = postsQuery.eq("category_id", activeCategory.id);
  }

  if (q) {
    postsQuery = postsQuery.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  // Order by pinned status first, then by date created
  const { data: posts, error: postsError } = await postsQuery
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  // 3. Check auth session
  const { data: { user } } = await supabase.auth.getUser();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Extract clean text from HTML body for description snippet
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header and Callouts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/40 p-6 rounded-2xl border">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">Community Forum</h1>
          <p className="text-muted-foreground mt-1.5 text-sm font-medium">
            Connect, discuss proposals, share hackathon tips, and collaborate with developers, mentors, and partners.
          </p>
        </div>
        {user ? (
          <CreatePostForm categories={categories} />
        ) : (
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "sm" }), "font-semibold shadow-sm shrink-0")}
          >
            Sign in to Post
          </Link>
        )}
      </div>

      {/* Main Grid: Left is list, Right is sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Search + Posts List */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search bar */}
          <form method="GET" action="/forum" className="flex gap-2">
            {selectedSlug && (
              <input type="hidden" name="category" value={selectedSlug} />
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search forum topics, discussions..."
                className="pl-9 bg-background h-10 border-slate-200 focus-visible:ring-primary/20"
              />
            </div>
            <Button type="submit" variant="secondary" className="font-semibold h-10 px-4">
              Search
            </Button>
          </form>

          {/* Active Filters */}
          {(q || selectedSlug) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Active filters:</span>
              {selectedSlug && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {activeCategory?.name}
                  <Link href={`/forum${q ? `?q=${q}` : ""}`} className="text-[10px] ml-1 font-bold text-muted-foreground hover:text-foreground">×</Link>
                </Badge>
              )}
              {q && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Query: "{q}"
                  <Link href={`/forum${selectedSlug ? `?category=${selectedSlug}` : ""}`} className="text-[10px] ml-1 font-bold text-muted-foreground hover:text-foreground">×</Link>
                </Badge>
              )}
              <Link href="/forum" className="text-primary hover:underline font-semibold ml-2">Clear all</Link>
            </div>
          )}

          {/* Posts List */}
          {postsError && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center font-semibold">
              Error fetching forum threads. Please refresh and try again.
            </div>
          )}

          {!postsError && (!posts || posts.length === 0) ? (
            <div className="text-center py-16 border rounded-2xl bg-muted/10 border-dashed space-y-3">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <h3 className="text-lg font-bold">No discussions found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                No threads match your search criteria. Be the first to start a new discussion!
              </p>
            </div>
          ) : (
            <div className="divide-y border rounded-xl overflow-hidden bg-background">
              {posts?.map((post) => {
                const textSnippet = stripHtml(post.body || "");
                const category = Array.isArray(post.forum_categories)
                  ? post.forum_categories[0]
                  : post.forum_categories;
                const profile = Array.isArray(post.profiles)
                  ? post.profiles[0]
                  : post.profiles;

                return (
                  <div key={post.id} className="p-5 hover:bg-muted/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.is_pinned && (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15 gap-1 py-0.5 px-2 text-[10px] font-bold">
                            <Pin className="h-3 w-3 fill-amber-500 text-amber-500" /> Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] scale-95 border-indigo-500/20 text-indigo-650 bg-indigo-500/5">
                          {category?.name}
                        </Badge>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 hover:text-primary transition-colors truncate">
                        <Link href={`/forum/${post.id}`} className="block">
                          {post.title}
                        </Link>
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-2xl leading-relaxed">
                        {textSnippet}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-350">
                          <User className="h-3 w-3" /> {profile?.full_name || "Unknown Author"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Stats & Link */}
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <MessageCircle className="h-4.5 w-4.5" />
                        <span className="font-bold">{post.reply_count || 0}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">replies</span>
                      </div>
                      <Link
                        href={`/forum/${post.id}`}
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "h-8 group/btn px-3 font-semibold")}
                      >
                        View Thread 
                        <ChevronRight className="h-4 w-4 ml-0.5 text-muted-foreground group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Categories & Guideline Card */}
        <div className="space-y-6">
          
          {/* Categories Sidebar */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Forum Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <nav className="flex flex-col">
                <Link
                  href="/forum"
                  className={`flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted/30 ${
                    !selectedSlug 
                      ? "text-primary bg-primary/5 border-l-4 border-primary" 
                      : "text-muted-foreground border-l-4 border-transparent hover:text-foreground"
                  }`}
                >
                  <span>All Discussions</span>
                  <Badge variant="secondary" className="scale-85">
                    {categories.reduce((acc, cat) => acc + cat.postCount, 0)}
                  </Badge>
                </Link>
                
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/forum?category=${cat.slug}${q ? `&q=${q}` : ""}`}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted/30 ${
                      selectedSlug === cat.slug
                        ? "text-primary bg-primary/5 border-l-4 border-primary"
                        : "text-muted-foreground border-l-4 border-transparent hover:text-foreground"
                    }`}
                  >
                    <span className="truncate max-w-[150px]">{cat.name}</span>
                    <Badge variant="secondary" className="scale-85">
                      {cat.postCount}
                    </Badge>
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Guideline Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-indigo-50/10 dark:bg-indigo-950/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" /> Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>1. Be respectful and constructive.</p>
              <p>2. Ask queries clear and descriptive.</p>
              <p>3. Do not post code snippets containing plain secrets, API keys, or private database credentials.</p>
              <p>4. Tag category AgriTech or Hardware appropriately so mentors can answer.</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

