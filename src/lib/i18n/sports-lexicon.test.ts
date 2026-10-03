import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localizePlainName, localizeTeamName } from './sports-lexicon';
import { atlasChapterKey, localizeCompetitionTitle, localizeCountryName, localizeLeagueName, localizeLeagueRegion, localizeRoundName, roundSortKey } from './competition-names';

test('multi-word English names become a single Arabic string', () => {
  const value = localizePlainName('ar', 'Premier League 2');
  assert.equal(typeof value, 'string');
  assert.ok(!Array.isArray(value));
  assert.equal(value.charAt(0).length, 1);
});

test('league ID 39 is English Premier League', () => {
  assert.equal(
    localizeLeagueName('ar', { externalId: '39', name: 'Premier League', country: 'England' }),
    'الدوري الإنجليزي الممتاز',
  );
});

test('Mongolia Premier League is not stamped as the English top flight', () => {
  assert.equal(
    localizeLeagueName('ar', {
      externalId: '340',
      name: 'Premier League',
      country: 'Mongolia',
    }),
    'الدوري المنغولي الممتاز',
  );
  assert.equal(
    localizeLeagueName(
      'ar',
      { externalId: '340', name: 'Premier League', country: 'Mongolia' },
      'الدوري الإنجليزي الممتاز',
    ),
    'الدوري المنغولي الممتاز',
  );
});

test('youth national teams keep an Arabic age band', () => {
  assert.equal(localizeTeamName('ar', 'Ukraine U19'), 'أوكرانيا تحت 19 عامًا');
  assert.equal(localizeTeamName('ar', 'Georgia U17'), 'جورجيا تحت 17 عامًا');
  assert.equal(localizeTeamName('ar', 'Czechia U19'), 'التشيك تحت 19 عامًا');
  assert.equal(localizeTeamName('ar', 'Republic of Ireland U17'), 'جمهورية أيرلندا تحت 17 عامًا');
});

test('country names with hyphens resolve in Arabic', () => {
  assert.equal(localizeCountryName('ar', 'Saudi-Arabia'), 'السعودية');
  assert.equal(localizeCountryName('ar', 'Czech-Republic'), 'التشيك');
  assert.equal(localizeCountryName('ar', 'World'), 'عالمي');
  assert.equal(localizeCountryName('ar', 'Luxembourg'), 'لوكسمبورغ');
});

test('round labels use Arabic ordinals and knockout names', () => {
  assert.equal(localizeRoundName('ar', 'League Stage - 2'), 'مرحلة الدوري – الجولة الثانية');
  assert.equal(localizeRoundName('ar', 'Regular Season - 6'), 'الموسم العادي – الجولة السادسة');
  assert.equal(localizeRoundName('ar', 'Group Stage'), 'دور المجموعات');
  assert.equal(localizeRoundName('ar', 'Round of 16'), 'دور الـ16');
  assert.equal(localizeRoundName('ar', 'Knockout Play-offs'), 'الملحق');
  assert.equal(localizeRoundName('ar', 'Quarter-finals'), 'ربع النهائي');
  assert.equal(localizeRoundName('ar', 'Final'), 'النهائي');
});

test('competition titles keep ID identity and youth/women labels', () => {
  assert.equal(
    localizeCompetitionTitle(
      'ar',
      { externalId: '340', name: 'Premier League', country: 'Mongolia' },
      'الدوري الإنجليزي الممتاز',
    ),
    'الدوري المنغولي الممتاز',
  );
  assert.match(localizeCompetitionTitle('ar', { name: 'Scotland U19', country: 'Scotland' }), /تحت 19/);
  assert.match(localizeCompetitionTitle('ar', { name: 'Friendlies Women', country: 'World' }), /سيدات/);
});

test('UEFA region is Europe not World, and UCL clubs keep Arabic desk names', () => {
  assert.equal(localizeLeagueRegion('ar', 'World', '2'), 'أوروبا');
  assert.equal(atlasChapterKey('World', '2'), 'Europe');
  assert.equal(atlasChapterKey('World', '15'), 'World');
  assert.equal(roundSortKey('League Stage - 2') < roundSortKey('League Stage - 4'), true);
  assert.equal(roundSortKey('Quarter-finals') < roundSortKey('Final'), true);
  assert.equal(localizeTeamName('ar', 'Como'), 'كومو');
  assert.equal(localizeTeamName('ar', 'AEK Athens FC'), 'أيك أثينا');
  assert.equal(localizeTeamName('ar', 'Club Brugge KV'), 'كلوب بروج');
  assert.equal(localizeTeamName('ar', 'Lask Linz'), 'لاسك لينتس');
  assert.equal(localizeTeamName('ar', 'Sabah FA'), 'صباح');
  assert.equal(localizeTeamName('ar', 'Slavia Praha'), 'سلافيا براغ');
  assert.equal(localizePlainName('ar', 'Talisca'), 'تاليسكا');
  assert.equal(localizePlainName('ar', 'Ferran Torres'), 'فيران توريس');
  assert.equal(localizePlainName('ar', 'M. Greenwood'), 'غرينوود');
});
