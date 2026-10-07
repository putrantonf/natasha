export const farewellScene = {
  id: 'divine-farewell', realm: 'sanctum', chapter: 'SEBELUM KAMU TERBANGUN', title: 'Masih aku',
  camera: { x: .46, y: .48, zoom: 1.02 }, travel: 2400,
  lines: [
    { id: 'one-last-thing', gesture: 'listen', listening: 'listen',
      text: 'Ada satu hal lagi.', answer: 'Apa lagi?' },
    { id: 'not-this-form', gesture: 'reassess', listening: 'listen',
      text: 'Aku tidak ingin kamu terbangun dan mengingatku yang ini.', answer: 'Emang bisa ganti?' },
    { id: 'see-for-yourself', gesture: 'permit', action: 'divine', text: 'Lihat saja.' },
    { id: 'a-familiar-face', speaker: 'Natasha', text: 'Loh… kamu?' },
    { id: 'still-me', gesture: 'listen', listening: 'listen', text: 'Ya. Masih aku.', answer: 'Yang ini lebih aku kenal.' },
    { id: 'remember-this-one', gesture: 'listen', text: 'Kalau begitu, ingat yang ini.' },
  ],
};
