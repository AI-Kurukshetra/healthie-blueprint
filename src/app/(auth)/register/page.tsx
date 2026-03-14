import { RegisterForm } from "@/components/auth/RegisterForm"
import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"

export default function RegisterPage() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
      <div className="space-y-6">
        <HealthFlowLogo className="text-base" />

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Create your HealthFlow account
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Choose your role and set up secure access for your care workflow.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}
