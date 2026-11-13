[README.md](https://github.com/user-attachments/files/34821192/README.md)
# 📖 LinguaWisdom Dictionary

İngilizce–Türkçe, **1266 kelimelik** akıllı sözlük. Türkçe anlamlar, IPA telaffuz, örnek cümleler, kategori filtreleri, "Günün Kelimesi", 10 soruluk **Quick Quiz** ve kelime kartını görsel olarak paylaşma özellikleriyle gelir.

Derleme adımı yoktur: saf HTML + CSS + JavaScript.

## Özellikler

- 🔎 Anlık arama (kelime veya sayı ile)
- 🗂️ Kategoriler: Günlük Yaşam, İş & Teknoloji, Seyahat & Kültür, Akademik, Kalıp İfadeler, Temel 417, Aylar & Sayılar, Ders Bilgisi (11. Sınıf, LGS)
- 🎲 Günün Kelimesi
- ⚡ Quick Quiz (en iyi sonuçlar cihazda saklanır)
- 🌙 Karanlık / aydınlık tema
- 🖼️ Kelime kartını PNG olarak paylaş / indir
- 📱 Mobil uyumlu, parça parça yüklenen liste

## Proje yapısı

```
.
├── index.html               # Sayfa iskeleti
├── css/style.css            # Özel stiller (tema, quiz, kartlar)
├── js/
│   ├── data.js              # Sözlük verisi (dictionaryData)
│   ├── app.js               # Arayüz ve uygulama mantığı
│   └── tailwind-config.js   # Tailwind renk / font ayarları
├── assets/
│   ├── fonts/               # Font Awesome alt kümesi (.woff)
│   └── img/hero-bg.jpg      # Hero arka planı
└── .github/workflows/pages.yml   # GitHub Pages otomatik yayın
```

## Yerelde çalıştırma

Dosyayı doğrudan tarayıcıda açabilirsiniz ya da basit bir sunucu kullanın:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## GitHub Pages ile yayınlama

1. Yeni bir repo oluşturun ve bu klasörün içeriğini yükleyin:
   ```bash
   git init
   git add .
   git commit -m "İlk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADI/lingua-wisdom.git
   git push -u origin main
   ```
2. Repo sayfasında **Settings → Pages → Build and deployment → Source** ayarını **GitHub Actions** yapın.
3. `main` dalına her push'ta site otomatik yayınlanır:
   `https://KULLANICI_ADI.github.io/lingua-wisdom/`

> Alternatif: Source olarak "Deploy from a branch → main / (root)" seçerseniz workflow dosyasına gerek kalmaz.

## Kelime ekleme

`js/data.js` içindeki diziye yeni bir nesne ekleyin (`id` benzersiz olmalı):

```js
{
  id: 1267,
  word: "Example",
  type: "noun",
  ipa: "/ɪɡˈzɑːm.pəl/",
  turkish: "Örnek",
  exampleEn: "This is an example.",
  exampleTr: "Bu bir örnektir.",
  category: "daily"
}
```

Geçerli kategoriler: `daily`, `business`, `travel`, `academic`, `idioms`, `basic200`, `monthsnum`, `grade11`, `lgs`.
Bir kelimeyi birden çok kategoride göstermek için `also: ["academic"]` alanını kullanabilirsiniz.

## Notlar

- Tailwind CSS ve Plus Jakarta Sans yazı tipi CDN üzerinden yüklenir, ilk açılışta internet gerekir.
- Tema tercihi ve quiz sonuçları tarayıcının `localStorage` alanında tutulur.

## Lisans

[MIT](LICENSE)
