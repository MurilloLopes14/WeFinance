import { setAccessToken } from '@/api/auth-storage'
import { useAuthControllerLogin } from '@/api/generated/auth/auth'
import { AUTH_SESSION_QUERY_KEY } from '@/hooks/use-auth-session'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { loginFormSchema, type LoginFormValues } from './login-schema'

export function LoginForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const loginMutation = useAuthControllerLogin({
    mutation: {
      onSuccess: (data) => {
        setAccessToken(data.accessToken)
        void queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
        toast.success('Login realizado!', {
          description: 'Bem-vindo de volta ao WeFinance.',
        })
        navigate('/dashboard')
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(error, 'E-mail ou senha inválidos. Tente novamente.'),
        )
      },
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      data: {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      },
    })
  }

  return (
    <AuthCard
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="inline-flex">
        <Button
          type="button"
          variant="ghost"
          className="mb-4 h-9 rounded-xl px-3 text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
      </Link>

      <div className="space-y-1.5">
        <h1 className="font-heading text-xl font-semibold sm:text-2xl">Entrar</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Acesse sua conta para continuar gerenciando suas finanças.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-4 sm:mt-8"
      >
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            placeholder="voce@email.com"
            aria-invalid={Boolean(errors.email)}
            className="glass-subtle h-11 rounded-xl px-3.5 text-base focus-visible:glow-sm"
            {...register('email')}
          />
          {errors.email?.message && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary underline-offset-4 transition-colors hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <InputGroup className="glass-subtle h-11 rounded-xl focus-within:glow-sm">
            <InputGroupInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
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
          {errors.password?.message && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="glow-primary h-11 w-full rounded-xl"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthCard>
  )
}
