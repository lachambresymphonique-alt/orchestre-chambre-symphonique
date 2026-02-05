'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';

export function RefreshOnSave() {
  return (
    <RefreshRouteOnSave
      serverURL={process.env.NEXT_PUBLIC_SITE_URL || ''}
    />
  );
}
