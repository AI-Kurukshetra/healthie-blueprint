"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { loginAction } from "@/actions/auth"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
import { FormMessage } from "@/components/ui/form-message"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string>()
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleSubmit = (values: LoginInput) => {
    setFormError(undefined)

    startTransition(async () => {
      const result = await loginAction(values)

      if (!result) {
        return
      }

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.[0]) {
            return
          }

          form.setError(field as keyof LoginInput, {
            type: "server",
            message: messages[0],
          })
        })
      }

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
      }
    })
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          autoComplete="email"
          placeholder="you@healthflow.com"
          {...form.register("email")}
        />
        <FormMessage message={form.formState.errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            autoComplete="current-password"
            className="pr-12"
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            {...form.register("password")}
          />
          <Button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1.5 h-8 w-8 -translate-y-1/2 text-[var(--text-hint)] hover:text-[var(--teal)]"
            onClick={() => setShowPassword((value) => !value)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <FormMessage message={form.formState.errors.password?.message} />
      </div>

      {formError ? <div className="hf-alert-error">{formError}</div> : null}

      <LoadingButton
        className="w-full"
        isLoading={isPending}
        loadingText="Signing in..."
        type="submit"
      >
        Sign In
      </LoadingButton>

      <p className="text-center text-sm text-[var(--text-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          className="font-semibold text-[var(--teal-dark)] transition hover:text-[var(--teal)]"
          href="/register"
        >
          Register here
        </Link>
      </p>
    </form>
  )
}
