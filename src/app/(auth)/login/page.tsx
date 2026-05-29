"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Handle Lockout countdown
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const timer = setInterval(() => setLockoutTime((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const onSubmit = async (data: LoginFormValues) => {
    if (lockoutTime > 0) {
      toast.error(`Please wait ${lockoutTime} seconds before trying again.`);
      return;
    }

    setIsLoading(true);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.status === 429 || error.message.includes("Too many requests")) {
          toast.error("Too many login attempts. Please wait 60 seconds.");
          setLockoutTime(60);
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      toast.success("Login successful!");
      
      const nextUrl = searchParams.get("next") || "/dashboard";
      router.push(nextUrl);
      router.refresh();
      // Notice we purposefully do NOT set isLoading(false) here to prevent the form
      // from becoming briefly active again before the page transition completes.
    } catch (error: any) {
      toast.error("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your Mak-TIC Portal account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="m.name@mak.ac.ug" 
              autoFocus
              disabled={lockoutTime > 0}
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link 
                href="/forgot-password" 
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                disabled={lockoutTime > 0}
                {...register("password")}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                disabled={lockoutTime > 0}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading || lockoutTime > 0}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
             lockoutTime > 0 ? `Try again in ${lockoutTime}s` : "Sign in"}
          </Button>
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
