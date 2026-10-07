// Source coordinates belong to the court painting, so the ritual and engraving
// remain attached to carved stone when the camera or viewport changes.
export const monumentWords = ['The Goddess', 'Natasha Shania Caessara', '06 October 1998'];
export const monumentLayout = {
  x: .5, foot: .615, height: .595,
  plaque: { x: .5, rows: [.666, .686, .706], width: .248 },
  channels: [
    [[.50,.958], [.437,.933], [.445,.884], [.416,.852], [.372,.826], [.358,.789]],
    [[.50,.958], [.50,.924], [.496,.887], [.502,.844], [.502,.789]],
    [[.50,.958], [.568,.933], [.554,.884], [.588,.852], [.638,.826], [.647,.789]],
  ],
};

export const sanctumScenes = [
  {
    id: 'toward-the-goddess', realm: 'garden', chapter: 'MASIH ADA SATU TEMPAT', title: 'Mengikuti aliran',
    camera: { x: .88, y: .55, zoom: 1.04 }, travel: 2600,
    lines: [
      { id: 'another-way', speaker: 'Natasha', text: 'Masih ada jalan ke sana?' },
      { id: 'the-main-garden', gesture: 'listen', listening: 'listen',
        text: 'Ada.\nYang utama belum kamu lihat.', answer: 'Kirain tadi udah gede banget.' },
      { id: 'follow-its-water', gesture: 'permit',
        text: 'Ikuti aliran airnya.\nKita ke halaman di tengah taman.', answer: 'Yaudah, ayo.' },
    ],
  },
  {
    id: 'the-main-court', realm: 'sanctum', chapter: 'HALAMAN UNTUKMU', title: 'Taman yang menunggu',
    camera: { x: .5, y: .5, zoom: 1 }, travel: 6500, ritual: true,
    lines: [
      { id: 'an-empty-platform', speaker: 'Natasha', text: 'Lah, ketutup kabut semua.\nYang utama apanya?' },
      { id: 'water-waits-in-stone', gesture: 'reassess', listening: 'listen',
        text: 'Ada di belakangnya.\nLihat tiga alur di batu itu. Airnya perlu sampai ke bunganya.', answer: 'Terus aku yang ngapain?' },
      { id: 'lead-the-spring', gesture: 'permit', listening: 'listen',
        text: 'Sentuh mata air di depanmu.\nBawa alirannya mengikuti setiap alur batu.', answer: 'Jangan suruh aku angkat batu ya.' },
      { id: 'no-lifting-required', gesture: 'reassess',
        text: 'Tidak perlu.\nUrus airnya saja. Nanti kabutnya menyingkir.' },
    ],
  },
  {
    id: 'goddess', realm: 'sanctum', chapter: 'THE GODDESS', title: 'Natasha',
    camera: { x: .5, y: .5, zoom: 1 }, travel: 1800, reveal: true, portrait: false,
    lines: [
      { id: 'my-own-monument', speaker: 'Natasha', text: '...Itu aku?' },
      { id: 'yes-that-is-you', gesture: 'listen', listening: 'listen',
        text: 'Ya.', answer: 'Segede itu?' },
      { id: 'the-garden-for-her', gesture: 'listen', listening: 'listen',
        text: 'Seluruh halaman ini untukmu.\nJadi, patungnya sekalian.', answer: 'Kamu ni ada-ada aja.' },
      { id: 'a-hand-near-her-heart', speaker: 'Natasha', text: 'Terus tangannya kenapa gitu?' },
      { id: 'an-open-hand', gesture: 'reassess',
        text: 'Tangan yang satu dekat hatinya.\nYang satu lagi terbuka. Kurasa cocok denganmu.' },
    ],
  },
  {
    id: 'her-name-in-stone', realm: 'sanctum', chapter: 'YANG KUINGIN KAMU LIHAT', title: 'Nama pada monumen',
    camera: { x: .5, y: .653, zoom: 1.47 }, travel: 3200, reveal: true, portrait: false,
    lines: [
      { id: 'the-words-beneath', speaker: 'Natasha', text: 'Ada tulisannya juga.\n“The Goddess”?' },
      { id: 'her-place-in-this-world', gesture: 'reassess', listening: 'listen',
        text: 'Di taman ini, gelarnya memang begitu.', answer: 'Yang di bawah namaku itu tanggal lahirku, kan?' },
      { id: 'a-day-that-matters', gesture: 'listen',
        text: 'Ya.\nHari yang cukup penting bagiku.' },
    ],
  },
];
