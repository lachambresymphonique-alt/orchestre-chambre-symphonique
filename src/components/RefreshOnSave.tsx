'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';

export function RefreshOnSave() {
  const serverURL = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || '');

  return (
    <RefreshRouteOnSave serverURL={serverURL} />
  );
}
