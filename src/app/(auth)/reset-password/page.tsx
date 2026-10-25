'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '@/features/auth/schemas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSent, setIsSent] = React.useState(false);
  const isConnected = isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setErrorMessage(null);

    if (!isConnected) {
      setIsSent(true);
      showToast({
        type: 'info',
        title: 'Demonstração Local',
        description: 'Em produção, um link seguro com token de expiração curta é enviado ao e-mail.',
      });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setIsSent(true);
      showToast({
        type: 'success',
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada.',
      });
    } catch {
      setErrorMessage('Ocorreu um erro ao solicitar a recuperação de senha.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-foreground font-semibold mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
        <h1 className="text-xl font-black text-foreground">Recuperar senha</h1>
        <p className="text-xs text-slate-500 mt-1">
          Informe seu e-mail cadastrado para receber instruções seguras de recuperação.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/20">
          {errorMessage}
        </div>
      )}

      {isSent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 p-4 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-bold text-sm">Instruções enviadas!</p>
              <p className="mt-1">
                Se o e-mail informado estiver registrado em nossa plataforma, você receberá um link de redefinição válido por tempo limitado.
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Retornar à tela de login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="E-mail Cadastrado"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full font-bold"
          >
            Enviar Link de Recuperação
          </Button>
        </form>
      )}
    </div>
  );
}
