import { LoginForm } from "@/components/auth/LoginForm"
import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-[20px] border border-[var(--border)] bg-white p-11 shadow-xl">
      <div className="space-y-6">
        <HealthFlowLogo className="text-base" />

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--navy)]">Welcome back</h1>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Sign in to manage appointments, secure messages, and clinical workflows.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
