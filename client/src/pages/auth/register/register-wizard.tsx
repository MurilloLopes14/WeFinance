
import { setAccessToken } from '@/api/auth-storage'
import { useAuthControllerRegister } from '@/api/generated/auth/auth'
import { AUTH_SESSION_QUERY_KEY } from '@/hooks/use-auth-session'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  registerFormSchema,
  registerStepFields,
  registerSteps,
  type RegisterFormValues,
} from './register-schema'
import { PasswordStrengthProgress } from './password-strength-progress'

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    filter: 'blur(4px)',
  }),
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : ''
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { RegisterStepProgress } from '@/components/auth/register-step-progress'
import { AuthCard } from '@/components/auth/auth-card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { Calendar } from '@/components/ui/calendar'

export const RegisterWizard = () => {
const navigate = useNavigate()
const queryClient = useQueryClient()
const [step, setStep] = useState(0)
const [direction, setDirection] = useState(1)
const [calendarOpen, setCalendarOpen] = useState(false)
const [showPassword, setShowPassword] = useState(false)
const [showConfirmPassword, setShowConfirmPassword] = useState(false)

const {
  register,
  handleSubmit,
  trigger,
  setValue,
  watch,
  formState: { errors },
} = useForm<RegisterFormValues>({
  resolver: zodResolver(registerFormSchema),
  defaultValues: {
    name: '',
    email: '',
    birthDate: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  },
  mode: 'onSubmit',
})

const birthDateValue = watch('birthDate')
const passwordValue = watch('password')
const selectedBirthDate = birthDateValue ? parseISO(birthDateValue) : undefined
const currentStep = registerSteps[step]

const registerMutation = useAuthControllerRegister({
  mutation: {
    onSuccess: (data) => {
      setAccessToken(data.accessToken)
      void queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
      toast.success('Conta criada com sucesso!', {
        description: 'Bem-vindo ao WeFinance.',
      })
        navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível criar sua conta. Tente novamente.'),
      )
    },
  },
})

const goBack = () => {
  if (step === 0) return
  setDirection(-1)
  setStep((current) => current - 1)
}

const goNext = async () => {
  const fields = registerStepFields[step]
  const isValid = await trigger([...fields])

  if (!isValid) return

  if (step < registerSteps.length - 1) {
    setDirection(1)
    setStep((current) => current + 1)
  }
}

const onSubmit = (values: RegisterFormValues) => {
  registerMutation.mutate({
    data: {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      birthDate: values.birthDate,
      phoneNumber: values.phoneNumber.replace(/\D/g, ''),
    },
  })
}

const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
  if (event.key !== 'Enter') return

  event.preventDefault()

  if (step < registerSteps.length - 1) {
    void goNext()
    return
  }

  void handleSubmit(onSubmit)()
}

const fieldError = (field: keyof RegisterFormValues) => errors[field]?.message

