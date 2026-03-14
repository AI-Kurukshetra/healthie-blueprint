import { notFound } from "next/navigation"

import { LabResultDetail } from "@/components/labs/LabResultDetail"
import { UploadResultDialog } from "@/components/labs/UploadResultDialog"
import { Button } from "@/components/ui/button"
import { getProviderLabOrderDetail } from "@/lib/data/labs"

export default async function LabOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getProviderLabOrderDetail(id)

  if (!order) {
    notFound()
  }

  const canUploadResult =
    order.status !== "cancelled" && order.status !== "completed"

  return (
    <LabResultDetail
      actions={
        canUploadResult ? (
          <UploadResultDialog
            order={order}
            triggerLabel={
              <Button className="bg-sky-500 text-white hover:bg-sky-600">
                Upload Result
              </Button>
            }
          />
        ) : null
      }
      order={order}
    />
  )
}
