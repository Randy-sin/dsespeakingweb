import { AuthForm } from "@/components/auth/auth-form";
import { sanitizeNextPath } from "@/lib/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      nextPath={sanitizeNextPath(next)}
      initialError={error === "auth_failed" ? "auth_failed" : undefined}
    />
  );
}
