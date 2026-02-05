'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that provides bidirectional sync between the Payload admin panel
 * and the live preview iframe:
 *
 * 1. Click on a [data-live-field] section in the preview
 *    → scrolls the admin panel to the matching field group.
 *
 * 2. Click / focus a field group in the admin panel
 *    → scrolls the preview to the matching [data-live-field] section.
 *
 * 3. When the user is actively editing a field in the admin panel,
 *    the corresponding preview section gets a visual "editing" indicator.
 */
export function useLivePreviewSync(data: any) {
  const activeFieldRef = useRef<string | null>(null);
  const editingFieldRef = useRef<string | null>(null);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  // ── Add live-preview-mode class to body ──
  useEffect(() => {
    if (!isInIframe) return;
    document.body.classList.add('live-preview-mode');
    return () => document.body.classList.remove('live-preview-mode');
  }, [isInIframe]);

  // ── Scroll the admin panel to a field group ──
  const scrollAdminToField = useCallback((fieldName: string) => {
    try {
      if (!isInIframe) return;
      const parentDoc = window.parent.document;

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

  // ── Scroll the preview to a [data-live-field] section ──
  const scrollPreviewToField = useCallback((fieldName: string) => {
    const el = document.querySelector<HTMLElement>(`[data-live-field="${fieldName}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // ── Mark the editing state on the preview ──
  const setEditingField = useCallback((fieldName: string | null) => {
    if (editingFieldRef.current === fieldName) return;

    // Remove previous editing indicator
    if (editingFieldRef.current) {
      const prev = document.querySelector<HTMLElement>(
        `[data-live-field="${editingFieldRef.current}"]`
      );
      if (prev) prev.classList.remove('live-field--editing');
    }

    editingFieldRef.current = fieldName;

    // Add editing indicator to new field
    if (fieldName) {
      const el = document.querySelector<HTMLElement>(`[data-live-field="${fieldName}"]`);
      if (el) el.classList.add('live-field--editing');
    }
  }, []);

  // ── Resolve a field element in the admin to a top-level field name ──
  const resolveFieldName = useCallback((el: HTMLElement): string | null => {
    // Walk up the DOM from the focused element looking for a field container
    // whose id or data-path matches one of our [data-live-field] names
    const liveFields = document.querySelectorAll<HTMLElement>('[data-live-field]');
    const fieldNames = new Set<string>();
    liveFields.forEach(f => {
      const name = f.getAttribute('data-live-field');
      if (name) fieldNames.add(name);
    });

    let current: HTMLElement | null = el;
    while (current) {
      const id = current.id || '';
      const dataPath = current.getAttribute('data-path') || '';

      // Check if id is "field-<fieldName>" or starts with "field-<fieldName>__"
      for (const name of fieldNames) {
        if (
          id === `field-${name}` ||
          id.startsWith(`field-${name}__`) ||
          id.startsWith(`field-${name}-`) ||
          dataPath === name ||
          dataPath.startsWith(`${name}.`)
        ) {
          return name;
        }
      }

      // Also check class names as fallback
      const classes = current.className || '';
      for (const name of fieldNames) {
        if (classes.includes(name) && (id.includes('field') || current.classList.contains('field-type'))) {
          return name;
        }
      }

      current = current.parentElement;
    }
    return null;
  }, []);

  // ── Preview → Admin: click on preview section to focus admin field ──
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

  // ── Admin → Preview: click/focus in admin field scrolls preview + marks editing ──
  useEffect(() => {
    if (!isInIframe) return;

    let parentDoc: Document;
    try {
      parentDoc = window.parent.document;
    } catch {
      return; // Cross-origin
    }

    // On click in the admin panel, scroll preview to matching section
    const handleAdminClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const fieldName = resolveFieldName(target);
      if (fieldName && fieldName !== activeFieldRef.current) {
        activeFieldRef.current = fieldName;
        scrollPreviewToField(fieldName);
      }
    };

    // On focusin in the admin panel, mark the field as being edited
    const handleAdminFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Only react to actual input/textarea/select/contenteditable focus
      const tag = target.tagName?.toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select'
        || target.contentEditable === 'true'
        || target.getAttribute('role') === 'textbox';
      if (!isEditable) return;

      const fieldName = resolveFieldName(target);
      if (fieldName) {
        setEditingField(fieldName);
        // Also scroll preview to that field
        if (fieldName !== activeFieldRef.current) {
          activeFieldRef.current = fieldName;
          scrollPreviewToField(fieldName);
        }
      }
    };

    // On focusout, clear editing state if focus leaves the admin fields
    const handleAdminFocusOut = () => {
      // Small delay to allow focusin on the next field to fire first
      setTimeout(() => {
        const activeEl = parentDoc.activeElement as HTMLElement | null;
        if (!activeEl) {
          setEditingField(null);
          return;
        }
        const tag = activeEl.tagName?.toLowerCase();
        const isEditable = tag === 'input' || tag === 'textarea' || tag === 'select'
          || activeEl.contentEditable === 'true'
          || activeEl.getAttribute('role') === 'textbox';
        if (!isEditable) {
          setEditingField(null);
        }
      }, 100);
    };

    parentDoc.addEventListener('click', handleAdminClick, true);
    parentDoc.addEventListener('focusin', handleAdminFocusIn, true);
    parentDoc.addEventListener('focusout', handleAdminFocusOut, true);

    return () => {
      parentDoc.removeEventListener('click', handleAdminClick, true);
      parentDoc.removeEventListener('focusin', handleAdminFocusIn, true);
      parentDoc.removeEventListener('focusout', handleAdminFocusOut, true);
    };
  }, [isInIframe, resolveFieldName, scrollPreviewToField, setEditingField]);
}
