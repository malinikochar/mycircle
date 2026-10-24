import type { Metadata } from 'next';
import './globals.css';
import { loadCommunityBootstrapState } from '@/lib/data/community-loader';
import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CommunityCircle — Serenity Heights Co-op Housing Society',
  description:
    'Trusted residential community platform for directory, announcements, local shops, services, Social Service exchanges, complaints, SOS response, staff coordination, and common-area CCTV governance.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bootstrap = await loadCommunityBootstrapState();

  return (
    <html lang="en">
      <body>
        <AppShell bootstrap={bootstrap}>{children}</AppShell>
      </body>
    </html>
  );
}
