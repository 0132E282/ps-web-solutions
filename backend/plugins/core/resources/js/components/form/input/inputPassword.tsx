import { Input } from "@core/components/ui/input"
import { Eye, EyeOff } from "lucide-react"
import { forwardRef, InputHTMLAttributes, useState } from "react"

interface InputPasswordProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showToggle?: boolean
}

const InputPassword = forwardRef<HTMLInputElement, InputPasswordProps>(
  ({ showToggle = true, className, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => setIsVisible((prev) => !prev)

    if (!showToggle) {
      return <Input type="password" ref={ref} className={className} {...props} />
    }

    return (
      <div className="relative">
        <Input
          type={isVisible ? "text" : "password"}
          ref={ref}
          className={className}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={isVisible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    )
  }
)

InputPassword.displayName = "InputPassword"

export default InputPassword
