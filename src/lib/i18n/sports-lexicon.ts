/** Names as Arabic sports desks say them — not letter-by-letter English. */

function key(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/\b(fc|cf|sc|ac|afc|cfc|sfc|ssc)\b/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
}

/** Competitions, clubs, countries, well-known players — FilGoal / beIN / Yallakora style. */
const EN_AR: Record<string, string> = {
  epl: 'الدوري الإنجليزي الممتاز',
  laliga: 'الليغا',
  laligaea: 'الليغا',
  laligasantander: 'الليغا',
  seriea: 'الدوري الإيطالي',
  bundesliga: 'البوندسليغا',
  ligue1: 'الدوري الفرنسي',
  uefachampionsleague: 'دوري أبطال أوروبا',
  championsleague: 'دوري أبطال أوروبا',
  ucl: 'دوري أبطال أوروبا',
  uefaeuropaleague: 'الدوري الأوروبي',
  europaleague: 'الدوري الأوروبي',
  uefaeuropaconferenceleague: 'دوري المؤتمر الأوروبي',
  conferenceleague: 'دوري المؤتمر الأوروبي',
  fifaworldcup: 'كأس العالم',
  clubworldcup: 'كأس العالم للأندية',
  fifaclubworldcup: 'كأس العالم للأندية',
  copadelrey: 'كأس الملك',
  facup: 'كأس الاتحاد الإنجليزي',
  eflcup: 'كأس الرابطة الإنجليزية',
  carabaocup: 'كأس الرابطة الإنجليزية',
  copaitalia: 'كأس إيطاليا',
  dfbpokal: 'كأس ألمانيا',
  coupefrance: 'كأس فرنسا',
  egyptianpremierleague: 'الدوري المصري الممتاز',
  nileleague: 'دوري نايل',
  saudiprofessionallieague: 'دوري روشن',
  saudiproleague: 'دوري روشن',
  roshnsaudi: 'دوري روشن',
  uaeproleague: 'دوري أدنوك',
  qatarstarsleague: 'دوري نجوم قطر',
  cafchampionsleague: 'دوري أبطال أفريقيا',
  afcchampionsleague: 'دوري أبطال آسيا',
  afcchampionelitel: 'دوري أبطال آسيا',
  uefaeuro: 'يورو',
  euro: 'يورو',
  africacupofnations: 'كأس أمم أفريقيا',
  afcon: 'كأس أمم أفريقيا',
  africannationscup: 'كأس أمم أفريقيا',
  copaamerica: 'كوبا أمريكا',
  nationsleague: 'دوري الأمم',
  uefanationsleague: 'دوري الأمم الأوروبية',
  mls: 'MLS',
  majorleaguesoccer: 'MLS',
  eredivisie: 'الدوري الهولندي',
  ligaportugal: 'الدوري البرتغالي',
  primeiraliga: 'الدوري البرتغالي',
  superlig: 'الدوري التركي',
  scottishpremiership: 'الدوري الإسكتلندي',
  championship: 'التشامبيونشيب',
  eflchampionship: 'التشامبيونشيب',
  brasileirao: 'الدوري البرازيلي',
  ligaprofesional: 'الدوري الأرجنتيني',
  superligargentina: 'الدوري الأرجنتيني',
  copalibertadores: 'كوبا ليبرتادوريس',
  copasudamericana: 'كوبا سودأمريكانا',
  manchesterunited: 'مانشستر يونايتد',
  manutd: 'مانشستر يونايتد',
  manunited: 'مانشستر يونايتد',
  manchestercity: 'مانشستر سيتي',
  mancity: 'مانشستر سيتي',
  liverpool: 'ليفربول',
  chelsea: 'تشيلسي',
  arsenal: 'أرسنال',
  tottenhamhotspur: 'توتنهام',
  tottenham: 'توتنهام',
  spurs: 'توتنهام',
  newcastleunited: 'نيوكاسل',
  newcastle: 'نيوكاسل',
  astonvilla: 'أستون فيلا',
  westhamunited: 'وست هام',
  westham: 'وست هام',
  brightonandhovealbion: 'برايتون',
  brighton: 'برايتون',
  everton: 'إيفرتون',
  crystalpalace: 'كريستال بالاس',
  fulham: 'فولهام',
  wolverhamptonwanderers: 'وولفرهامبتون',
  wolves: 'وولفرهامبتون',
  nottinghamforest: 'نوتنغهام فورست',
  bournemouth: 'بورنموث',
  brentford: 'برينتفورد',
  leicestercity: 'ليستر سيتي',
  leedsunited: 'ليدز يونايتد',
  leeds: 'ليدز',
  alahlijeddah: 'الأهلي',
  vfbstuttgart: 'شتوتغارت',
  ipswichtown: 'إيبسويتش',
  southampton: 'ساوثهامبتون',
  realmadrid: 'ريال مدريد',
  barcelona: 'برشلونة',
  fcbarcelona: 'برشلونة',
  barca: 'برشلونة',
  atleticomadrid: 'أتلتيكو مدريد',
  atletico: 'أتلتيكو مدريد',
  sevilla: 'إشبيلية',
  valencia: 'فالنسيا',
  villarreal: 'فياريال',
  realsociedad: 'ريال سوسيداد',
  athleticclub: 'أتلتيك بلباو',
  athleticbilbao: 'أتلتيك بلباو',
  girona: 'جيرونا',
  osasuna: 'أوساسونا',
  realbetis: 'ريال بيتيس',
  betis: 'ريال بيتيس',
  alaves: 'ألافيس',
  deportivoalaves: 'ألافيس',
  deportivolacoruna: 'ديبورتيفو لاكورونيا',
  espanyol: 'إسبانيول',
  rcespanyol: 'إسبانيول',
  neom: 'نيوم',
  neomsc: 'نيوم',
  alkholood: 'الخلود',
  aldiriyah: 'الدرعية',
  alqadisiyah: 'القادسية',
  alhilalsaudi: 'الهلال',
  kyrgyzstan: 'قيرغيزستان',
  maldives: 'المالديف',
  azadeganleague: 'دوري آزادغان',
  premierleaguecup: 'كأس الدوري للشباب',
  friendlies: 'مباريات ودية',
  internationalfriendly: 'مباريات دولية ودية',
  friendlyinternational: 'مباريات دولية ودية',
  clubfriendlies: 'مباريات ودية للأندية',
  friendliesclubs: 'مباريات ودية للأندية',
  clubfriendly: 'مباريات ودية للأندية',
  presidentscup: 'كأس الرئيس',
  saipa: 'سايبا',
  niroyezamini: 'نيروي زميني',
  messoongoun: 'مس سونغون',
  meskerman: 'مس كرمان',
  arioeslamshahr: 'آريو إسلامشهر',
  havadar: 'هوادار',
  althaid: 'الثيد',
  alurooba: 'العروبة',
  ittifaq: 'الاتفاق',
  exeter: 'إكستر',
  exetercity: 'إكستر',
  norwich: 'نورويتش',
  norwichcity: 'نورويتش',
  alejandrobalde: 'أليخاندرو بالدي',
  joaocancelo: 'جواو كانسيلو',
  achristensen: 'كريستينسن',
  andreaschristensen: 'كريستينسن',
  paucubarsiparedes: 'باو كوبارسي',
  paucubarsi: 'باو كوبارسي',
  xespart: 'إسبارت',
  ericgarcia: 'إريك غارسيا',
  jkounde: 'كوندي',
  juleskounde: 'جول كوندي',
  gerardmartin: 'جيرارد مارتن',
  cfr1907cluj: 'كلوج',
  cfrcluj: 'كلوج',
  borehamwood: 'بورهام وود',
  getafe: 'خيتافي',
  celta: 'سيلتا فيغو',
  celtavigo: 'سيلتا فيغو',
  mallorca: 'مايوركا',
  rayovallecano: 'رايو فايكانو',
  juventus: 'يوفنتوس',
  inter: 'إنتر ميلان',
  internazionalemilano: 'إنتر ميلان',
  intermilan: 'إنتر ميلان',
  acmilan: 'ميلان',
  milan: 'ميلان',
  napoli: 'نابولي',
  asroma: 'روما',
  roma: 'روما',
  lazio: 'لاتسيو',
  atalanta: 'أتالانتا',
  fiorentina: 'فيورنتينا',
  bologna: 'بولونيا',
  torino: 'تورينو',
  bayernmunich: 'بايرن ميونخ',
  bayernmunchen: 'بايرن ميونخ',
  fcbayernmunchen: 'بايرن ميونخ',
  bayern: 'بايرن ميونخ',
  borussiadortmund: 'بوروسيا دورتموند',
  dortmund: 'دورتموند',
  rbleipzig: 'لايبزيغ',
  bayerleverkusen: 'باير ليفركوزن',
  leverkusen: 'باير ليفركوزن',
  eintrachtfrankfurt: 'آينتراخت فرانكفورت',
  frankfurt: 'فرانكفورت',
  borussiamonchengladbach: 'غلادباخ',
  wolfsburg: 'فولفسبورغ',
  parissaintgermain: 'باريس سان جيرمان',
  psg: 'باريس سان جيرمان',
  olympiquemarseille: 'مارسيليا',
  marseille: 'مارسيليا',
  lyon: 'ليون',
  olympiquelyonnais: 'ليون',
  monaco: 'موناكو',
  lille: 'ليل',
  nice: 'نيس',
  rennes: 'رين',
  lens: 'لانس',
  strasbourg: 'ستراسبورغ',
  ajax: 'أياكس',
  psv: 'آيندهوفن',
  psveindhoven: 'آيندهوفن',
  feyenoord: 'فاينورد',
  benfica: 'بنفيكا',
  porto: 'بورتو',
  fcporto: 'بورتو',
  sportingcp: 'سبورتينغ لشبونة',
  sportinglisbon: 'سبورتينغ لشبونة',
  como: 'كومو',
  comocalcio: 'كومو',
  aek: 'أيك أثينا',
  aekathens: 'أيك أثينا',
  aekathensfc: 'أيك أثينا',
  clubbrugge: 'كلوب بروج',
  clubbruggekv: 'كلوب بروج',
  brugge: 'بروج',
  clubbruggekvv: 'كلوب بروج',
  lask: 'لاسك لينتس',
  lasklinz: 'لاسك لينتس',
  sabah: 'صباح',
  sabahfa: 'صباح',
  slaviapraha: 'سلافيا براغ',
  skslaviaprague: 'سلافيا براغ',
  slaviaprague: 'سلافيا براغ',
  slavia: 'سلافيا براغ',
  pafos: 'بافوس',
  pafosfc: 'بافوس',
  qarabag: 'قره باغ',
  qarabagfk: 'قره باغ',
  karabakh: 'قره باغ',
  unionsaintgilloise: 'يونيون سان جيلواز',
  unionsg: 'يونيون سان جيلواز',
  bodoglint: 'بودو غليمت',
  bodoglimt: 'بودو غليمت',
  fkbg: 'بودو غليمت',
  kairat: 'كايرات',
  kairatalmaty: 'كايرات',
  olympiacos: 'أولمبياكوس',
  olympiakos: 'أولمبياكوس',
  redstar: 'النجم الأحمر',
  crvenazvezda: 'النجم الأحمر',
  redstarbelgrade: 'النجم الأحمر',
  dynamokyiv: 'دينامو كييف',
  dynamokiev: 'دينامو كييف',
  shakhtardonetsk: 'شاختار دونيتسك',
  shakhtar: 'شاختار',
  youngboys: 'يونغ بويز',
  bscyoungboys: 'يونغ بويز',
  talisca: 'تاليسكا',
  andersonntalisca: 'تاليسكا',
  ferrantorres: 'فيران توريس',
  masongreenwood: 'ماسون غرينوود',
  greenwood: 'غرينوود',
  ermandinodemirovic: 'إرماندين ديميروفيتش',
  demirovic: 'ديميروفيتش',
  tripics: 'تريبيتش',
  ztripic: 'تريبيتش',
  janmickels: 'ميكلز',
  mickels: 'ميكلز',
  vsimic: 'سيمييتش',
  simic: 'سيمييتش',
  galatasaray: 'غلطة سراي',
  fenerbahce: 'فنربخشة',
  besiktas: 'بشكتاش',
  trabzonspor: 'طرابزون سبور',
  alhilal: 'الهلال',
  alnassr: 'النصر',
  alittihad: 'الاتحاد',
  alahli: 'الأهلي',
  alahly: 'الأهلي',
  alahlysc: 'الأهلي',
  alqadsiah: 'القادسية',
  alshabab: 'الشباب',
  alettifaq: 'الاتفاق',
  alfattah: 'الفتح',
  alraed: 'الرائد',
  alkhaleej: 'الخليج',
  alokhdood: 'الأخدود',
  alwehda: 'الوحدة',
  altai: 'الطائي',
  damac: 'ضمك',
  zamalek: 'الزمالك',
  pyramids: 'بيراميدز',
  ceramica: 'سيراميكا كليوباترا',
  ceramicacleopatra: 'سيراميكا كليوباترا',
  almasry: 'المصري',
  ismaily: 'الإسماعيلي',
  ittihadalexandria: 'الاتحاد السكندري',
  wydad: 'الوداد',
  raja: 'الرجاء',
  esperance: 'الترجي',
  esperancetunis: 'الترجي',
  alain: 'العين',
  alsadd: 'السد',
  alduhail: 'الدحيل',
  alrayyan: 'الريان',
  alarabi: 'العربي',
  alwasl: 'الوصل',
  aljazira: 'الجزيرة',
  sharjah: 'الشارقة',
  intermiami: 'إنتر ميامي',
  lagalaxy: 'لوس أنجلوس غالاكسي',
  celtic: 'سلتيك',
  rangers: 'رينجرز',
  panathinaikos: 'باناثينايكوس',
  riverplate: 'ريفر بليت',
  bocajuniors: 'بوكا جونيورز',
  flamengo: 'فلامنغو',
  palmeiras: 'بالميراس',
  corinthians: 'كورنثيانز',
  saopaulo: 'ساو باولو',
  england: 'إنجلترا',
  spain: 'إسبانيا',
  world: 'عالمي',
  luxembourg: 'لوكسمبورغ',
  women: 'للسيدات',
  womens: 'للسيدات',
  france: 'فرنسا',
  germany: 'ألمانيا',
  italy: 'إيطاليا',
  portugal: 'البرتغال',
  netherlands: 'هولندا',
  holland: 'هولندا',
  belgium: 'بلجيكا',
  brazil: 'البرازيل',
  argentina: 'الأرجنتين',
  uruguay: 'الأوروغواي',
  morocco: 'المغرب',
  egypt: 'مصر',
  algeria: 'الجزائر',
  tunisia: 'تونس',
  saudiarabia: 'السعودية',
  qatar: 'قطر',
  uae: 'الإمارات',
  unitedarabemirates: 'الإمارات',
  japan: 'اليابان',
  china: 'الصين',
  southkorea: 'كوريا الجنوبية',
  korea: 'كوريا الجنوبية',
  usa: 'الولايات المتحدة',
  unitedstates: 'الولايات المتحدة',
  mexico: 'المكسيك',
  croatia: 'كرواتيا',
  serbia: 'صربيا',
  switzerland: 'سويسرا',
  austria: 'النمسا',
  poland: 'بولندا',
  denmark: 'الدنمارك',
  sweden: 'السويد',
  norway: 'النرويج',
  turkey: 'تركيا',
  greece: 'اليونان',
  wales: 'ويلز',
  scotland: 'إسكتلندا',
  ireland: 'أيرلندا',
  republicofireland: 'جمهورية أيرلندا',
  ukraine: 'أوكرانيا',
  finland: 'فنلندا',
  georgia: 'جورجيا',
  czechia: 'التشيك',
  czechrepublic: 'التشيك',
  papuanewguinea: 'بابوا غينيا الجديدة',
  solomonislands: 'جزر سليمان',
  fiji: 'فيجي',
  newcaledonia: 'كاليدونيا الجديدة',
  mongolia: 'منغوليا',
  senegal: 'السنغال',
  nigeria: 'نيجيريا',
  ghana: 'غانا',
  ivorycoast: 'ساحل العاج',
  cotedivoire: 'ساحل العاج',
  cameroon: 'الكاميرون',
  colombia: 'كولومبيا',
  chile: 'تشيلي',
  ecuador: 'الإكوادور',
  peru: 'بيرو',
  australia: 'أستراليا',
  iran: 'إيران',
  iraq: 'العراق',
  jordan: 'الأردن',
  lebanon: 'لبنان',
  palestine: 'فلسطين',
  syria: 'سوريا',
  kuwait: 'الكويت',
  bahrain: 'البحرين',
  oman: 'عُمان',
  yemen: 'اليمن',
  sudan: 'السودان',
  libya: 'ليبيا',
  africa: 'أفريقيا',
  asia: 'آسيا',
  europe: 'أوروبا',
  lionelmessi: 'ليونيل ميسي',
  messi: 'ميسي',
  cristianoronaldo: 'كريستيانو رونالدو',
  ronaldo: 'رونالدو',
  mohamedsalah: 'محمد صلاح',
  salah: 'صلاح',
  erlinghaaland: 'إيرلينغ هالاند',
  haaland: 'هالاند',
  kylianmbappe: 'كيليان مبابي',
  mbappe: 'مبابي',
  karimbenzema: 'كريم بنزيما',
  benzema: 'بنزيما',
  viniciusjunior: 'فينيسيوس جونيور',
  viniciusjr: 'فينيسيوس جونيور',
  vinicius: 'فينيسيوس',
  judebellingham: 'جود بيلينغهام',
  bellingham: 'بيلينغهام',
  kevindebruyne: 'كيفين دي بروين',
  debruyne: 'دي بروين',
  harrykane: 'هاري كين',
  robertlewandowski: 'روبرت ليفاندوفسكي',
  lewandowski: 'ليفاندوفسكي',
  neymar: 'نيمار',
  neymarjr: 'نيمار',
  lukamodric: 'لوكا مودريتش',
  modric: 'مودريتش',
  lamineyamal: 'لامين يامال',
  yamal: 'يامال',
  pedri: 'بيدري',
  gavi: 'غافي',
  rodri: 'رودري',
  bukayosaka: 'بوكايو ساكا',
  saka: 'ساكا',
  colepalmer: 'كول بالمر',
  palmer: 'بالمر',
  philfoden: 'فيل فودن',
  foden: 'فودن',
  declanrice: 'ديكلان رايس',
  martinodegaard: 'مارتن أوديغارد',
  odegaard: 'أوديغارد',
  williamsaliba: 'ويليام ساليبا',
  saliba: 'ساليبا',
  virgilvandijk: 'فيرجيل فان دايك',
  vandijk: 'فان دايك',
  alisson: 'أليسون',
  alissonbecker: 'أليسون',
  thibautcourtois: 'تيبو كورتوا',
  courtois: 'كورتوا',
  federicovalverde: 'فيديريكو فالفيردي',
  valverde: 'فالفيردي',
  rodrygo: 'رودريغو',
  ousmanedembele: 'عثمان ديمبيلي',
  dembele: 'ديمبيلي',
  antoinegriezmann: 'أنطوان غريزمان',
  griezmann: 'غريزمان',
  julianalvarez: 'جوليان ألفاريز',
  victorosimhen: 'فيكتور أوسيمين',
  osimhen: 'أوسيمين',
  khvichakvaratskhelia: 'خفيتشا كفاراتسخيليا',
  kvaratskhelia: 'كفاراتسخيليا',
  lautaromartinez: 'لاوتارو مارتينيز',
  achrafhakimi: 'أشرف حكيمي',
  hakimi: 'حكيمي',
  youssefennesyri: 'يوسف النصيري',
  youssefennesiry: 'يوسف النصيري',
  ennesyri: 'النصيري',
  sofianeboufal: 'سفيان بوفال',
  hakimziyech: 'حكيم زياش',
  riyadmahrez: 'رياض محرز',
  mahrez: 'محرز',
  sadiomane: 'ساديو ماني',
  heungminson: 'سون هيونغ مين',
  son: 'سون',
  alexanderisak: 'ألكسندر إسحاق',
  aisak: 'ألكسندر إسحاق',
  isak: 'إسحاق',
  joaopedro: 'جواو بيدرو',
  ehaaland: 'إيرلينغ هالاند',
  florianwirtz: 'فلوريان فيرتز',
  wirtz: 'فيرتز',
  jamalmusiala: 'جمال موسيالا',
  musiala: 'موسيالا',
  harrymaguire: 'هاري ماغواير',
  brunosfernandes: 'برونو فرنانديز',
  brunofernandes: 'برونو فرنانديز',
  marcusrashford: 'ماركوس راشفورد',
  rashford: 'راشفورد',
  oldtrafford: 'أولد ترافورد',
  anfield: 'أنفيلد',
  etihadstadium: 'ملعب الاتحاد',
  stamfordbridge: 'ستامفورد بريدج',
  emiratesstadium: 'الإمارات',
  wembley: 'ويمبلي',
  santiagobernabeu: 'سانتياغو برنابيو',
  bernabeu: 'برنابيو',
  campnou: 'كامب نو',
  spotifycampnou: 'كامب نو',
  metropolitano: 'الميتروبوليتانو',
  parcdesprinces: 'بارك دي برانس',
  allianzarena: 'أليانز أرينا',
  signalidunapark: 'سيغنال إيدونا بارك',
  sansiro: 'سان سيرو',
  juventusstadium: 'أليانز ستاديوم',
  stadiodieogo: 'ستاديو دييغو أرماندو مارادونا',
  kingfahdstadium: 'مدينة الملك فهد الرياضية',
  alawwalpark: 'الأول بارك',
  cairointernationalstadium: 'ستاد القاهرة',
  goalkeeper: 'حارس مرمى',
  defender: 'مدافع',
  midfielder: 'لاعب وسط',
  attacker: 'مهاجم',
  forward: 'مهاجم',
  striker: 'مهاجم',
  winger: 'جناح',
  penalty: 'ركلة جزاء',
  owngoal: 'هدف عكسي',
  yellowcard: 'بطاقة صفراء',
  redcard: 'بطاقة حمراء',
  substitution: 'تبديل',
  regularseason: 'الدور العام',
  playoff: 'الملحق',
  playoffs: 'الملحق',
  final: 'النهائي',
  semifinal: 'نصف النهائي',
  quarterfinal: 'ربع النهائي',
  groupstage: 'دور المجموعات',
  knockout: 'الأدوار الإقصائية',
  transfer: 'انتقال',
  loan: 'إعارة',
  freeagent: 'انتقال حر',
  returnfromloan: 'عودة من الإعارة',
  draw: 'تعادل',
  fifa: 'الفيفا',
  uefa: 'اليويفا',
  caf: 'كاف',
  afc: 'الاتحاد الآسيوي',
  concacaf: 'الكونكاكاف',
  conmebol: 'الكونميبول',
  bein: 'بي إن',
  beinsports: 'بي إن سبورتس',
};

