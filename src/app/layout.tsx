import type { Metadata } from 'next';
import './globals.css';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CommunityCircle — Genesis Editorial Design System',
  description:
    'Trusted residential community platform styled with the Genesis (chef/genesis) editorial precision design system.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bootstrap = await loadCommunityBootstrapState();

  return (
    <html lang="en">
      <head>
        {/* Genesis Design System Fonts: General Sans (Fontshare) + DM Sans & JetBrains Mono (Google Fonts) */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@600,700&display=swap"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="genesis-dot-grid">
        <AppShell bootstrap={bootstrap}>{children}</AppShell>
      </body>
    </html>
  );
}
