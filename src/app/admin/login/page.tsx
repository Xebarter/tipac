"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple authentication with hardcoded credentials
    if (email === "admin@tipac.com" && password === "Admin123") {
      // Set a cookie for authentication
      document.cookie = "admin_session=authenticated; path=/; max-age=3600";
      router.push("/admin");
      router.refresh();
    } else {
      setError("Invalid credentials. Email: admin@tipac.com Password: Admin123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-10 bg-card rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please sign in to access the admin panel
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-destructive/20 p-4 text-destructive">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm bg-background"
                placeholder="admin@tipac.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-input placeholder-muted-foreground text-foreground focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm bg-background"
                placeholder="Admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
            >
              Sign in
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}