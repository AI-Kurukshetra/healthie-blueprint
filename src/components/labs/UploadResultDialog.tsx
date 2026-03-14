"use client"

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { uploadLabResultAction } from "@/actions/labs"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormMessage } from "@/components/ui/form-message"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { labResultSchema, type LabResultInput } from "@/lib/validations/lab"

type UploadableLabOrder = {
  fileUrl: string | null
  findings: string | null
  id: string
  isAbnormal: boolean
  notes: string | null
  resultSummary: string | null
  status: string
  testName: string
}

function getDefaultValues(order: UploadableLabOrder): LabResultInput {
  const defaultStatus =
    order.status === "processing" || order.status === "completed"
      ? order.status
      : "sample_collected"

  return {
    file_url: order.fileUrl ?? "",
    findings: order.findings ?? "",
    is_abnormal: order.isAbnormal,
    notes: order.notes ?? "",
    result_summary: order.resultSummary ?? "",
    status: defaultStatus,
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Unable to read the selected file."))
    reader.readAsDataURL(file)
  })
}

type UploadResultDialogProps = {
  order: UploadableLabOrder
  triggerLabel: ReactNode
}

export function UploadResultDialog({
  order,
  triggerLabel,
}: UploadResultDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [fileError, setFileError] = useState<string>()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const form = useForm<LabResultInput>({
    defaultValues: getDefaultValues(order),
    resolver: zodResolver(labResultSchema),
  })

  const isAbnormal = form.watch("is_abnormal")
  const existingFileName = useMemo(() => {
    if (!order.fileUrl) {
      return null
    }

    return order.fileUrl.startsWith("data:")
      ? "Existing uploaded report"
      : order.fileUrl.split("/").pop() ?? "Existing report"
  }, [order.fileUrl])

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(getDefaultValues(order))
    setFormError(undefined)
    setFileError(undefined)
    setSelectedFile(null)
    setSelectedFileName(undefined)
  }, [form, open, order])

  const handleFileChange = (file?: File) => {
    if (!file) {
      setSelectedFile(null)
      setSelectedFileName(undefined)
      setFileError(undefined)
      return
    }

    const supportedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]

    if (!supportedTypes.includes(file.type)) {
      setSelectedFile(null)
      setSelectedFileName(undefined)
      setFileError("Upload a PDF, JPG, PNG, or WEBP file.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null)
      setSelectedFileName(undefined)
      setFileError("Upload a report up to 5MB.")
      return
    }

    setSelectedFile(file)
    setSelectedFileName(file.name)
    setFileError(undefined)
  }

  const onSubmit = (values: LabResultInput) => {
    setFormError(undefined)

    startTransition(async () => {
      let fileUrl = values.file_url ?? order.fileUrl ?? ""

      if (selectedFile) {
        try {
          fileUrl = await readFileAsDataUrl(selectedFile)
        } catch (error) {
          setFormError(
            error instanceof Error ? error.message : "Unable to read the selected file."
          )
          return
        }
      }

      const result = await uploadLabResultAction(order.id, {
        ...values,
        file_url: fileUrl,
      })

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof LabResultInput, {
              message: messages[0],
              type: "server",
            })
          }
        })
      }

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      toast.success("Lab result saved.")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<div>{triggerLabel}</div>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Result</DialogTitle>
          <DialogDescription>
            Record the latest status and findings for {order.testName}.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="lab-result-status">Update Status</Label>
            <Select
              onValueChange={(value) =>
                form.setValue("status", (value ?? "sample_collected") as LabResultInput["status"], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              value={form.watch("status")}
            >
              <SelectTrigger id="lab-result-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample_collected">Sample Collected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage message={form.formState.errors.status?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-result-summary">Result Summary</Label>
            <Input id="lab-result-summary" {...form.register("result_summary")} />
            <FormMessage message={form.formState.errors.result_summary?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-findings">Findings</Label>
            <Textarea id="lab-findings" rows={4} {...form.register("findings")} />
            <FormMessage message={form.formState.errors.findings?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-report-upload">Upload Report</Label>
            <Input
              accept=".pdf,image/jpeg,image/png,image/webp"
              id="lab-report-upload"
              onChange={(event) => handleFileChange(event.target.files?.[0])}
              type="file"
            />
            <p className="text-xs text-slate-500">
              PDF or image, maximum file size 5MB.
            </p>
            {selectedFileName ? (
              <p className="text-xs text-slate-500">Selected: {selectedFileName}</p>
            ) : existingFileName ? (
              <p className="text-xs text-slate-500">{existingFileName}</p>
            ) : null}
            <FormMessage message={fileError} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-3 text-sm font-medium text-slate-900">
              <input
                checked={isAbnormal}
                className="h-4 w-4 rounded border-slate-300"
                onChange={(event) =>
                  form.setValue("is_abnormal", event.target.checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                type="checkbox"
              />
              Is Abnormal?
            </Label>
            {isAbnormal ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Abnormal result. The patient will be notified.</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-provider-notes">Provider Notes</Label>
            <Textarea id="lab-provider-notes" rows={4} {...form.register("notes")} />
            <FormMessage message={form.formState.errors.notes?.message} />
          </div>

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <LoadingButton
              className="bg-sky-500 text-white hover:bg-sky-600"
              isLoading={isPending}
              loadingText="Saving..."
              type="submit"
            >
              Save Result
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
