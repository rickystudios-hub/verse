'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/features/auth/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const isConnected = isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (isConnected) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.replace('/');
        }
      });
    }
  }, [isConnected, router]);

  const onSubmit = async (data: LoginInput) => {
    setErrorMessage(null);

    if (!isConnected) {
      // Modo Demonstração Local
      showToast({
        type: 'info',
        title: 'Modo Demonstração Ativo',
        description: 'Autenticado localmente como @richard (Supabase não conectado no .env.local).',
      });
      router.push('/');
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setErrorMessage(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        return;
      }

      showToast({
        type: 'success',
        title: 'Bem-vindo de volta!',
        description: 'Sessão iniciada com sucesso.',
      });
      router.push('/');
      router.refresh();
    } catch {
      setErrorMessage('Ocorreu um erro inesperado ao conectar ao serviço de autenticação.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-foreground">Entrar na sua conta</h1>
        <p className="text-xs text-slate-500 mt-1">
          Acesse seu feed descentralizado e seguro no VÉRSE.
        </p>
      </div>

      {!isConnected && (
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            <strong>Aviso de Ambiente:</strong> As credenciais do Supabase ainda não foram adicionadas ao <code className="font-mono text-[11px]">.env.local</code>. O login funcionará em <strong>Modo Demonstração</strong> direto no navegador.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1">
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end pt-1">
            <Link
              href="/reset-password"
              className="text-xs text-accent hover:underline font-medium"
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full font-bold"
        >
          Entrar
        </Button>
      </form>

      {/* Contas de Acesso Rápido para Testes */}
      <div className="rounded-xl border border-border bg-surface-muted/50 p-3 text-xs space-y-2">
        <p className="font-semibold text-slate-500">Acesso Rápido com Contas Oficiais:</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setValue('email', 'richard@verse.app');
              setValue('password', 'Password@Verse2026!');
            }}
            className="rounded-lg bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-accent border border-border hover:border-accent transition-colors"
          >
            @richard (Admin)
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'oficial@verse.app');
              setValue('password', 'Password@Verse2026!');
            }}
            className="rounded-lg bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-border hover:border-accent transition-colors"
          >
            @verse (Oficial)
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'clara@verse.app');
              setValue('password', 'Password@Verse2026!');
            }}
            className="rounded-lg bg-surface px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-border hover:border-accent transition-colors"
          >
            @clara (Comunidade)
          </button>
        </div>
      </div>

      <div className="pt-2 text-center text-xs text-slate-500">
        Não possui uma conta?{' '}
        <Link href="/register" className="font-bold text-accent hover:underline">
          Criar conta gratuita
        </Link>
      </div>
    </div>
  );
}