const TITLE: Record<string, string> = {
  epl: 'Premier League',
  laliga: 'La Liga',
  laligaea: 'La Liga',
  seriea: 'Serie A',
  bundesliga: 'Bundesliga',
  ligue1: 'Ligue 1',
  uefachampionsleague: 'UEFA Champions League',
  championsleague: 'Champions League',
  uefaeuropaleague: 'UEFA Europa League',
  europaleague: 'Europa League',
  fifaworldcup: 'FIFA World Cup',
  saudiarabia: 'Saudi Arabia',
  unitedarabemirates: 'UAE',
  southkorea: 'South Korea',
  usa: 'USA',
  manchesterunited: 'Manchester United',
  manchestercity: 'Manchester City',
  realmadrid: 'Real Madrid',
  barcelona: 'Barcelona',
  atleticomadrid: 'Atletico Madrid',
  parissaintgermain: 'Paris Saint-Germain',
  psg: 'Paris Saint-Germain',
  bayernmunich: 'Bayern Munich',
  borussiadortmund: 'Borussia Dortmund',
  internazionalemilano: 'Inter Milan',
  inter: 'Inter Milan',
  intermilan: 'Inter Milan',
  acmilan: 'AC Milan',
  asroma: 'Roma',
  tottenhamhotspur: 'Tottenham',
  tottenham: 'Tottenham',
  newcastleunited: 'Newcastle United',
  westhamunited: 'West Ham',
  nottinghamforest: 'Nottingham Forest',
  wolverhamptonwanderers: 'Wolverhampton',
  brightonandhovealbion: 'Brighton',
  athleticclub: 'Athletic Club',
  realbetis: 'Real Betis',
  alaves: 'Alaves',
  deportivoalaves: 'Alaves',
  deportivolacoruna: 'Deportivo La Coruna',
  espanyol: 'Espanyol',
  neom: 'NEOM',
  alkholood: 'Al Kholood',
  aldiriyah: 'Al Diriyah',
  alqadisiyah: 'Al Qadisiyah',
  alhilalsaudi: 'Al Hilal',
  kyrgyzstan: 'Kyrgyzstan',
  maldives: 'Maldives',
  azadeganleague: 'Azadegan League',
  premierleaguecup: 'Premier League Cup',
  friendlies: 'Friendlies',
  internationalfriendly: 'International Friendlies',
  clubfriendlies: 'Club Friendlies',
  presidentscup: 'Presidents Cup',
  saudiproleague: 'Saudi Pro League',
  realsociedad: 'Real Sociedad',
  fcbayernmunchen: 'Bayern Munich',
  rbleipzig: 'RB Leipzig',
  bayerleverkusen: 'Bayer Leverkusen',
  olympiquemarseille: 'Marseille',
  sportingcp: 'Sporting CP',
  alhilal: 'Al Hilal',
  alnassr: 'Al Nassr',
  alittihad: 'Al Ittihad',
  alahli: 'Al Ahli',
  alahly: 'Al Ahly',
  intermiami: 'Inter Miami',
  lionelmessi: 'Lionel Messi',
  cristianoronaldo: 'Cristiano Ronaldo',
  mohamedsalah: 'Mohamed Salah',
  erlinghaaland: 'Erling Haaland',
  kylianmbappe: 'Kylian Mbappe',
  judebellingham: 'Jude Bellingham',
  kevindebruyne: 'Kevin De Bruyne',
  harrykane: 'Harry Kane',
  robertlewandowski: 'Robert Lewandowski',
  lukamodric: 'Luka Modric',
  fifa: 'FIFA',
  uefa: 'UEFA',
  caf: 'CAF',
  mls: 'MLS',
};

