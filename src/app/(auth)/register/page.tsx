import { AuthForm } from "@/components/auth/auth-form";
import { sanitizeNextPath } from "@/lib/navigation";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm mode="register" nextPath={sanitizeNextPath(next)} />;
}
