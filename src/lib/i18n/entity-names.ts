import { localizePlainName } from '@/lib/i18n/sports-lexicon';

export type NamedEntity = {
  name: string;
  officialName?: string | null;
};

/** Source / registry name. Never invent a second Team/Player/League row. */
export function officialEntityName(entity: NamedEntity) {
  const official = entity.officialName?.trim();
  return official || entity.name.trim();
}

/** Locale display name for the same entity id. Arabic comes from the lexicon, not a duplicate record. */
export function displayEntityName(locale: string, entity: NamedEntity) {
  const official = officialEntityName(entity);
  if (locale !== 'ar') return official;
  return localizePlainName('ar', official) || official;
}
