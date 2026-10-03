"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);

    setPending(false);

    if (response?.ok) {
      router.replace("/");
      return;
    }

    setError(response?.status === 429 ? "Za dużo prób, odczekaj minutę" : "Błędne hasło");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xs space-y-4">
      <div className="space-y-1">
        <h1 className="text-sm font-bold tracking-[0.14em] uppercase">Tally</h1>
        <p className="text-muted-foreground text-[10px] tracking-wide">Podaj hasło</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="sr-only">
          Hasło
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-none"
        />
      </div>

      <p aria-live="polite" className="text-destructive min-h-4 text-[11px]">
        {error}
      </p>

      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-none text-xs font-bold tracking-[0.14em] uppercase"
      >
        {pending ? "Sprawdzam" : "Wejdź"}
      </Button>
    </form>
  );
}
