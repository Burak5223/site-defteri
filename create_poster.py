#!/usr/bin/env python3
"""
Akademik Proje Posteri Oluşturucu
A1 Boyut (594mm x 841mm = 23.4" x 33.1")
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

# Poster boyutları (300 DPI için)
WIDTH = 7016  # 594mm @ 300 DPI
HEIGHT = 9933  # 841mm @ 300 DPI

# Renkler
COLOR_PRIMARY = (0, 51, 102)  # Koyu mavi
COLOR_SECONDARY = (0, 153, 204)  # Açık mavi
COLOR_ACCENT = (255, 140, 0)  # Turuncu
COLOR_WHITE = (255, 255, 255)
COLOR_LIGHT_GRAY = (240, 240, 240)
COLOR_TEXT = (40, 40, 40)
COLOR_HEADER_BG = (0, 102, 204)

def create_poster():
    """Ana poster oluşturma fonksiyonu"""
    print("Poster oluşturuluyor...")
    
    # Beyaz arka plan
    poster = Image.new('RGB', (WIDTH, HEIGHT), COLOR_WHITE)
    draw = ImageDraw.Draw(poster)
    
    # Fontlar (sistem fontları kullanılacak)
    try:
        font_title = ImageFont.truetype("arial.ttf", 180)
        font_subtitle = ImageFont.truetype("arial.ttf", 100)
        font_header = ImageFont.truetype("arialbd.ttf", 140)
        font_subheader = ImageFont.truetype("arialbd.ttf", 90)
        font_text = ImageFont.truetype("arial.ttf", 70)
        font_small = ImageFont.truetype("arial.ttf", 60)
    except:
        print("⚠ Arial font bulunamadı, varsayılan font kullanılıyor")
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_header = ImageFont.load_default()
        font_subheader = ImageFont.load_default()
        font_text = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # HEADER BÖLÜMÜ
    header_height = 800
    draw.rectangle([0, 0, WIDTH, header_height], fill=COLOR_HEADER_BG)
    
    # Başlık
    title = "AKILLI SİTE YÖNETİM SİSTEMİ"
    title_bbox = draw.textbbox((0, 0), title, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    draw.text(((WIDTH - title_width) // 2, 150), title, fill=COLOR_WHITE, font=font_title)
    
    # Alt başlık
    subtitle = "Entegre Web, Mobil ve Süper Admin Platformu"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_subtitle)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    draw.text(((WIDTH - subtitle_width) // 2, 380), subtitle, fill=COLOR_LIGHT_GRAY, font=font_subtitle)
    
    # Öğrenci ve danışman bilgileri
    info_text = "[Öğrenci Adınız] | Danışman: [Danışman Adı] | Mayıs 2026"
    info_bbox = draw.textbbox((0, 0), info_text, font=font_small)
    info_width = info_bbox[2] - info_bbox[0]
    draw.text(((WIDTH - info_width) // 2, 600), info_text, fill=COLOR_WHITE, font=font_small)
    
    # İÇERİK BÖLÜMÜ
    y_pos = header_height + 100
    margin = 150
    col_width = (WIDTH - 3 * margin) // 2
    
    # SOL KOLON
    x_left = margin
    
    # ABSTRACT
    y_pos = draw_section(draw, "ÖZET", x_left, y_pos, col_width, font_header, font_text, [
        "Bu proje, apartman ve sitelerin tüm operasyonel",
        "süreçlerini dijitalleştiren kapsamlı bir platformdur.",
        "",
        "• 3 Platform: Mobil, Web, Süper Admin",
        "• Çoklu Site Yönetimi",
        "• 15+ Ana Modül",
        "• AI Destekli Kargo Tanıma",
        "• 40+ Veritabanı Tablosu"
    ], COLOR_PRIMARY)
    
    y_pos += 100
    
    # PROBLEM
    y_pos = draw_section(draw, "PROBLEM", x_left, y_pos, col_width, font_header, font_text, [
        "❌ Kağıt bazlı yönetim süreçleri",
        "❌ İletişim kopuklukları",
        "❌ Aidat takip zorlukları",
        "❌ Paket yönetimi karmaşıklığı",
        "❌ Finansal raporlama eksikliği",
        "❌ Personel koordinasyon sorunları"
    ], COLOR_ACCENT)
    
    y_pos += 100
    
    # ÇÖZÜM
    y_pos = draw_section(draw, "ÇÖZÜM", x_left, y_pos, col_width, font_header, font_text, [
        "✓ Tamamen dijital süreç yönetimi",
        "✓ Anlık bildirimler ve mesajlaşma",
        "✓ Otomatik aidat hesaplama",
        "✓ QR kod ile paket teslim",
        "✓ Detaylı finansal raporlama",
        "✓ Görev yönetimi ve takip"
    ], (0, 153, 0))
    
    y_pos += 100
    
    # TEKNOLOJİLER
    y_pos = draw_section(draw, "TEKNOLOJİLER", x_left, y_pos, col_width, font_header, font_text, [
        "Backend:",
        "• Java 17 + Spring Boot",
        "• MySQL 8.0",
        "• Firebase, Gemini AI",
        "",
        "Frontend:",
        "• Next.js 14 (React)",
        "• React Native + Expo",
        "• TypeScript"
    ], COLOR_PRIMARY)
    
    # SAĞ KOLON
    x_right = margin + col_width + margin
    y_pos = header_height + 100
    
    # SİSTEM MİMARİSİ
    y_pos = draw_section(draw, "SİSTEM MİMARİSİ", x_right, y_pos, col_width, font_header, font_text, [
        "┌─────────────────────┐",
        "│  KULLANICI KATMANI  │",
        "│  Mobil | Web | Admin│",
        "└─────────────────────┘",
        "          ↓",
        "┌─────────────────────┐",
        "│    API KATMANI      │",
        "│  Spring Boot + JWT  │",
        "└─────────────────────┘",
        "          ↓",
        "┌─────────────────────┐",
        "│  VERİTABANI (MySQL) │",
        "│     40+ Tablo       │",
        "└─────────────────────┘"
    ], COLOR_SECONDARY)
    
    y_pos += 100
    
    # TEMEL ÖZELLİKLER
    y_pos = draw_section(draw, "TEMEL ÖZELLİKLER", x_right, y_pos, col_width, font_header, font_text, [
        "👥 Sakin Yönetimi",
        "   Malik/Kiracı ayrımı, çoklu daire",
        "",
        "💰 Aidat Yönetimi",
        "   Otomatik oluşturma, online ödeme",
        "",
        "📦 Paket Yönetimi",
        "   QR kod, AI kargo tanıma",
        "",
        "🔧 Arıza/Talep Sistemi",
        "   Kategori bazlı, durum takibi",
        "",
        "🗳️ E-Oylama",
        "   Dijital oylama, sonuç grafikleri"
    ], COLOR_PRIMARY)
    
    y_pos += 100
    
    # SONUÇLAR
    y_pos = draw_section(draw, "SONUÇLAR", x_right, y_pos, col_width, font_header, font_text, [
        "✅ 3 platform başarıyla tamamlandı",
        "✅ 15+ modül çalışır durumda",
        "✅ AI entegrasyonu başarılı",
        "✅ %95+ API başarı oranı",
        "✅ <500ms response time",
        "✅ Güvenli ve ölçeklenebilir mimari"
    ], (0, 153, 0))
    
    # FOOTER
    footer_y = HEIGHT - 300
    draw.rectangle([0, footer_y, WIDTH, HEIGHT], fill=COLOR_PRIMARY)
    
    footer_text = "Adnan Menderes Üniversitesi | Bilgisayar Mühendisliği Bölümü | Bitirme Projesi 2026"
    footer_bbox = draw.textbbox((0, 0), footer_text, font=font_text)
    footer_width = footer_bbox[2] - footer_bbox[0]
    draw.text(((WIDTH - footer_width) // 2, footer_y + 100), footer_text, fill=COLOR_WHITE, font=font_text)
    
    # Posteri kaydet
    filename = "Akilli_Site_Yonetim_Sistemi_Poster.png"
    poster.save(filename, "PNG", dpi=(300, 300))
    print(f"\n✅ Poster başarıyla oluşturuldu: {filename}")
    print(f"📐 Boyut: {WIDTH}x{HEIGHT} pixels (A1 @ 300 DPI)")
    print(f"💾 Dosya boyutu: {os.path.getsize(filename) / (1024*1024):.2f} MB")
    print("\n💡 İpucu: Posteri yazdırmadan önce bir tasarım programında açıp")
    print("   ekran görüntüleri, grafikler ve logolar ekleyebilirsiniz!")

def draw_section(draw, title, x, y, width, font_header, font_text, lines, color):
    """Bölüm çizme yardımcı fonksiyonu"""
    # Başlık
    draw.text((x, y), title, fill=color, font=font_header)
    y += 180
    
    # Çizgi
    draw.rectangle([x, y, x + width, y + 5], fill=color)
    y += 50
    
    # İçerik
    for line in lines:
        draw.text((x, y), line, fill=COLOR_TEXT, font=font_text)
        y += 90
    
    return y + 50

if __name__ == "__main__":
    try:
        create_poster()
    except ImportError:
        print("❌ Hata: Pillow kütüphanesi bulunamadı!")
        print("\n📦 Kurulum için:")
        print("   pip install Pillow")
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")
