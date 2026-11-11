# Snake & Dare: Roll Your Fate

Ular tangga yang dicampur kartu jujur dan tantangan, buat dimainkan bareng di satu layar. Dua sampai enam orang, satu ponsel atau komputer. Tidak perlu akun dan tidak ada server: pertandingan tersimpan di peramban.

Bahasa yang muncul pertama kali adalah **Indonesia**. Inggris tetap ada di tombol bahasa.

A local snakes-and-ladders party game with honesty and challenge cards. Two to six people share one device. The match never leaves the browser.

## Cara menjalankan

Butuh Node.js 22.

```bash
npm install
npm run dev
```

Buka alamat yang dicetak Vite. Server pengembangan di proyek ini memakai porta **43123**.

Perintah lain:

```bash
npm test          # uji aturan permainan
npm run build     # periksa tipe, lalu bangun berkas statis
npm run preview   # sajikan hasil build
```

## Cara main, singkat

- Kotak 1 ada di kiri bawah. Nomor berjalan zig-zag sampai kotak terakhir.
- Satu lemparan tiap giliran. Tombol terkunci sampai bidak selesai berjalan.
- Tangga naik, ular turun. Perisai menahan satu ular.
- Menang hanya kalau mendarat pas di kotak terakhir. Lemparan yang kelewat hangus.
- Kartu tidak diulang sampai kelompoknya habis. Ada minimal 300 kartu jujur dan 300 tantangan, enam puluh atau lebih di tiap set: Lucu, Teman, Berdua, Keluarga, dan Campur.
- Poin hanya bonus. Yang menang tetap yang sampai duluan.
- Lewati kartu selalu boleh. Suara baru berbunyi setelah kamu mengetuk layar.

### Papan

100 kotak memakai jalur klasik: tangga 3→22, 8→30, 20→41, 28→55, 44→63, 71→92 dan ular 27→5, 39→17, 58→34, 67→49, 83→61, 97→76.

50 kotak lebih singkat: tangga 2→18, 8→26, 14→32, 21→39, 33→48 dan ular 16→4, 24→7, 36→19, 44→22, 47→29.

## Deploy ke Vercel

Aplikasi ini build statis Vite. Hasilnya folder `dist`. Tidak ada variabel rahasia.

1. Buka [vercel.com/new](https://vercel.com/new) dan impor repositori ini.
2. Framework preset: **Vite**.
3. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. `vercel.json` mengarahkan jalur yang tidak dikenal ke `index.html`, jadi penyegaran halaman tetap membuka permainan.

Dari terminal, setelah `npx vercel login`:

```bash
npx vercel
```

### Netlify

`netlify.toml` sudah mengatur build `npm run build`, folder terbit `dist`, dan fallback untuk aplikasi satu halaman.

## Isi proyek

`src/game` memegang aturan (papan, kartu, giliran) tanpa React. `src/components` dan `src/pages` adalah tampilan 2D. `src/store/gameStore.ts` menyimpan pertandingan dan memainkan animasi. Uji ada di `src/game/logic.test.ts`.

## Tumpukan

React, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, Lucide, Web Audio, LocalStorage. Papan digambar dengan HTML dan SVG. Tidak ada WebGL dan tidak ada 3D.
