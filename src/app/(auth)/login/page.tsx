import { LoginForm } from "@/components/auth/LoginForm"
import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"

export default function LoginPage() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
      <div className="space-y-6">
        <HealthFlowLogo className="text-base" />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Sign in to your account to manage appointments, messages, and care
            coordination.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
