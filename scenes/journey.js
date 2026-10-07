export const journeyScenes = [
  {
    id: 'mirrors', realm: 'mirror', portrait: false, chapter: 'PERJALANAN · I', title: 'Lorong cermin',
    camera: { x: .5, y: .5, zoom: 1 }, travel: 3200,
    mirror: true,
    lines: [
      {
        id: 'bad-mirrors', gesture: 'guard', listening: 'listen',
        text: 'Jangan percaya semua yang diperlihatkan kaca di sini.',
        answer: 'Eh, ada cermin. Aku mau lihat.',
      },
      {
        id: 'never-enough', gesture: 'reassess', listening: 'listen',
        text: 'Silakan.\nTapi biasanya, orang tidak menyukai hasilnya.',
        answer: 'Kenapa? Kacanya jelek?',
      },
      {
        id: 'one-mould', gesture: 'guard', listening: 'listen',
        text: 'Kacanya terlalu senang membuat orang terlihat seperti sesuatu yang bukan dirinya.',
        answer: 'Ya aku cuma mau ngaca. Ada abu semua, nih.',
      },
      {
        id: 'other-road', gesture: 'permit', listening: 'listen',
        text: 'Usap kacanya pelan.\nAku di sini.',
      },
    ],
  },
  {
    id: 'reflection', realm: 'mirror', portrait: false, chapter: 'PERJALANAN · I', title: 'Pantulan yang tidak tunduk',
    camera: { x: .5, y: .5, zoom: 1 }, travel: 500,
    trail: {
      id: 'scales', hint: 'Usap ke atas dari batu yang terang. Kita berjalan menuju timbangan.',
      paused: 'Usap lagi dari batu yang terang untuk melanjutkan.',
      route: [[.14,.78], [.265,.695], [.41,.62], [.527,.627]],
      destination: { x: .56, y: .47, zoom: 1.12 },
      arrival: 'Rantai timbangan berderit di atas alun-alun.',
    },
    lines: [
      { id: 'surprised-by-the-glass', speaker: 'Natasha',
        text: 'Loh… kok jadi begini?\nBajuku kan bukan ini.' },
      { id: 'only-a-reflection', gesture: 'listen', listening: 'listen',
        text: 'Yang berubah pantulannya.\nKamu masih berdiri di tempat yang sama.', answer: 'Aku kaya putri di situ. Ini cermin neraka?' },
      { id: 'a-mirror-exception', gesture: 'reassess', reaction: 'concealed', pause: 650,
        text: 'Ya.\nDan itu yang aneh.', answer: 'Apanya?' },
      { id: 'forced-reflections', gesture: 'guard', listening: 'listen',
        text: 'Biasanya wajah di kaca ini terlihat dibuat-buat.\nSemakin dipaksakan, semakin buruk.', answer: 'Terus ini kenapa malah bagus?' },
      { id: 'checking-the-glass', kind: 'thought', gesture: 'reassess', reaction: 'concealed',
        aside: 'Pandangan Lucifer bergerak dari pantulan ke tepi kaca. Wajahnya kembali tenang.',
        text: 'Kacanya bekerja seperti biasa.\nTidak ada yang menahannya. Tapi pantulannya tetap jernih.' },
      { id: 'nothing-forced', gesture: 'listen', listening: 'listen',
        text: 'Kamu melakukan sesuatu?', answer: 'orang aku cuma lihat doang.' },
      { id: 'simply-being-there', gesture: 'reassess', listening: 'listen',
        text: 'Ya.\nTanpa berusaha menjadi apa-apa.', answer: 'Ya masa harus usaha buat ngaca.' },
      { id: 'enough-mirror-for-today', gesture: 'permit', listening: 'listen',
        text: 'Cukup. Kita tidak perlu menghabiskan hari di depan kaca.', answer: 'Eh, tapi jubah kamu…' },
      {
        id: 'cloak', gesture: 'reassess', listening: 'listen',
        text: 'Apa salahnya dengan jubahku?',
        answer: 'masa merah merah gitu, mau matching sama neraka?',
      },
      {
        id: 'fashion-retort', gesture: 'guard', listening: 'listen',
        text: 'Aku rasa jubahku keren keren saja.',
        answer: 'Kamu ni ga paham fesyen ya orangnya.',
      },
      {
        id: 'fair-point', gesture: 'reassess', pause: 350,
        text: 'Aku akan mempertimbangkan kritikmu.\nJubahnya tetap kupakai.',
      },
      {
        id: 'towards-square', gesture: 'permit',
        text: 'Kita lanjut. Ada timbangan di alun-alun itu.',
      },
    ],
  },
  {
    id: 'scales', chapter: 'PERJALANAN · II', title: 'Alun-alun timbangan',
    camera: { x: .56, y: .47, zoom: 1.12 },
    trail: {
      id: 'bridge', hint: 'Usap ke atas di batu yang terang. Kita mengikuti jalan utuh di samping timbangan.',
      paused: 'Jalan utuhnya masih di depan. Usap lagi dari batu yang terang.',
      route: [[.527,.627], [.67,.607], [.76,.696], [.84,.79]],
      destination: { x: .84, y: .54, zoom: 1.18 },
      arrival: 'Angin mengangkat kain merah di dekat jembatan.',
    },
    lines: [
      {
        id: 'empty-scales', gesture: 'guard', listening: 'listen',
        text: 'Lihat baik-baik sebelum kamu mendekat.',
        answer: 'Itu timbangannya kosong, kan? Kok udah miring?',
      },
      {
        id: 'decided-result', gesture: 'guard', listening: 'listen',
        text: 'Karena yang memegangnya sudah memilih\nsiapa yang akan dianggap lebih berharga.',
        answer: 'Maksudnya?',
      },
      {
        id: 'unfair-standard', gesture: 'reassess', listening: 'listen',
        text: 'Kesalahan orang yang mereka sukai dianggap sepele.\nOrang yang tidak mereka sukai salah sedikit, langsung dihukum.',
        answer: 'Lah, itu mah curang.',
      },
      {
        id: 'faulty-scales', gesture: 'guard', listening: 'listen',
        text: 'Betul. Yang rusak timbangannya.\nBukan orang yang dipaksa berdiri di atasnya.',
        answer: 'Kalau aku lewat, ikut ditimbang juga?',
      },
      {
        id: 'no-trial', gesture: 'guard', listening: 'listen',
        text: 'Tidak perlu.\nKamu tidak harus membuktikan nilaimu kepada setiap orang yang ingin menilaimu.',
        answer: 'Ya bagus. Aku ga mau.',
      },
      {
        id: 'intact-road', gesture: 'permit', listening: 'listen',
        text: 'Kita lewat sebelah kiri.\nDi sana lantainya utuh.',
        answer: 'Okay',
      },
    ],
  },
  {
    id: 'bridge', chapter: 'PERJALANAN · III', title: 'Jembatan penantian',
    camera: { x: .84, y: .54, zoom: 1.18 },
    trail: {
      id: 'crossing', hint: 'Usap ke atas dari batu yang terang untuk menyeberang. Lepaskan jika ingin berhenti.',
      paused: 'Kita berhenti di sini. Usap lagi di batu yang terang saat kamu siap.',
      route: [[.84,.79], [.861,.814], [.884,.835], [.91,.847]],
      destination: { x: .91, y: .52, zoom: 1.02 },
      arrival: 'Batu terakhir sudah di belakang kita.',
    },
    lines: [
      {
        id: 'broken-hourglasses', speaker: 'Natasha', gesture: 'listen',
        text: 'Jam pasirnya banyak banget.\nKenapa semuanya pecah?',
      },
      {
        id: 'blaming-time', gesture: 'reassess', listening: 'listen',
        text: 'Orang di sini selalu merasa terlambat.\nKalau waktunya habis, yang disalahkan jamnya.',
        answer: 'Terus dipecahin? Aneh banget.',
      },
      {
        id: 'a-mess', gesture: 'guard', listening: 'listen',
        text: 'Kamu mulai mengerti kenapa tempat ini berantakan.',
        answer: 'Kalau kita? Emang harus cepat-cepat?',
      },
      {
        id: 'no-rush', gesture: 'listen', listening: 'listen',
        text: 'Tidak. Kita punya waktu.',
        answer: 'Jembatannya rusak. Kita beneran lewat situ?',
      },
      {
        id: 'her-choice', gesture: 'guard', listening: 'listen',
        text: 'Bisa lewat pinggir yang utuh.\nAtau kembali. Kamu yang pilih.',
        answer: 'lanjut aja, dah sampai sini',
      },
      {
        id: 'together', gesture: 'permit',
        text: 'Kalau begitu, kita menyeberang bersama.',
      },
    ],
  },
  {
    id: 'beyond', chapter: 'DI UJUNG NERAKA', title: 'Seberang jembatan',
    camera: { x: .91, y: .52, zoom: 1.02 },
    lines: [
      {
        id: 'other-side', gesture: 'permit', listening: 'listen',
        text: 'Sudah sampai seberang.\nTempat yang kutuju ada di depan.',
        answer: 'Masih merah-merah?',
      },
      {
        id: 'different-taste', gesture: 'reassess', listening: 'listen',
        text: 'Tidak.\nUntuk yang itu, aku punya selera yang berbeda.',
        answer: 'Nah, gitu dong. Dari tadi.',
      },
      {
        id: 'still-a-guest', gesture: 'guard', listening: 'listen',
        text: 'Kamu belum sehari di sini.\nKeluhanmu sudah cukup untuk seminggu.',
        answer: 'Ya kalau jelek masa dibilang bagus. Emang tempat apa?',
      },
      {
        id: 'made-for-her', gesture: 'listen', listening: 'listen',
        text: 'Taman. Kubuat sendiri.',
        answer: 'Di tengah neraka?',
      },
      {
        id: 'a-choice', gesture: 'guard', listening: 'listen',
        text: 'Ya. Ini tempatku.\nAku bisa memilih apa yang ingin kubangun di dalamnya.',
        answer: 'Buat kamu sendiri?',
      },
      {
        id: 'waiting-for-her', gesture: 'listen', listening: 'listen', pause: 400,
        text: 'Untuk pacarku.\nAku menunggunya datang ke sini.',
        answer: 'Kenapa ga dibawa langsung ke tamannya aja?',
      },
      {
        id: 'whole-world', gesture: 'reassess', listening: 'listen',
        text: 'Karena taman itu cuma sebagian.\nAku ingin dia melihat tempat ini juga.',
        answer: 'Yang merah-merah tadi? Kenapa?',
      },
      {
        id: 'inside-my-head', gesture: 'listen', listening: 'listen',
        text: 'Begitulah isi kepalaku ketika melihat dunia.\nBanyak yang bikin marah. Banyak yang tidak adil.',
        answer: 'Terus tamannya?',
      },
      {
        id: 'a-place-for-love', gesture: 'listen', listening: 'listen',
        text: 'Itu bagian yang kupilih untuk dia.\nAku mencintainya. Jadi aku ingin ada sesuatu yang indah di sini.',
        answer: 'Dia tahu kamu sayang banget gitu?',
      },
      {
        id: 'no-translation', gesture: 'reassess', listening: 'listen', pause: 350,
        text: 'Belum tentu.\nYang ada di kepalaku tidak selalu sampai kepadanya.',
        answer: 'Ya bilang lah.',
      },
      {
        id: 'a-showing', gesture: 'listen', listening: 'listen',
        text: 'Tidak sesederhana itu',
        answer: 'Terus sekarang gimana?',
      },
      {
        id: 'unfinished-question', gesture: 'permit',
        text: 'Kita lihat tamannya dulu.',
      },
    ],
  },
];
