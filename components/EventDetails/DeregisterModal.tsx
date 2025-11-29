import React from "react"

export type DeregisterReasonFormResult = {
  type: string
  details?: string | null
}

export const DeregisterModal: React.FC<{ onSubmit?: (r: DeregisterReasonFormResult) => void }> = () => null

export default DeregisterModal
