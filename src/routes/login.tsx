import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      if (mode === "signup") {
        const { error: signError } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim().split("@")[0] || "Member",
        });
        if (signError) throw new Error(signError.message || "Could not create the account.");
        if (college.trim()) {
          await fetch("/api/profile", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ college: college.trim() }),
          });
        }
      } else {
        const { error: signError } = await authClient.signIn.email({ email: email.trim(), password });
        if (signError) throw new Error(signError.message || "Could not log in.");
      }
      await navigate({ to: "/" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(
        /exist/i.test(message)
          ? "This email already has an account. Log in with the same password you used when you signed up."
          : /invalid/i.test(message)
            ? "No account matched that email and password. Sign up first if you are new. Passwords do not have to be unique."
            : message,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.16em] text-teal-800 uppercase">Student Explorer · Bengaluru</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Everyone starts with sign up. After that, log in with the same email and password. College is optional — this is open to anyone, not only students. Similar passwords across accounts are allowed.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-slate-100 p-1">
        <button type="button" className={`rounded-full px-3 py-2 text-sm ${mode === "signup" ? "bg-white font-semibold shadow" : ""}`} onClick={() => setMode("signup")}>
          Sign up
        </button>
        <button type="button" className={`rounded-full px-3 py-2 text-sm ${mode === "login" ? "bg-white font-semibold shadow" : ""}`} onClick={() => setMode("login")}>
          Log in
        </button>
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        {mode === "signup" && (
          <label className="block text-sm">
            Name
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="block text-sm">
          Email
          <input required type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        {mode === "signup" && (
          <label className="block text-sm">
            College or workplace <span className="text-slate-400">(optional)</span>
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="Leave blank if you prefer" />
          </label>
        )}
        <label className="block text-sm">
          Password
          <input required minLength={8} type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={pending} type="submit" className="w-full rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>
    </main>
  );
}
