// The garden keeps Lucifer's portrait and the player's voice. The world and
// interaction renderer choose how these source-coordinate surfaces come alive.
export const gardenScenes = [
  {
    id: 'garden', realm: 'garden', chapter: 'DI DALAM NERAKA', title: 'Taman yang dipilih',
    camera: { x: .46, y: .56, zoom: 1.04 },
    interaction: { kind: 'beckon', hint: 'Sentuh air di dekat ikan keemasan. Biarkan tanganmu di sana; ia akan mendekat.',
      area: [.42, .79, .88, .98], spot: { x: .53, y: .855 } },
    lines: [
      {
        id: 'a-green-world', speaker: 'Natasha', gesture: 'listen',
        text: 'Lah… ini juga tempat kamu?',
      },
      {
        id: 'same-kingdom', gesture: 'reassess', listening: 'listen',
        text: 'Masih tempatku.\nKamu boleh berhenti mengeluhkan warnanya sekarang.',
        answer: 'Yang ini bagus. Kamu ni ngerti seni ternyata.',
      },
      {
        id: 'art-verdict', gesture: 'guard', listening: 'listen',
        text: 'Penilaianmu akhirnya membaik.',
        answer: 'Ih, ada ikan. Airnya boleh dipegang?',
      },
      {
        id: 'touch-the-water', gesture: 'permit',
        text: 'Boleh.\nKali ini tanganmu tidak akan membuka pintu neraka.',
      },
    ],
  },
  {
    id: 'recognition', realm: 'garden', chapter: 'YANG MULAI FAMILIER', title: 'Suara yang kukenal',
    camera: { x: .49, y: .55, zoom: 1.08 },
    lines: [
      {
        id: 'cool-water', gesture: 'listen', listening: 'listen',
        text: 'Dingin, kan?',
        answer: 'Seger. Dari tadi panas banget.',
      },
      {
        id: 'take-your-time', gesture: 'listen', listening: 'listen',
        text: 'Kalau ingin duduk sebentar, ada bangku di bawah pohon.',
        answer: 'Kamu dari tadi ngeliatin aku terus.',
      },
      {
        id: 'enough-to-know', gesture: 'reassess', listening: 'listen', pause: 450,
        text: 'Aku sedang memastikan sesuatu.\nSekarang sudah cukup.',
        answer: 'Apaan?',
      },
      {
        id: 'her-at-last', gesture: 'listen', listening: 'listen',
        text: 'Natasha.',
        answer: 'Ya. Dari tadi juga udah bilang.',
      },
      {
        id: 'recognising-a-person', gesture: 'listen', listening: 'listen',
        text: 'Namanya kudengar di gerbang.\nOrangnya baru kukenali sepanjang jalan.',
        answer: 'Kamu ni ga ngerti yah orangnya.',
      },
      {
        id: 'a-familiar-reply', gesture: 'reassess', listening: 'listen',
        text: 'Ya. Kamu sering bilang begitu padaku.',
        answer: 'Sebentar. Kamu…?',
      },
      {
        id: 'the-creator', gesture: 'listen', listening: 'listen', pause: 400,
        text: 'Ya. Aku.',
        answer: 'Kok bisa jadi begini?',
      },
      {
        id: 'dramatic-dream', gesture: 'reassess', listening: 'listen',
        text: 'Mimpi punya selera dramatis.\nAku kebagian tanduk.',
        answer: 'Pantes dari tadi nyebelin.',
      },
    ],
  },
  {
    id: 'monument', realm: 'garden', chapter: 'YANG LANGSUNG KUKENALI', title: 'Kita, di dalam taman',
    camera: { x: .792, y: .49, zoom: 1.0 }, travel: 5500, reveal: true,
    lines: [
      { id: 'our-statue', speaker: 'Natasha', text: 'Eh. Patungnya gede banget.\nItu kita?' },
      { id: 'a-familiar-shape', gesture: 'listen', listening: 'listen',
        text: 'Ya.\nAda hal yang ingin kubuat langsung kamu kenali.', answer: 'Sampai dibikin segede itu?' },
      { id: 'not-a-small-project', gesture: 'reassess', listening: 'listen',
        text: 'Aku sudah telanjur membangun neraka.\nKecil-kecilan bukan keahlianku.', answer: 'Aku yang pose begini juga dibikinin?' },
      { id: 'the-one-i-like', gesture: 'listen', listening: 'listen',
        text: 'Tentu.\nAku menyukai caramu menjadi dirimu sendiri.', answer: 'Termasuk yang suka ngomel?' },
      { id: 'including-her-complaints', gesture: 'reassess', listening: 'listen',
        text: 'Termasuk itu.\nWalaupun pendapatmu tentang jubahku masih perlu diperbaiki.', answer: 'Ya kamu ni ga paham fesyen sih orangnya.' },
    ],
  },
  {
    id: 'apology', realm: 'garden', chapter: 'YANG BELUM KUSAMPAIKAN', title: 'Aku mendengarmu',
    camera: { x: .69, y: .55, zoom: 1.05 }, travel: 2200,
    lines: [
      { id: 'something-to-say', gesture: 'listen', listening: 'listen',
        text: 'Ada sesuatu yang belum kusampaikan dengan baik.\nSeharusnya tidak perlu menunggu sampai kamu datang ke sini.', answer: 'Apa?' },
      {
        id: 'my-missing-updates', gesture: 'listen', listening: 'listen',
        text: 'Aku sering masih terjaga sampai jam empat atau lima.\nKamu sudah tidur, dan aku tidak memberi kabar.',
        answer: 'Ga bilang ngapain. Ga bilang mau tidur.',
      },
      {
        id: 'my-small-omissions', gesture: 'listen', listening: 'listen',
        text: 'Ya. Goodnight dan cium kecil pun sering kulewatkan.\nAku paham kenapa kamu merasa tidak diperhatikan.',
        answer: 'Aku kan cuma mau dikabarin.',
      },
      {
        id: 'assuming-love-is-known', gesture: 'reassess', listening: 'listen',
        text: 'Aku terlalu sering menganggap kamu sudah tahu aku sayang.\nPadahal kamu juga perlu merasakannya.',
        answer: 'Ya masa harus nebak terus.',
      },
      {
        id: 'my-apology', gesture: 'listen', listening: 'listen', pause: 400,
        text: 'Tidak seharusnya.\nMaaf, Natasha. Itu kelalaianku.',
        answer: 'Aku denger.',
      },
      {
        id: 'a-small-presence', gesture: 'listen', listening: 'listen',
        text: 'Aku ingin lebih sering memberimu kabar.\nTermasuk hal sesederhana mau tidur.',
        answer: 'Goodnight juga.',
      },
      {
        id: 'goodnight-too', gesture: 'reassess', listening: 'listen',
        text: 'Goodnight juga.\nDan cium yang selama ini pelit sekali kuberikan.',
        answer: 'Nah, gitu dong.',
      },
      {
        id: 'care-beyond-a-garden', gesture: 'listen', listening: 'listen',
        text: 'Taman ini caraku menunjukkan apa yang sulit kukatakan.\nUntuk perhatian sehari-hari, aku tetap perlu hadir.',
        answer: 'Aku denger. Eh, ikannya ngikutin aku.',
      },
    ],
  },
  {
    id: 'freedom', realm: 'garden', chapter: 'RUANG UNTUK MENJADI DIRIMU', title: 'Arah yang dipilih sendiri',
    camera: { x: .63, y: .55, zoom: 1.03 }, travel: 1800,
    interaction: {
      kind: 'fish', hint: 'Usap air di dekat ikan. Ia akan mengikuti tanganmu, lalu berenang ke arahnya sendiri.',
      area: [.42, .79, .89, .98], spot: { x: .64, y: .865 },
    },
    lines: [
      { id: 'curious-fish', gesture: 'listen', listening: 'listen',
        text: 'Ya. Mereka penasaran dengan riak yang kamu buat.', answer: 'Bisa aku ajak ke sini?' },
      { id: 'let-it-choose', gesture: 'reassess', listening: 'listen',
        text: 'Bisa diajak.\nSetelah itu, biarkan ia memilih arah sendiri.', answer: 'Ga kamu atur juga?' },
      { id: 'a-garden-with-room', gesture: 'listen', listening: 'listen',
        text: 'Tidak. Aku membuat kolam yang luas.\nBukan menentukan setiap geraknya.', answer: 'Oke, sini ikan.' },
      { id: 'follow-the-ripples', gesture: 'permit',
        text: 'Gerakkan tanganmu pelan di permukaan air.\nLihat siripnya mengikuti riak.' },
    ],
  },
  {
    id: 'bloom', realm: 'garden', chapter: 'TANPA HARUS MEMBUKTIKAN DIRI', title: 'Teratai yang membuka',
    camera: { x: .725, y: .55, zoom: 1.02 }, travel: 2000,
    interaction: { kind: 'lily', lily: 0, hint: 'Kuncup teratai yang kena cahaya ada di depanmu. Sentuh dan tahan sebentar.',
      spot: { x: .726, y: .875 }, radius: .033 },
    lines: [
      { id: 'her-own-direction', gesture: 'listen', listening: 'listen',
        text: 'Aku ingin kamu juga punya ruang seperti itu.\nUntuk menjadi dirimu sendiri.', answer: 'Aku kan dari tadi jadi aku.' },
      { id: 'keep-being-her', gesture: 'reassess', listening: 'listen',
        text: 'Bagus. Pertahankan.\nTermasuk di luar taman ini.', answer: 'Yang menguncup itu kenapa?' },
      { id: 'no-price-for-growing', gesture: 'listen', listening: 'listen',
        text: 'Ia mendapat air yang sama dengan bunga yang sudah mekar.\nTidak perlu membuktikan dirinya lebih dulu.', answer: 'Boleh aku sentuh?' },
      { id: 'touch-a-real-bud', gesture: 'permit',
        text: 'Boleh. Yang merah muda di depanmu.\nPelan-pelan saja.' },
    ],
  },
  {
    id: 'shelter', realm: 'garden', chapter: 'HARI YANG LEBIH LEMBUT', title: 'Di bawah pohon',
    camera: { x: .806, y: .55, zoom: 1.02 }, travel: 2100,
    interaction: { kind: 'rest', lily: 1, hint: 'Letakkan sentuhanmu di teratai yang baru muncul. Diam sebentar; biarkan taman yang bergerak.',
      spot: { x: .806, y: .881 }, radius: .035 },
    lines: [
      { id: 'blooming-without-a-trial', speaker: 'Natasha', text: 'Ih, mekar.\nCantik banget.' },
      { id: 'care-without-a-price', gesture: 'listen', listening: 'listen',
        text: 'Semoga orang-orang yang kamu temui juga memperlakukanmu dengan baik.\nTanpa membuatmu terus merasa kurang.', answer: 'Kalau capek ketemu yang nyebelin?' },
      { id: 'a-place-to-pause', gesture: 'listen', listening: 'listen',
        text: 'Boleh berhenti sebentar.\nTidak semua hari harus kamu menangkan.', answer: 'Yang ini ga disuruh apa-apa lagi, kan?' },
      { id: 'let-the-garden-move', gesture: 'reassess',
        text: 'Cukup diam sebentar di dekat teratai itu.\nKali ini, biarkan taman yang sibuk.' },
    ],
  },
  {
    id: 'birthday', realm: 'garden', chapter: 'UNTUK NATASHA', title: 'Selamat ulang tahun',
    camera: { x: .792, y: .52, zoom: 1.0 }, travel: 2400,
    lore: {
      id: 'birthday-letter', title: 'Untuk Natasha', label: 'Surat untukmu', kicker: 'DARI AKU',
      paragraphs: [
        'Selamat ulang tahun ya sayang',
        'Dunia kadang pahit, kejam, dan tidak adil. Aku berharap, di antara semua itu, kamu tetap menemukan hal-hal yang membuatmu merasa aman, dihargai, dan bebas menjadi dirimu sendiri.',
        'Di mataku, kamu orang yang peduli dan penyayang.',
        'Aku tahu ada perhatian yang belum kuberikan dengan baik. Kabar saat masih terjaga, ucapan goodnight, cium kecil, atau sekadar bilang mau tidur. Kamu tidak seharusnya terus menebak apakah aku memikirkanmu. Maaf untuk hal-hal yang kulewatkan itu.',
        'Taman ini adalah bagian dari isi hati dan pikiranku yang ingin kuperlihatkan kepadamu. Aku ingin kamu tahu bahwa, di tengah semua yang membuatku kesal pada dunia, ada bagian yang kupilih untuk mencintaimu.',
        'Semoga di usiamu yang baru, kamu punya lebih banyak alasan untuk tersenyum, semua mimpi mimpimu bisa kamu kejar dengan menyenangkan, dan hari-hari yang terasa lebih bermakna buat kita. Semoga kamu tetap punya ruang untuk melakukan hal yang kamu sukai dan untuk berhenti ketika lelah.',
        'Terima kasih sudah berbagi hidup denganku. Aku senang kamu ada. I love you sayang',
        'sini cium dulu 😘',
      ],
    },
    lines: [
      {
        id: 'happy-birthday', gesture: 'listen', pause: 450,
        text: 'Selamat ulang tahun ya sayang',
      },
      {
        id: 'no-guessing', gesture: 'listen',
        text: 'Aku ingin kamu punya lebih banyak alasan untuk tersenyum.\nDan tahu bahwa kamu dicintai, tanpa harus menebak.',
      },
      {
        id: 'glad-you-exist', gesture: 'listen',
        text: 'Terima kasih sudah berbagi hidup denganku.\nAku senang kamu ada.',
      },
      {
        id: 'a-letter-for-you', gesture: 'permit', lore: 'birthday-letter',
        text: 'Ada surat untukmu.\nKamu boleh membacanya di sini.',
      },
    ],
  },
];
