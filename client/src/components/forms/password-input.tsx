import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  containerClassName?: string
}

export function PasswordInput({
  className,
  containerClassName,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <InputGroup className={cn('h-11', containerClassName)}>
      <InputGroupInput
        id={id}
        type={visible ? 'text' : 'password'}
        className={className}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
