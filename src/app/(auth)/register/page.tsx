import { RegisterForm } from "@/components/auth/RegisterForm"
import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-[560px] rounded-[20px] border border-[var(--border)] bg-white p-11 shadow-xl">
      <div className="space-y-6">
        <HealthFlowLogo className="text-base" />

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--navy)]">Create your account</h1>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            Choose a role and set up secure access for your HealthFlow workspace.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
