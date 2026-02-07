import { Input } from "@core/components/ui/input"
import { InputHTMLAttributes } from "react"

const InputText = (props: InputHTMLAttributes<HTMLInputElement>) => {
  return <Input type="text" {...props} />
}

export default InputText