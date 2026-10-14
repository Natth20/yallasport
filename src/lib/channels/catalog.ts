import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';

export type BroadcastDataStatus = 'AVAILABLE' | 'PENDING' | 'STALE' | 'UNAVAILABLE' | 'ERROR';

export type ChannelFrequency = {
  satellite: string;
  satelliteAr: string;
  frequency: string;
  polarization: 'H' | 'V';
  symbolRate: string;
  fec: string;
  encryption: string;
  encryptionAr: string;
};

export const VERIFIED_CHANNEL_FREQUENCIES: Record<string, ChannelFrequency[]> = {
  'bein-sports-1': [
    {
      satellite: 'Nilesat (7.0°W)',
      satelliteAr: 'نايل سات (7.0 غرباً)',
      frequency: '11013',
      polarization: 'H',
      symbolRate: '27500',
      fec: '2/3',
      encryption: 'beIN Smart Card',
      encryptionAr: 'مشفرة (بطاقة beIN)',
    },
    {
      satellite: 'Es\'hailSat / Badr (26.0°E)',
      satelliteAr: 'سهيل سات / بدر (26.0 شرقاً)',
      frequency: '11547',
      polarization: 'V',
      symbolRate: '27500',
      fec: '2/3',
      encryption: 'beIN Smart Card',
      encryptionAr: 'مشفرة (بطاقة beIN)',
    },
  ],
  'bein-sports-2': [
    {
      satellite: 'Nilesat (7.0°W)',
      satelliteAr: 'نايل سات (7.0 غرباً)',
      frequency: '11054',
      polarization: 'H',
      symbolRate: '27500',
      fec: '2/3',
      encryption: 'beIN Smart Card',
      encryptionAr: 'مشفرة (بطاقة beIN)',
    },
    {
      satellite: 'Es\'hailSat / Badr (26.0°E)',
      satelliteAr: 'سهيل سات / بدر (26.0 شرقاً)',
      frequency: '11585',
      polarization: 'V',
      symbolRate: '27500',
      fec: '2/3',
      encryption: 'beIN Smart Card',
      encryptionAr: 'مشفرة (بطاقة beIN)',
    },
  ],
  'ssc-sport-1': [
    {
      satellite: 'Arabsat Badr 6 (26.0°E)',
      satelliteAr: 'عرب سات بدر 6 (26.0 شرقاً)',
      frequency: '12418',
      polarization: 'H',
      symbolRate: '27500',
      fec: '3/4',
      encryption: 'Gobx / Shahid VIP',
      encryptionAr: 'مشفرة / Gobx',
    },
  ],
  'ssc-sport-2': [
    {
      satellite: 'Arabsat Badr 6 (26.0°E)',
      satelliteAr: 'عرب سات بدر 6 (26.0 شرقاً)',
      frequency: '12418',
      polarization: 'H',
      symbolRate: '27500',
      fec: '3/4',
      encryption: 'Gobx / Shahid VIP',
      encryptionAr: 'مشفرة / Gobx',
    },
  ],
  'abu-dhabi-sports': [
    {
      satellite: 'Nilesat (7.0°W)',
      satelliteAr: 'نايل سات (7.0 غرباً)',
      frequency: '11411',
      polarization: 'H',
      symbolRate: '30000',
      fec: '3/4',
      encryption: 'Free to Air',
      encryptionAr: 'مفتوحة مجانية',
    },
  ],
  'alkass-one': [
    {
      satellite: 'Nilesat (7.0°W)',
      satelliteAr: 'نايل سات (7.0 غرباً)',
      frequency: '11919',
      polarization: 'H',
      symbolRate: '27500',
      fec: '3/4',
      encryption: 'Free to Air',
      encryptionAr: 'مفتوحة مجانية',
    },
  ],
  'on-time-sports-1': [
    {
      satellite: 'Nilesat (7.0°W)',
      satelliteAr: 'نايل سات (7.0 غرباً)',
      frequency: '11861',
      polarization: 'V',
      symbolRate: '27500',
      fec: '5/6',
      encryption: 'Free to Air',
      encryptionAr: 'مفتوحة مجانية',
    },
  ],
};

export function toChannelSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\+/g, '-plus')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'channel';
}

export async function findChannelBySlugOrId(slugOrId: string) {
  const all = await prisma.channel.findMany().catch(swallow('findChannelBySlugOrId.all', []));
  const decoded = decodeURIComponent(slugOrId).toLowerCase().trim();

  // Try direct id match
  const byId = all.find((c) => c.id === slugOrId);
  if (byId) return byId;

  // Try slug match
  const bySlug = all.find((c) => toChannelSlug(c.name) === decoded);
  if (bySlug) return bySlug;

  // Try name contains match
  const byName = all.find((c) => c.name.toLowerCase().replace(/\s+/g, '-') === decoded);
  if (byName) return byName;

  return null;
}
