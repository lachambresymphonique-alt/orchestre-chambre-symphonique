'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that provides bidirectional sync between the Payload admin panel
 * and the live preview iframe:
 *
 * 1. Admin → Preview: When the user edits a field group, the preview
 *    auto-scrolls to the corresponding [data-live-field] section.
 *
 * 2. Preview → Admin: When the user clicks a [data-live-field] section
 *    in the preview, the admin panel scrolls to the matching field group.
 */
export function useLivePreviewSync(data: any) {
  const prevDataRef = useRef<string | null>(null);
  const activeFieldRef = useRef<string | null>(null);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // ── Add live-preview-mode class to body ──
  useEffect(() => {
    if (!isInIframe) return;
    document.body.classList.add('live-preview-mode');
    return () => document.body.classList.remove('live-preview-mode');
  }, [isInIframe]);

  // ── Admin → Preview: auto-scroll to changed field group ──
  useEffect(() => {
    if (!isInIframe) return;

    const currentJson = JSON.stringify(data);
    if (!prevDataRef.current) {
      prevDataRef.current = currentJson;
      return;
    }

    if (currentJson === prevDataRef.current) return;

    // Find which top-level field group changed
    const fields = document.querySelectorAll<HTMLElement>('[data-live-field]');
    for (const el of fields) {
      const fieldName = el.getAttribute('data-live-field');
      if (!fieldName || !(fieldName in data)) continue;

      const prev = JSON.parse(prevDataRef.current);
      if (JSON.stringify(data[fieldName]) !== JSON.stringify(prev[fieldName])) {
        // Only scroll if it's a different section than the currently active one
        if (fieldName !== activeFieldRef.current) {
          activeFieldRef.current = fieldName;
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Briefly highlight the section
          el.classList.add('live-field--active');
          setTimeout(() => el.classList.remove('live-field--active'), 1500);
        }
        break;
      }
    }

    prevDataRef.current = currentJson;
  }, [data, isInIframe]);

  // ── Preview → Admin: click on preview section to focus admin field ──
  const scrollAdminToField = useCallback((fieldName: string) => {
    try {
      if (!isInIframe) return;
      const parentDoc = window.parent.document;

      // Payload 3.x renders field groups with id="field-<name>"
      // and nested fields with id="field-<group>__<field>"
      const selectors = [
        `#field-${fieldName}`,
        `[id^="field-${fieldName}"]`,
        `[data-path="${fieldName}"]`,
      ];

      for (const selector of selectors) {
        const el = parentDoc.querySelector<HTMLElement>(selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.3s ease';
          el.style.boxShadow = '0 0 0 3px rgba(201, 168, 76, 0.6)';
          setTimeout(() => { el.style.boxShadow = ''; }, 2000);
          return;
        }
      }

      // Fallback: search by group field label class patterns
      const allFields = parentDoc.querySelectorAll<HTMLElement>(
        '.field-type, [class*="group-field"], [class*="GroupField"]'
      );
      for (const el of allFields) {
        const id = el.id || '';
        const classes = el.className || '';
        if (id.includes(fieldName) || classes.includes(fieldName)) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.3s ease';
          el.style.boxShadow = '0 0 0 3px rgba(201, 168, 76, 0.6)';
          setTimeout(() => { el.style.boxShadow = ''; }, 2000);
          return;
        }
      }
    } catch {
      // Cross-origin or security error — ignore
    }
  }, [isInIframe]);

  useEffect(() => {
    if (!isInIframe) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-live-field]');
      if (!target) return;

      const fieldName = target.getAttribute('data-live-field');
      if (!fieldName) return;

      // Highlight the clicked section in the preview
      document.querySelectorAll<HTMLElement>('[data-live-field]').forEach((el) => {
        el.classList.remove('live-field--selected');
      });
      target.classList.add('live-field--selected');
      activeFieldRef.current = fieldName;

      // Scroll the admin panel to the corresponding field
      scrollAdminToField(fieldName);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isInIframe, scrollAdminToField]);
}
