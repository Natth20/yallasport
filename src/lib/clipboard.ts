export async function copyText(value: string): Promise<boolean> {
  if (!value || typeof document === 'undefined') return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && document.hasFocus()) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // NotAllowedError when the document is not focused (devtools, iframe, automation).
    }
  }

  try {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.setAttribute('aria-hidden', 'true');
    input.style.position = 'fixed';
    input.style.top = '0';
    input.style.left = '0';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}
