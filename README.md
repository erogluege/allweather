# AllWeather - Geçmiş Yıllarda Bugün Hava Nasıldı? 🌤️

**AllWeather**, herhangi bir günün saatlik tahminlerini sunmanın ötesine geçen, modern ve güçlü bir mobil cihaz odaklı web hava durumu (PWA) aplikasyonudur. Şahsi bir merak projesi olarak geliştirilmiştir ve tamamen ücretsiz/açık kaynak kodludur.

> Apple Weather'ın şık ve modern cam (glassmorphism) tasarım anlayışını hedeflerken, **"Geçmiş Yıllarda Bugün"** vizyonu ile de ön plana çıkmaktadır. Seçtiğiniz herhangi bir güne (örn: 15 Mart) girdiğinizde, Open-Meteo'nun Devasa Arşiv API'ını kullanarak sizi 1950 yılına kadar bir zaman yolculuğuna çıkartır. "Geçmişte bu tarihte hava nasıldı?" sorusuna %100 isabetli cevaplar verir.

## ✨ Özellikler

- **1950'ye Kadar Geçmiş İklim Hafızası:** Önümüzdeki 7 günün tahminine basarak, her bir günün son 75 yılında hava durumunun nasıl şekillendiğini (sıcaklıklar ve ikonlar ile birlikte) listeler.
- **Dinamik Çeviri (Auto-Localization):** Sisteminizdeki dil İngilizce ise İngilizce, Türkçe ise tamamen Türkçe tasarıma otomatize halde geçiş yapar.
- **Glassmorphism & UX:** Yumuşak köşeler, gece mavisi cam efektleri, sayfa aşağı indiğinde gizlenip küçülen dinamik başlık (Sticky Header) gibi zengin kullanıcı arayüzü dokunuşları.
- **Akıllı İkonlama Sistemi:** Rüzgarın hızı ve pusula açısına (Kuzeybatı vs) göre anlık yön değiştiren ikonlar. Matematiksel olarak hesaplanmış gerçekçi Ay evreleri (🌒 🌕 🌘 vb.) dahil!
- **IOS - Capacitor Entegrasyonu:** Kaynak kodların içinde Xcode'da direkt kurup Apple cihazınızda kendi native iOS uygulamanız olarak derleyebilmeniz için /ios paketi de bulunmaktadır.

## 📱 Nasıl Görüntüler ve Yüklerim? (PWA)

Projeyi hiçbir App Store sürecine sokmadan direkt kendi telefonunuza saniyeler içinde "native" bir uygulama gibi indirebilirsiniz:
1. Bu depo (Repository) herhangi bir Vercel, Netlify ya da Github Pages hizmetleriyle direkt olarak canlıya (yayına) alınabilir.
2. iPhone (Safari) üzerinden yayınladığınız URL'e girin.
3. Tarayıcının alt ortasındaki **"Paylaş"** ikonuna basın.
4. **"Ana Ekrana Ekle (Add to Home Screen)"** diyin! Artık telefonunuzda AllWeather ikonuyla duran tamamen bedava bir uygulamanız var! 

## 🛠️ Geliştirici Tarafı (Kendi Cihazında Açık Kaynak Çalıştırmak)

Vite tabanlı bu projeyi Node.js üzerinden hemen çalıştırabilirsiniz:

```bash
git clone https://github.com/erogluege/allweather.git
cd allweather
npm install
npm run dev
```

Eğer gerçek bir **Xcode (iOS)** projesine dönüştürüp kendi telefonunuza kabloyla derlemek isterseniz Capacitor aracılığıyla hazırlanan modülü güncelleyebilirsiniz:
```bash
npm run build
npx cap sync ios
npx cap open ios  # Mac'inizdeki Xcode'u başlatır.
```

---

*Tasarlandı ve kodlandı. - **Ege Eroglu***
