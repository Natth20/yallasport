import 'server-only';

export interface TranslationDraft {
  locale: string;
  title: string;
  excerpt?: string | null;
  content: string;
  providerKey: string;
}

export interface TranslationProvider {
  readonly key: string;
  translate(input: {
    sourceLocale: string;
    targetLocale: string;
    title: string;
    excerpt?: string | null;
    content: string;
  }): Promise<TranslationDraft | null>;
  translateName(input: {
    sourceLocale: string;
    targetLocale: string;
    name: string;
    description?: string | null;
  }): Promise<{ name: string; description?: string | null; providerKey: string } | null>;
}

class UnconfiguredTranslationProvider implements TranslationProvider {
  readonly key = 'unconfigured';

  async translate(): Promise<null> {
    return null;
  }

  async translateName(): Promise<null> {
    return null;
  }
}

export function getTranslationProvider(): TranslationProvider {
  const key = (process.env.TRANSLATION_PROVIDER || 'unconfigured').trim().toLowerCase();
  if (!key || key === 'unconfigured') return new UnconfiguredTranslationProvider();
  return new UnconfiguredTranslationProvider();
}

export function detectSourceLocale(text: string) {
  return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
}