const AR_EN: Record<string, string> = {};
for (const [en, ar] of Object.entries(EN_AR)) {
  AR_EN[key(ar)] = TITLE[en] || en.replace(/([a-z])([A-Z])/g, '$1 $2');
}

function titleCaseKey(enKey: string) {
  if (TITLE[enKey]) return TITLE[enKey];
  return enKey.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

const SKIP = /^(fc|sc|cf|afc|vs|v|and|the)$/i;

function ageBandSuffix(value: string) {
  const match = value.match(/^(.*?)\s*U-?(\d{1,2})\s*$/i);
  if (!match) return null;
  return { base: match[1].trim(), years: match[2] };
}

function wordsOf(value: string) {
  return value.split(/\s+/).filter(Boolean);
}

function localizeArabic(value: string): string {
  const exact = EN_AR[key(value)];
  if (exact) return exact;
  if (/\bregular season\b/i.test(value)) {
    return localizeArabic(value.replace(/regular season/gi, 'الدور العام'));
  }

  const words = wordsOf(value);
  if (words.length <= 1) return value;

  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    if (/^[A-Za-z]\.?$/.test(words[i])) {
      i += 1;
      continue;
    }
    if (SKIP.test(words[i].replace(/[.]/g, '')) && !/^(vs|v|and|the)$/i.test(words[i])) {
      i += 1;
      continue;
    }
    let hit: string | null = null;
    let used = 1;
    for (let len = Math.min(5, words.length - i); len >= 1; len--) {
      const slice = words.slice(i, i + len).join(' ');
      const mapped = EN_AR[key(slice)];
      if (mapped) {
        hit = mapped;
        used = len;
        break;
      }
    }
    out.push(hit ?? words[i]);
    i += used;
  }
  const joined = out.join(' ').trim();
  if (!joined) return value;
  if (/[\u0600-\u06FF]/.test(joined)) return joined;
  return /[A-Za-z]/.test(joined) ? value : joined;
}

