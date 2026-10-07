export const gateScene = {
  id: 'gate', chapter: 'PROLOG', title: 'Di balik gerbang',
  camera: { x: .16, y: .55, zoom: 1.08 },
  seals: [
    { x: 724, y: 419, width: 142, height: 296, name: 'ingatan' },
    { x: 948, y: 419, width: 142, height: 296, name: 'janji' },
    { x: 839, y: 191, width: 78, height: 76, name: 'nama' },
  ],
  ritual: {
    intro: 'Tidak ada jalan kembali. Hanya sebuah pintu besar di hadapanmu.',
    hint: 'Tahan jarimu pada ukiran yang paling terang sampai baranya menyala. Ada tiga ukiran.',
    ready: 'Sentuh celah pintu yang hangat. Tahan untuk membukanya.',
    whispers: [
      'Apakah kamu sedang bermimpi?',
      'Satu bara menyala. Dua lagi.',
      'Celah pintu mulai terasa hangat.',
      'Kini pintunya bisa didorong.',
    ],
  },
  lore: {
    id: 'mimics', title: 'Jiwa yang meminjam wajah',
    paragraphs: [
      'Di neraka, sebagian jiwa terlalu lama mengikuti orang lain. Mereka meminjam cara bicara, kebiasaan, bahkan wajah, sampai bentuk mereka sendiri perlahan hilang.',
      'Jiwa-jiwa itu disebut mimic. Ada yang meniru agar diterima. Ada yang sengaja memakai sosok lain untuk mendapatkan kepercayaan. Mereka dapat mengulang apa yang pernah mereka dengar; nama yang terucap belum membuktikan siapa yang mengucapkannya.',
      'Lucifer mengenal kebiasaan penghuni wilayahnya. Ia memperhatikan, menilai, dan menentukan sendiri siapa yang akan ia percaya.',
    ],
  },
  trail: {
    id: 'arcade', hint: 'Mulai di batu yang terang. Usap ke atas untuk melangkah menuju cermin.',
    paused: 'Sentuh batu yang terang, lalu usap ke atas lagi. Perjalananmu tetap tersimpan.',
    route: [[.16,.81], [.148,.78], [.133,.73], [.126,.675]],
    destination: { x: .126, y: .485, zoom: 1.22 },
    arrival: 'Lorong cermin sudah di depan.',
  },
  lines: [
    {
      id: 'red-everywhere', speaker: 'Natasha', gesture: 'listen',
      text: 'Tempat apa sih ini? Merah-merah gini.\nKayak di neraka.',
    },
    {
      id: 'where-from', gesture: 'guard', listening: 'listen',
      text: 'Ya, memang. Kamu pikir tempat apa?\nTunggu. Kamu masuk dari mana?',
      answer: 'Tadi ada pintu. Aku buka. Terus jalan kesini',
    },
    {
      id: 'gate-question', gesture: 'reassess', listening: 'listen',
      text: 'Pintu itu tidak terbuka untuk sembarang orang.\nKamu melakukan apa?',
      answer: 'orang aku cuma megang doang, terus anget',
    },
    {
      id: 'just-touching', gesture: 'reassess', pause: 250,
      text: 'Pintu neraka ga kebuka cuma dengan "dipegang".',
      answer: 'Ya nyatanya pintunya kebuka sendiri. Kamu siapa sih?',
    },
    {
      id: 'lucifer', gesture: 'guard', pause: 350,
      text: 'Lucifer.',
    },
    {
      id: 'host', gesture: 'guard', listening: 'listen',
      text: 'Yang punya tempat ini.\nBiasanya tamu sedikit lebih sopan.',
      answer: 'Kamu dari tadi nanya terus. Aku juga bingung.',
    },
    {
      id: 'colour-complaint', gesture: 'reassess', listening: 'listen',
      text: 'Jarang ada yang baru masuk ke sini\nlalu mengeluhkan pilihan warnanya.',
      answer: 'Ya lagian aneh, merah semua, panas pula.',
    },
    {
      id: 'name', gesture: 'listen', listening: 'listen',
      text: 'Aku akan mengingat keluhanmu.\nSesudah tahu siapa yang menyampaikannya.',
      answer: 'aku Natasha',
    },
    {
      id: 'considering-name', gesture: 'reassess', pause: 450,
      text: 'Natasha.',
      answer: 'Natasha Shania Caessara',
    },
    {
      id: 'private-name', kind: 'thought', reaction: 'conceal', gesture: 'guard', pause: 600,
      aside: 'Ia menyembunyikan keterkejutannya.', lore: 'mimics',
      text: 'Di sini, belum pernah ada yang tahu nama lengkapnya.\nSiapa orang ini sebenarnya? Aku harus berhati-hati.',
    },
    {
      id: 'caught-silence', speaker: 'Natasha', gesture: 'guard',
      text: 'Kenapa? Kok diem?',
    },
    {
      id: 'not-certain', gesture: 'guard', listening: 'listen',
      text: 'Tidak ada.', quiet: 1100,
      answer: 'woi, tiba tiba jadi patung',
    },
    {
      id: 'statue', gesture: 'guard', listening: 'listen',
      text: 'Patung tidak menjawab keluhan. Itu salah satu kelebihannya.',
      answer: 'yayaya. Terus gimana? aneh banget masa aku mimpi kaya gini.',
    },
    {
      id: 'a-dream', gesture: 'reassess', listening: 'listen', pause: 250,
      text: 'Mimpi, ya?',
      answer: 'kenapa sih bentuknya kaya gini, jelek banget',
    },
    {
      id: 'unpretty-world', gesture: 'guard', listening: 'listen',
      text: 'Di luar, hal-hal buruk sering dikemas dengan indah.\nDi sini, isinya terlihat.',
      answer: 'Jadi ini isinya?',
    },
    {
      id: 'gilded-arcade', gesture: 'reassess', listening: 'listen',
      text: 'Sebagian.\nLorong berlapis emas itu masih mencoba terlihat meyakinkan.',
      answer: 'Yang ada cermin-cerminnya?',
    },
    {
      id: 'curiosity', gesture: 'reassess', listening: 'permit',
      text: 'Ya. Mau lihat lebih dekat?',
      answer: 'Boleh. Tapi jangan jalan cepat-cepat.',
    },
    {
      id: 'unhurried', gesture: 'permit',
      text: 'Tenang. Perjalanannya bukan perlombaan.\nKalau lelah, kita bisa berhenti.',
    },
  ],
};

