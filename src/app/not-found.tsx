import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted border border-border text-slate-400 mb-4">
        <Compass className="h-8 w-8 text-accent animate-spin" style={{ animationDuration: '8s' }} />
      </div>
      <h1 className="text-3xl font-black text-foreground">404</h1>
      <h2 className="text-lg font-bold text-foreground mt-1">Página não encontrada</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        O link que você seguiu pode estar quebrado, desatualizado ou a página pode ter sido removida.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="accent" size="md" className="font-bold">
            Voltar para a Página Inicial
          </Button>
        </Link>
      </div>
    </div>
  );
}