/** Turn an Arabic desk name into a Latin query the source API can search. */
export function sourceSearchQuery(raw: string): string {
  const value = (raw || '').trim();
  if (!value) return '';
  if (!/[\u0600-\u06FF]/.test(value)) return value;
  const exact = AR_EN[key(value)];
  if (exact) return exact;

  const words = wordsOf(value);
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    let hit: string | null = null;
    let used = 1;
    for (let len = Math.min(5, words.length - i); len >= 1; len--) {
      const slice = words.slice(i, i + len).join(' ');
      const mapped = AR_EN[key(slice)];
      if (mapped) {
        hit = mapped;
        used = len;
        break;
      }
    }
    out.push(hit ?? words[i]);
    i += used;
  }
  const joined = out.join(' ').trim();
  return /[A-Za-z]/.test(joined) ? joined : value;
}

export function localizePlainName(locale: string, raw: string | number | null | undefined): string {
  const value = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw).trim();
  if (!value) return '';
  if (/^[0-9:'+.\-\s/%]+$/.test(value)) return value;
  if (/^(fc|sc|cf|afc|vs)$/i.test(value)) return value;
  const k = key(value);
  const arabic = /[\u0600-\u06FF]/.test(value);
  if (locale === 'ar') {
    if (arabic) return value;
    const initial = value.match(/^[A-Z]\.\s+(.+)$/);
    if (initial) {
      const rest = localizeArabic(initial[1]);
      if (rest !== initial[1] && /[\u0600-\u06FF]/.test(rest)) return rest;
    }
    return localizeArabic(value);
  }
  if (!arabic) return value;
  if (AR_EN[k]) return AR_EN[k];
  const fromEn = Object.entries(EN_AR).find(([, ar]) => key(ar) === k);
  if (fromEn) return titleCaseKey(fromEn[0]);
  return value;
}

export function localizeTeamName(locale: string, raw: string | number | null | undefined): string {
  const value = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw).trim();
  if (!value) return '';
  const band = ageBandSuffix(value);
  if (locale === 'ar' && band) {
    const named = localizePlainName('ar', band.base || value);
    return `${named} تحت ${band.years} عامًا`;
  }
  const cleaned = value
    .replace(/\s+(football club|calcio|fc|cf|kv|sk|fk|nk|ac|sc|afc|cfc|fa)\s*$/i, '')
    .replace(/^(fc|sk|fk|nk|ac|as)\s+/i, '')
    .trim();
  if (cleaned && cleaned !== value) {
    const stripped = localizePlainName(locale, cleaned);
    if (locale !== 'ar' || stripped !== cleaned) return stripped;
  }
  return localizePlainName(locale, value);
}

const NAME_KEYS = new Set([
  'name',
  'player',
  'assistPlayer',
  'nationality',
  'country',
  'city',
  'venue',
  'teamName',
  'playerName',
  'coachName',
  'label',
]);

/** Rewrite sports proper names on a loaded tree for the active locale. */
export function walkLocalizeNames(locale: string, node: unknown, depth = 0) {
  if (!node || depth > 10) return;
  if (Array.isArray(node)) {
    for (const item of node) walkLocalizeNames(locale, item, depth + 1);
    return;
  }
  if (typeof node !== 'object') return;
  const record = node as Record<string, unknown>;
  for (const [field, value] of Object.entries(record)) {
    if (typeof value === 'string' && NAME_KEYS.has(field)) {
      record[field] = localizeTeamName(locale, value);
    } else if (value && typeof value === 'object') {
      walkLocalizeNames(locale, value, depth + 1);
    }
  }
}
