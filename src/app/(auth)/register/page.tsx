'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/features/auth/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successInfo, setSuccessInfo] = React.useState<string | null>(null);
  const isConnected = isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const usernameValue = watch('username');

  const onSubmit = async (data: RegisterInput) => {
    setErrorMessage(null);
    setSuccessInfo(null);

    if (!isConnected) {
      showToast({
        type: 'info',
        title: 'Modo Demonstração Ativo',
        description: `Conta local criada para @${data.username}.`,
      });
      router.push('/');
      return;
    }

    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.displayName,
            username: data.username,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (authData.session) {
        showToast({
          type: 'success',
          title: 'Conta criada com sucesso!',
          description: 'Você já está autenticado.',
        });
        router.push('/');
      } else {
        setSuccessInfo(
          'Conta cadastrada com sucesso! Verifique seu e-mail para confirmar seu cadastro antes de fazer login.'
        );
      }
    } catch {
      setErrorMessage('Ocorreu um erro inesperado ao processar o cadastro.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-foreground">Criar sua conta</h1>
        <p className="text-xs text-slate-500 mt-1">
          Faça parte de uma rede sem vigilância em massa ou intermediários abusivos.
        </p>
      </div>

      {!isConnected && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            <strong>Aviso de Ambiente:</strong> Supabase em modo local de demonstração.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
          {errorMessage}
        </div>
      )}

      {successInfo && (
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <p>{successInfo}</p>
        </div>
      )}

      {!successInfo && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <Input
            label="Nome de Exibição"
            type="text"
            placeholder="Ex: Clara Silva"
            error={errors.displayName?.message}
            {...register('displayName')}
          />

          <div>
            <Input
              label="Nome de Usuário (@)"
              type="text"
              placeholder="ex: clara_silva"
              error={errors.username?.message}
              {...register('username')}
            />
            {usernameValue && !errors.username && (
              <p className="mt-1 text-[11px] text-slate-400">
                Seu identificador será: <strong className="text-foreground">@{usernameValue.toLowerCase()}</strong>
              </p>
            )}
          </div>

          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Senha (mínimo 8 caracteres com letras e números)"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full font-bold mt-2"
          >
            Cadastrar no VÉRSE
          </Button>
        </form>
      )}

      <div className="pt-2 text-center text-xs text-slate-500">
        Já tem uma conta?{' '}
        <Link href="/login" className="font-bold text-accent hover:underline">
          Fazer login
        </Link>
      </div>
    </div>
  );
}
