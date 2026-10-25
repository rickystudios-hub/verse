'use client';

import * as React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { RightAside } from '@/components/layout/right-aside';
import { Modal } from '@/components/ui/modal';
import { PostComposer } from '@/components/feed/post-composer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isComposerOpen, setIsComposerOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen justify-center bg-background">
      {/* Desktop Left Navigation */}
      <Sidebar onOpenComposer={() => setIsComposerOpen(true)} />

      {/* Center Main Content Column */}
      <div className="flex w-full min-w-0 max-w-[640px] flex-col border-x border-border pb-20 md:pb-6">
        {/* Mobile Top Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Desktop Right Context Column */}
      <RightAside />

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenComposer={() => setIsComposerOpen(true)} />

      {/* Global Quick Post Modal Dialog */}
      <Modal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        title="Nova Publicação"
      >
        <PostComposer
          onPostCreated={() => {
            setIsComposerOpen(false);
          }}
          compact
        />
      </Modal>
    </div>
  );
}
