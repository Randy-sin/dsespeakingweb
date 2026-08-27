import { AuthForm } from "@/components/auth/auth-form";
import { sanitizeNextPath } from "@/lib/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm mode="login" nextPath={sanitizeNextPath(next)} />;
}