return (
  <AuthCard>
    <RegisterStepProgress
      currentStep={step}
      totalSteps={registerSteps.length}
    />

    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown}>
      <div className="relative min-h-54 sm:min-h-58">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.28 }}
                className="font-heading text-xl font-semibold sm:text-2xl"
              >
                {currentStep.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.28 }}
                className="text-pretty text-sm leading-relaxed text-muted-foreground"
              >
                {currentStep.description}
              </motion.p>
            </div>

            {currentStep.id === 'name' && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  autoFocus
                  autoComplete="name"
                  placeholder={currentStep.placeholder}
                  aria-invalid={Boolean(errors.name)}
                  className="glass-subtle h-11 rounded-xl px-3.5 text-base focus-visible:glow-sm"
                  {...register('name')}
                />
                {fieldError('name') && (
                  <p className="text-sm text-destructive">{fieldError('name')}</p>
                )}
              </div>
            )}

            {currentStep.id === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  placeholder={currentStep.placeholder}
                  aria-invalid={Boolean(errors.email)}
                  className="glass-subtle h-11 rounded-xl px-3.5 text-base focus-visible:glow-sm"
                  {...register('email')}
                />
                {fieldError('email') && (
                  <p className="text-sm text-destructive">{fieldError('email')}</p>
                )}
              </div>
            )}

            {currentStep.id === 'birthDate' && (
              <div className="space-y-2">
                <Label>Data de nascimento</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          'glass-subtle h-11 w-full justify-between rounded-xl px-3.5 text-base font-normal focus-visible:glow-sm md:text-sm',
                          !birthDateValue && 'text-muted-foreground',
                        )}
                      />
                    }
                  >
                    <span>
                      {birthDateValue
                        ? format(parseISO(birthDateValue), "d 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                        : currentStep.placeholder}
                    </span>
                    <CalendarIcon className="size-4 shrink-0 opacity-70" />
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="glass-strong glow-border w-auto p-0"
                  >
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      captionLayout="dropdown"
                      selected={selectedBirthDate}
                      onSelect={(date) => {
                        if (!date) return
                        setValue('birthDate', format(date, 'yyyy-MM-dd'), {
                          shouldValidate: true,
                        })
                        setCalendarOpen(false)
                      }}
                      disabled={(date) => date > new Date()}
                      defaultMonth={selectedBirthDate ?? new Date(2000, 0, 1)}
                      buttonVariant="outline"
                    />
                  </PopoverContent>
                </Popover>
                <input type="hidden" {...register('birthDate')} />
                {fieldError('birthDate') && (
                  <p className="text-sm text-destructive">
                    {fieldError('birthDate')}
                  </p>
                )}
              </div>
            )}

            {currentStep.id === 'phoneNumber' && (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefone</Label>
                <Input
                  id="phoneNumber"
                  autoFocus
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={currentStep.placeholder}
                  aria-invalid={Boolean(errors.phoneNumber)}
                  className="glass-subtle h-11 rounded-xl px-3.5 text-base focus-visible:glow-sm"
                  {...register('phoneNumber', {
                    onChange: (event) => {
                      event.target.value = formatPhoneInput(event.target.value)
                    },
                  })}
                />
                {fieldError('phoneNumber') && (
                  <p className="text-sm text-destructive">
                    {fieldError('phoneNumber')}
                  </p>
                )}
              </div>
            )}

            {currentStep.id === 'password' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <InputGroup className="glass-subtle h-11 rounded-xl focus-within:glow-sm">
                    <InputGroupInput
                      id="password"
                      autoFocus
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={currentStep.placeholder}
                      aria-invalid={Boolean(errors.password)}
                      className="h-11 px-3.5 text-base"
                      {...register('password')}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <PasswordStrengthProgress password={passwordValue} />
                  {fieldError('password') && (
                    <p className="text-sm text-destructive">
                      {fieldError('password')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <InputGroup className="glass-subtle h-11 rounded-xl focus-within:glow-sm">
                    <InputGroupInput
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repita a senha"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      className="h-11 px-3.5 text-base"
                      {...register('confirmPassword')}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-sm"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        aria-label={
                          showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldError('confirmPassword') && (
                    <p className="text-sm text-destructive">
                      {fieldError('confirmPassword')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={registerMutation.isPending}
            className="h-11 rounded-xl px-4"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
        ) : (
          <div aria-hidden className="hidden sm:block sm:w-26" />
        )}

        {step < registerSteps.length - 1 ? (
          <Button
            type="button"
            onClick={() => void goNext()}
            className="glow-primary h-11 flex-1 rounded-xl sm:min-w-40 sm:flex-none"
          >
            Continuar
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="glow-primary h-11 flex-1 rounded-xl sm:min-w-40 sm:flex-none"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        )}
      </div>
    </form>

    <p className="mt-6 text-center text-sm text-muted-foreground">
      Já tem uma conta?{' '}
      <Link
        to="/login"
        className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
      >
        Entrar
      </Link>
    </p>
  </AuthCard>
)}