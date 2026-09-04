import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AISkill, GeneratedQuestion } from '../types/aiGenerator.types';
import { aiGeneratorApi } from '../api/aiGeneratorApi';
import { PromptPreview } from './PromptPreview';
import { AIResultCard } from './AIResultCard';
import { Input } from '../../../components/shared/Input';
import { Button } from '../../../components/shared/Button';
import { Badge } from '../../../components/shared/Badge';
import { Modal } from '../../../components/shared/Modal';
import { questionsApi } from '../../questions/api/questionsApi';
import { Sparkles, Library, Save, HelpCircle, FileSpreadsheet, Clock, Cpu, Image as ImageIcon, Search, ChevronDown, Check, X, Package } from 'lucide-react';

const DEFAULT_BINDO_MATERI_OPTIONS = [
  'Teks Puisi',
  'Teks Dongeng & Cerita Rakyat',
  'Teks Cerpen & Fabel',
  'Teks Berita & Eksplanasi',
  'Teks Editorial & Opini',
  'Teks Artikel Ilmiah Populer',
  'Teks Drama & Dialog',
  'Teks Biografi Tokoh',
  'Teks Laporan Observasi (LHO)',
  'Teks Eksplanasi Fenomena Alam',
  'Teks Eksposisi Lingkungan Hidup',
  'Teks Prosedur Kompleks',
  'Teks Negosiasi & Diskusi',
];

const DEFAULT_KIMIA_MATERI_OPTIONS = [
  'Kimia Dasar – Struktur Atom dan Sistem Periodik Unsur',
  'Kimia Dasar – Ikatan Kimia dan Bentuk Molekul',
  'Kimia Dasar – Stoikiometri dan Hukum Dasar Kimia',
  'Kimia Analitik – Larutan Asam Basa dan pH',
  'Kimia Analitik – Larutan Penyangga (Buffer) dan Hidrolisis',
  'Kimia Analitik – Titrasi Asam Basa dan Stoikiometri Larutan',
  'Kimia Fisik – Termokimia dan Perubahan Entalpi',
  'Kimia Fisik – Laju Reaksi dan Faktor yang Mempengaruhi',
  'Kimia Fisik – Kesetimbangan Kimia dan Pergeseran Le Chatelier',
  'Kimia Fisik – Elektrokimia, Sel Volta dan Elektrolisis',
  'Kimia Organik – Hidrokarbon (Alkana, Alkena, Alkuna)',
  'Kimia Organik – Gugus Fungsi dan Reaksi Senyawa Karbon',
];

const DEFAULT_FISIKA_MATERI_OPTIONS = [
  'Kinematika – Gerak Lurus (Analisis Grafik GLB & GLBB)',
  'Kinematika – Gerak Lengkung (Parabola & Gerak Melingkar Beraturan)',
  'Dinamika – Hubungan Gaya dan Gerak (Hukum Newton & Diagram Gaya)',
  'Dinamika – Momentum, Impuls & Tumbukan Sehari-hari',
  'Dinamika – Dinamika Rotasi & Momen Inersia/Torsi',
  'Fluida – Fluida Statis (Hukum Pascal & Archimedes)',
  'Fluida – Fluida Dinamis (Kontinuitas & Asas Bernoulli)',
  'Gelombang – Gelombang Bunyi (Efek Doppler & Intensitas)',
  'Kalor dan Termodinamika – Perpindahan Kalor & Asas Black',
  'Kalor dan Termodinamika – Gas Ideal & Siklus Termodinamika',
  'Kelistrikan – Rangkaian Listrik Arus Searah (Hukum Kirchhoff)',
  'Kinematika – Pengukuran Besaran Fisis & Angka Penting',
];

const DEFAULT_BIOLOGI_MATERI_OPTIONS = [
  'Keanekaragaman Hayati – Klasifikasi & Keanekaragaman Fauna/Flora Indonesia',
  'Keanekaragaman Hayati – Bakteri (Struktur Sel & Peranannya bagi Manusia)',
  'Keanekaragaman Hayati – Ekosistem (Interaksi Antarkomponen & Keseimbangan Lingkungan)',
  'Sel – Metabolisme Sel (Cara Kerja Enzim & Faktor Lingkungan)',
  'Sel – Katabolisme & Anabolisme (Respirasi Seluler & Fotosintesis)',
  'Proses Makhluk Hidup – Sistem Sirkulasi (Struktur Jantung & Pembuluh Darah)',
  'Proses Makhluk Hidup – Sistem Respirasi (Mekanisme Pertukaran Gas Alveolus)',
  'Proses Makhluk Hidup – Sistem Ekskresi (Struktur Nefron Ginjal & Pembentukan Urine)',
  'Proses Makhluk Hidup – Sistem Koordinasi (Mekanisme Penghantaran Impuls Saraf)',
  'Proses Makhluk Hidup – Sistem Imun (Respon Kekebalan Spesifik & Nonspesifik)',
  'Proses Makhluk Hidup – Sistem Reproduksi (Siklus Menstruasi & Spermatogenesis)',
  'Keterampilan Proses – Perancangan Eksperimen & Analisis Data Biologi',
];

const DEFAULT_MTK_MATERI_OPTIONS = [
  'Aljabar – Fungsi Komposisi dan Invers',
  'Aljabar – Barisan dan Deret Aritmetika/Geometri',
  'Aljabar – Sistem Persamaan Linear Tiga Variabel (SPLTV)',
  'Aljabar – Program Linear dan Pertidaksamaan',
  'Geometri – Dimensi Tiga dan Jarak Objek Geometri',
  'Geometri – Transformasi Geometri (Translasi, Rotasi, Dilatasi)',
  'Geometri – Luas dan Volume Bangun Ruang',
  'Trigonometri – Perbandingan Trigonometri Segitiga Siku-siku',
  'Trigonometri – Aturan Sinus dan Cosinus',
  'Data dan Peluang – Ukuran Pemusatan & Penyebaran Data',
  'Data dan Peluang – Kaidah Pencacahan, Permutasi & Kombinasi',
  'Data dan Peluang – Peluang Kejadian Majemuk',
  'Bilangan – Eksponen, Bentuk Akar dan Logaritma',
];

const DEFAULT_MTK_LANJUT_MATERI_OPTIONS = [
  'Aljabar – Matriks (Determinan & Invers 2x2/3x3)',
  'Aljabar – Polinomial & Teorema Sisa/Faktor',
  'Aljabar – Fungsi Eksponen & Logaritma Lanjut',
  'Aljabar – Fungsi Rasional & Asimtot Kurva',
  'Geometri dan Pengukuran – Vektor pada Bidang dan Ruang',
  'Geometri dan Pengukuran – Persamaan & Garis Singgung Lingkaran',
  'Geometri dan Pengukuran – Transformasi Geometri dengan Matriks',
  'Trigonometri – Limit Fungsi Aljabar Mendekati Titik & Tak Hingga',
  'Trigonometri – Limit Fungsi Trigonometri Dasar & Lanjut',
  'Aljabar – Pemodelan Matriks & Program Linear Kompleks',
  'Geometri dan Pengukuran – Komposisi Transformasi Titik/Garis/Kurva',
  'Aljabar – Sifat Akar-Akar Polinomial Orde 3 dan 4',
];

const DEFAULT_BING_MATERI_OPTIONS = [
  'Pemahaman Inferensial – Analytical Exposition (Ide Pokok)',
  'Pemahaman Tekstual – Descriptive Text (Informasi Rinci)',
  'Pemahaman Inferensial – Narrative Text (Sebab-Akibat & Moral)',
  'Pemahaman Tekstual – Procedure Text (Langkah & Urutan)',
  'Evaluasi dan Apresiasi – Analytical Exposition (Fakta vs Opini)',
  'Pemahaman Inferensial – Recount Text (Pengalaman & Kronologis)',
  'Evaluasi dan Apresiasi – Descriptive Text (Tujuan Komunikatif)',
  'Pemahaman Tekstual – Recount Text (Biografi Tokoh)',
  'Evaluasi dan Apresiasi – Narrative Text (Karakter Tokoh & Plot)',
  'Pemahaman Inferensial – Procedure Text (Maksud & Tujuan Alat)',
  'Pemahaman Tekstual – Analytical Exposition (Sintesis Argumen)',
  'Evaluasi dan Apresiasi – Berita & Artikel Ilmiah Populer',
];

const DEFAULT_BING_LANJUT_MATERI_OPTIONS = [
  'Pemahaman Inferensial – Exposition: Sudut Pandang Penulis & Tujuan',
  'Pemahaman Inferensial – Discussion: Analisis Argumen Pro & Kontra',
  'Evaluasi dan Apresiasi – Exposition: Menilai Kekuatan & Logika Argumen',
  'Evaluasi dan Apresiasi – Discussion: Menilai Fakta vs Opini & Kredibilitas',
  'Pemahaman Tekstual – Exposition: Menemukan Gagasan Utama & Bukti Eksplisit',
  'Pemahaman Inferensial – Discussion: Hubungan Sebab-Akibat & Implikasi Kebijakan',
  'Evaluasi dan Apresiasi – Exposition: Menanggapi Teks & Validitas Informasi',
  'Pemahaman Tekstual – Discussion: Klasifikasi Argumen & Poin Kunci',
  'Pemahaman Inferensial – Exposition: Memprediksi Implikasi Teknologi Masa Depan',
  'Pemahaman Tekstual – Exposition: Meringkas Struktur Argumen Kunci',
  'Evaluasi dan Apresiasi – Discussion: Sintesis Dua Sudut Pandang yang Berseberangan',
  'Pemahaman Inferensial – Discussion: Menyimpulkan Sikap Objektif Penulis',
];

const DEFAULT_BINDO_LANJUT_MATERI_OPTIONS = [
  'Pemahaman Tekstual – Teks Informasi Akademik & Dunia Kerja',
  'Pemahaman Inferensial – Sastra Melayu Klasik (Hikayat & Syair)',
  'Pemahaman Inferensial – Nilai Kehidupan Sastra Modern & Terjemahan',
  'Evaluasi dan Apresiasi – Evaluasi Antarteks (Komparasi Gagasan)',
  'Evaluasi dan Apresiasi – Penilaian Logika Berpikir & Fakta vs Opini',
  'Pemahaman Inferensial – Kohesi dan Koherensi Teks Ilmiah',
  'Pemahaman Inferensial – Konversi Informasi Tabel/Grafik ke Uraian',
  'Evaluasi dan Apresiasi – Alih Wahana Puisi ke Prosa',
  'Evaluasi dan Apresiasi – Respon Estetis & Nilai Moral Tokoh',
  'Pemahaman Tekstual – Pengajuan Usulan & Solusi Dunia Kerja',
  'Pemahaman Inferensial – Ketepatan Penggunaan Kiasan & Citraan',
  'Pemahaman Tekstual – Teks Fiksi Realisme & Absurd',
];

const DEFAULT_PPKN_MATERI_OPTIONS = [
  'Pancasila – Demokrasi Pancasila & Nilai-Nilai Dasar Negara',
  'UUD NRI Tahun 1945 – Kewenangan Lembaga Negara & Penegakan Hukum',
  'Bhinneka Tunggal Ika – Harmoni Keberagaman & Gotong Royong sebagai Modal Sosial',
  'Negara Kesatuan Republik Indonesia – Wawasan Nusantara & Sistem Pertahanan Keamanan',
  'Pancasila – Solusi Permasalahan Kebangsaan & Identitas Nasional',
  'UUD NRI Tahun 1945 – Hubungan Pemerintah Pusat-Daerah & Hak Kewajiban Warga Negara',
  'Bhinneka Tunggal Ika – Mengelola Kebinekaan & Mengatasi Ancaman Disintegrasi',
  'Negara Kesatuan Republik Indonesia – Peran Indonesia dalam Perdamaian Dunia & Demokrasi',
];

const DEFAULT_EKONOMI_MATERI_OPTIONS = [
  'Ekonomi Mikro dan Makro – Permintaan, Penawaran, dan Keseimbangan Pasar',
  'Ekonomi Mikro dan Makro – Indeks Harga dan Inflasi',
  'Akuntansi Keuangan Dasar – Persamaan Dasar Akuntansi',
  'Ekonomi Internasional – Perdagangan Internasional & Neraca Pembayaran',
  'Ekonomi Mikro dan Makro – Pendapatan Nasional & Pertumbuhan Ekonomi',
  'Ekonomi Mikro dan Makro – Bank Sentral & Kebijakan Moneter',
  'Konsep Dasar Ilmu Ekonomi – Kelangkaan & Biaya Peluang',
  'Akuntansi Keuangan Dasar – Laporan Keuangan Perusahaan Jasa dan Dagang',
  'Ekonomi Mikro dan Makro – Kebijakan Fiskal dan Perpajakan',
  'Ekonomi Mikro dan Makro – Ketenagakerjaan & Permasalahannya',
  'Ekonomi Mikro dan Makro – Manajemen Badan Usaha & Koperasi',
];

const DEFAULT_GEOGRAFI_MATERI_OPTIONS = [
  'Wilayah Tempat Tinggal dan Lingkungan Sekitar – Karakteristik Fisik & Sosial Wilayah',
  'Wilayah Tempat Tinggal dan Lingkungan Sekitar – Dinamika Kependudukan & Piramida Penduduk',
  'Proses yang Memengaruhi Lingkungan Fisik dan Sosial – Peranan Manusia dalam Perubahan Lingkungan Fisik',
  'Proses yang Memengaruhi Lingkungan Fisik dan Sosial – Persebaran Bioma Dunia & Pengaruhnya',
  'Interaksi Antargejala Fisik Alam dan Manusia – Posisi Strategis Indonesia & Pengaruh Sosial-Ekonomi',
  'Interaksi Antargejala Fisik Alam dan Manusia – Potensi & Pengelolaan SDA Berkelanjutan',
  'Mitigasi dan Adaptasi Bencana Alam – Karakteristik & Mitigasi Bencana Geologis',
  'Mitigasi dan Adaptasi Bencana Alam – Mitigasi & Adaptasi Bencana Hidroklimatologis',
  'Fenomena Geografi Sehari-hari – Interpretasi Citra Penginderaan Jauh & SIG',
  'Fenomena Geografi Sehari-hari – Peta Tematik & Analisis Keruangan (Spatial Analysis)',
];

const DEFAULT_SOSIOLOGI_MATERI_OPTIONS = [
  'Hubungan dan Gejala Sosial – Bentuk Interaksi Sosial & Masyarakat Multikultural',
  'Kelompok Sosial, Kesetaraan, dan Konflik Sosial – Konflik Sosial dan Penanganan Konflik',
  'Perubahan Sosial dan Globalisasi – Globalisasi dan Dampak Globalisasi',
  'Kelompok Sosial, Kesetaraan, dan Konflik Sosial – Stratifikasi & Ketidaksetaraan Sosial',
  'Penelitian Sosial – Metode Penelitian Sosial & Interpretasi Data Survei',
  'Perubahan Sosial dan Globalisasi – Sikap Kritis terhadap Globalisasi & Kearifan Lokal',
  'Sosiologi sebagai Ilmu – Ciri-Ciri & Manfaat Sosiologi dalam Pemecahan Masalah Sosial',
  'Hubungan dan Gejala Sosial – Pembentukan Kepribadian & Peran Lembaga Sosial',
  'Kelompok Sosial, Kesetaraan, dan Konflik Sosial – Dinamika Kelompok Sosial & Partikularisme',
  'Perubahan Sosial dan Globalisasi – Bentuk & Teori Perubahan Sosial',
];

const DEFAULT_SEJARAH_MATERI_OPTIONS = [
  'Pergerakan Nasional sampai Proklamasi Kemerdekaan – Peristiwa dan Makna Proklamasi',
  'Revolusi Kemerdekaan sampai Demokrasi Terpimpin – Perjuangan Mempertahankan Kemerdekaan',
  'Perlawanan terhadap Bangsa Eropa – Kebijakan Kolonial & Perlawanan Rakyat Nusantara',
  'Periode Kerajaan Hindu-Buddha dan Islam – Masuknya Kebudayaan & Kehidupan Politik-Ekonomi',
  'Orde Baru sampai Reformasi – Kronologi Lahirnya Reformasi & Peran Mahasiswa',
  'Pengantar Ilmu Sejarah – Konsep Dasar Sejarah (Diakronik, Sinkronik, Perubahan & Keberlanjutan)',
  'Pergerakan Nasional sampai Proklamasi Kemerdekaan – Politik Etis & Organisasi Pergerakan Nasional',
  'Revolusi Kemerdekaan sampai Demokrasi Terpimpin – Kehidupan Politik Masa Demokrasi Liberal & Terpimpin',
  'Orde Baru sampai Reformasi – Kehidupan Masyarakat & Kebijakan Masa Orde Baru',
  'Perlawanan terhadap Bangsa Eropa – Proses Kedatangan Bangsa Barat & Monopoli VOC',
];

const DEFAULT_ANTROPOLOGI_MATERI_OPTIONS = [
  'Etnografi – Metode dan Proses Penelitian Etnografi (Observasi Partisipatif)',
  'Kearifan Lokal dan Tradisi Lisan – Peran Kearifan Lokal dalam Pengelolaan Lingkungan',
  'Masyarakat Multikultural – Keberagaman Budaya & Integrasi Nasional',
  'Perubahan Sosial Budaya – Akulturasi, Asimilasi, dan Respon Masyarakat',
  'Antropologi Sosial dan Antropologi Budaya – Sistem Kekerabatan & Antropologi Terapan',
  'Pengantar dan Ruang Lingkup Antropologi – Prinsip Dasar (Emik, Etik, Relativisme Budaya)',
  'Kearifan Lokal dan Tradisi Lisan – Jenis & Fungsi Tradisi Lisan di Era Modern',
  'Masyarakat Multikultural – Tantangan Etnosentrisme, Prasangka, & Multikulturalisme',
  'Etnografi – Penerapan Berpikir Etnografis dalam Kehidupan Sehari-hari',
  'Pengantar dan Ruang Lingkup Antropologi – Tujuh Unsur Kebudayaan Universal & Wujud Budaya',
];

const DEFAULT_PKWU_MATERI_OPTIONS = [
  'Kegiatan Produksi, Pemasaran, dan Distribusi – Perencanaan Produksi & Biaya (HPP & BEP)',
  'Kegiatan Produksi, Pemasaran, dan Distribusi – Pemasaran Produk (Marketing Mix & Digital Marketing)',
  'Pengelolaan Usaha – Hak atas Kekayaan Intelektual (HaKI)',
  'Kegiatan Produksi, Pemasaran, dan Distribusi – Pengembangan Desain & Kemasan Produk',
  'Pengelolaan Usaha – Pelaporan Keuangan (Laba Rugi & Arus Kas)',
  'Pengelolaan Usaha – Analisis Peluang Usaha (SWOT & BMC)',
  'Kegiatan Produksi, Pemasaran, dan Distribusi – Pengendalian Mutu Produk (Quality Assurance)',
  'Pengelolaan Usaha – Proposal Usaha & Studi Kelayakan Bisnis',
  'Kegiatan Produksi, Pemasaran, dan Distribusi – Saluran Distribusi & Rantai Pasok',
  'Kegiatan Produksi, Pemasaran, dan Distribusi – Pengembangan Prototipe & Proses Produksi',
];

const DEFAULT_PRANCIS_MATERI_OPTIONS = [
  'Pemahaman Literal – Pemberitahuan & Pengumuman (messages courts et annonces)',
  'Pemahaman Literal – Perkenalan Diri & Aktivitas Sehari-hari (se présenter, la vie quotidienne)',
  'Pemahaman Inferensial – Deskripsi Orang dan Tempat (description de personnes et de lieux)',
  'Pemahaman Literal – Instruksi Tanda dan Rambu (panneaux, signes)',
  'Pemahaman Inferensial – Menyatakan Opini & Kesimpulan (donner des opinions)',
  'Reorganisasi – Aktivitas Sehari-hari & Pengumuman (la vie quotidienne)',
  'Pemahaman Literal – Kosakata Angka, Jam, dan Tanggal (les nombres, l\'heure, la date)',
  'Pemahaman Literal – Melengkapi Teks Rumpang (texte à trous)',
  'Pemahaman Inferensial – Keberadaan Orang dan Benda (se situer dans l\'espace)',
  'Pemahaman Literal – Ungkapan Salam, Berpamitan, dan Harapan (salutations et souhaits)',
];

const DEFAULT_JERMAN_MATERI_OPTIONS = [
  'Pemahaman Literal – Identitas diri (Identität)',
  'Pemahaman Literal – Kehidupan sekolah (Schulleben)',
  'Pemahaman Literal – Keluarga (Familien)',
  'Pemahaman Literal – Tempat tinggal (Wohnen)',
  'Pemahaman Literal – Aktivitas waktu luang (Freizeitaktivitäten)',
  'Pemahaman Literal – Pekerjaan dan profesi (Berufe)',
  'Pemahaman Literal – Makanan dan minuman (Essen und Trinken)',
  'Pemahaman Literal – Berbelanja (Einkaufen)',
  'Pemahaman Literal – Perjalanan & Jadwal (Reisen & Fahrplan)',
  'Pemahaman Inferensial – Kehidupan sekolah (Schulleben)',
  'Pemahaman Inferensial – Aktivitas waktu luang (Freizeitaktivitäten)',
  'Pemahaman Inferensial – Perjalanan (Reisen)',
  'Pemahaman Inferensial – Tempat tinggal (Wohnen)',
  'Reorganisasi – Aktivitas harian & Sekolah (Tagesablauf & Schulleben)',
  'Reorganisasi – Rencana perjalanan (Reiseprogramm)',
];

const DEFAULT_JEPANG_MATERI_OPTIONS = [
  'Pemahaman Literal – Persalaman (aisatsu)',
  'Pemahaman Literal – Perkenalan diri (jikoshoukai)',
  'Pemahaman Literal – Waktu dan jam (jikan)',
  'Pemahaman Literal – Keluarga (kazoku)',
  'Pemahaman Literal – Kemampuan (dekirukoto)',
  'Pemahaman Literal – Kehidupan sekolah (gakkou no seikatsu)',
  'Pemahaman Literal – Rumah dan ruangan (uchi)',
  'Pemahaman Literal – Kehidupan sehari-hari (mainichi no seikatsu)',
  'Pemahaman Literal – Hobi dan kegemaran (shumi)',
  'Pemahaman Literal – Waktu senggang (himana toki)',
  'Pemahaman Inferensial – Kehidupan sekolah (gakkou no seikatsu)',
  'Pemahaman Inferensial – Hobi dan kegiatan (shumi)',
  'Pemahaman Inferensial – Bentuk lampau dan negasi (masen / mashita)',
  'Reorganisasi – Pola kalimat dasar SOP (Subjek-Objek-Predikat)',
  'Reorganisasi – Jadwal kegiatan sehari-hari (mainichi no seikatsu)',
];

const DEFAULT_KOREA_MATERI_OPTIONS = [
  'Pemahaman Literal – Salam (인사)',
  'Pemahaman Literal – Perkenalan diri (자기 소개)',
  'Pemahaman Literal – Belanja (쇼핑)',
  'Pemahaman Literal – Hobi (취미)',
  'Pemahaman Literal – Transportasi (교통)',
  'Pemahaman Literal – Cuaca (날씨)',
  'Pemahaman Literal – Kehidupan sehari-hari (일상생활)',
  'Pemahaman Literal – Kehidupan keluarga (가족생활)',
  'Pemahaman Literal – Wisata (여행)',
  'Pemahaman Literal – Kehidupan sekolah (학교활동)',
  'Pemahaman Inferensial – Kehidupan sekolah (학교활동)',
  'Pemahaman Inferensial – Hobi dan kegiatan (취미)',
  'Pemahaman Inferensial – Bentuk negasi dan kala lampau/akan datang (안, 못, -았/었어요, -(으)ㄹ 거예요)',
  'Reorganisasi – Pola susunan kalimat dasar (문장 구성)',
  'Reorganisasi – Jadwal dan rencana kegiatan (일정 및 계획)',
];

const DEFAULT_ARAB_MATERI_OPTIONS = [
  'Pemahaman Literal – Kehidupan sehari-hari (الحياة اليومية)',
  'Pemahaman Literal – Kehidupan sekolah (الحياة المدرسية)',
  'Pemahaman Literal – Kehidupan keluarga (الحياة الأسرية)',
  'Pemahaman Literal – Hobi dan kegemaran (الهواية)',
  'Pemahaman Literal – Pekerjaan dan profesi (المهنة)',
  'Pemahaman Literal – Pelayanan umum (المرافق العامة)',
  'Pemahaman Literal – Lingkungan sekitar (البيئة)',
  'Pemahaman Literal – Sinonim dan Antonim kata (المرادف والضد)',
  'Pemahaman Inferensial – Dialog ungkapan persetujuan (الموافقة)',
  'Pemahaman Inferensial – Dialog ungkapan perintah (الأمر)',
  'Pemahaman Inferensial – Dialog ungkapan larangan (النهي)',
  'Pemahaman Inferensial – Makna teks berbasis kaidah Nahwu dan Sharf (النحو والصرف)',
  'Reorganisasi – Menyusun kosakata acak menjadi kalimat padu (ترتيب الكلمات)',
  'Reorganisasi – Mengurutkan kalimat acak menjadi teks sederhana (ترتيب الجمل)',
];

export const GeneratePanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [skills, setSkills] = useState<AISkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<AISkill | null>(null);
  
  // Searchable Skill Selector States
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const skillDropdownRef = useRef<HTMLDivElement>(null);
  const skillSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(event.target as Node)) {
        setIsSkillDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSkillDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isSkillDropdownOpen && skillSearchInputRef.current) {
      skillSearchInputRef.current.focus();
    }
  }, [isSkillDropdownOpen]);

  const filteredSkills = skills.filter(s => {
    const q = skillSearchQuery.toLowerCase();
    return s.namaSkill.toLowerCase().includes(q) || s.subtes.toLowerCase().includes(q);
  });
  
  // Form States
  const [subtes, setSubtes] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  // Difficulty States
  const [difficultyMode, setDifficultyMode] = useState<'distribution' | 'single'>('distribution');
  const [singleDifficulty, setSingleDifficulty] = useState<'EASY' | 'MEDIUM' | 'HOTS'>('MEDIUM');
  const [diffEasy, setDiffEasy] = useState(30);
  const [diffMedium, setDiffMedium] = useState(50);
  const [diffHots, setDiffHots] = useState(20);

  // Type Distribution States
  const [selectedTypes, setSelectedTypes] = useState<Array<'PG' | 'PGK' | 'BS' | 'ISIAN'>>(['PG', 'PGK', 'BS']);
  const [typeCompMode, setTypeCompMode] = useState<'even' | 'tka' | 'custom'>('even');
  const [typesAlloc, setTypesAlloc] = useState<Record<string, number>>({
    PG: 34,
    PGK: 33,
    BS: 33,
    ISIAN: 0,
  });

  const [reuseStimulus, setReuseStimulus] = useState(true);
  const [questionsPerStimulus, setQuestionsPerStimulus] = useState(5);
  const [jumlah, setJumlah] = useState(30);
  const [selectedModel, setSelectedModel] = useState('stubia-v.1');
  const [includeImagePrompts, setIncludeImagePrompts] = useState(false);

  // Number of stimuli calculated from jumlah and questionsPerStimulus
  const stimulusCount = reuseStimulus && jumlah >= 2
    ? Math.ceil(jumlah / questionsPerStimulus)
    : Math.max(1, jumlah);

  const subtesLower = (subtes || selectedSkill?.subtes || '').toLowerCase();
  const isKimiaSubtest = subtesLower.includes('kimia');
  const isFisikaSubtest = subtesLower.includes('fisika');
  const isBiologiSubtest = subtesLower.includes('biologi');
  const isPpknSubtest = subtesLower.includes('ppkn') || subtesLower.includes('pancasila');
  const isEkonomiSubtest = subtesLower.includes('ekonomi');
  const isGeografiSubtest = subtesLower.includes('geografi');
  const isSosiologiSubtest = subtesLower.includes('sosiologi');
  const isSejarahSubtest = subtesLower.includes('sejarah');
  const isAntropologiSubtest = subtesLower.includes('antropologi');
  const isPkwuSubtest = subtesLower.includes('pkwu') || subtesLower.includes('kewirausahaan');
  const isPrancisSubtest = subtesLower.includes('prancis') || subtesLower.includes('francais');
  const isJermanSubtest = subtesLower.includes('jerman') || subtesLower.includes('german') || subtesLower.includes('deutsch');
  const isJepangSubtest = subtesLower.includes('jepang') || subtesLower.includes('japanese') || subtesLower.includes('nihongo');
  const isKoreaSubtest = subtesLower.includes('korea') || subtesLower.includes('korean') || subtesLower.includes('hangul') || subtesLower.includes('hangugeo');
  const isArabSubtest = subtesLower.includes('arab') || subtesLower.includes('arabic');
  const isBindoLanjutSubtest = subtesLower.includes('indo') && (subtesLower.includes('lanjut') || subtesLower.includes('tingkat lanjut'));
  const isMtkLanjutSubtest = subtesLower.includes('matematika') && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
  const isMtkSubtest = subtesLower.includes('matematika') && !isMtkLanjutSubtest;
  const isBingLanjutSubtest = (subtesLower.includes('inggris') || subtesLower.includes('english')) && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
  const isBingSubtest = (subtesLower.includes('inggris') || subtesLower.includes('english')) && !isBingLanjutSubtest;

  const getActiveMateriOptions = () => {
    if (isKimiaSubtest) return DEFAULT_KIMIA_MATERI_OPTIONS;
    if (isFisikaSubtest) return DEFAULT_FISIKA_MATERI_OPTIONS;
    if (isBiologiSubtest) return DEFAULT_BIOLOGI_MATERI_OPTIONS;
    if (isPpknSubtest) return DEFAULT_PPKN_MATERI_OPTIONS;
    if (isEkonomiSubtest) return DEFAULT_EKONOMI_MATERI_OPTIONS;
    if (isGeografiSubtest) return DEFAULT_GEOGRAFI_MATERI_OPTIONS;
    if (isSosiologiSubtest) return DEFAULT_SOSIOLOGI_MATERI_OPTIONS;
    if (isSejarahSubtest) return DEFAULT_SEJARAH_MATERI_OPTIONS;
    if (isAntropologiSubtest) return DEFAULT_ANTROPOLOGI_MATERI_OPTIONS;
    if (isPkwuSubtest) return DEFAULT_PKWU_MATERI_OPTIONS;
    if (isPrancisSubtest) return DEFAULT_PRANCIS_MATERI_OPTIONS;
    if (isJermanSubtest) return DEFAULT_JERMAN_MATERI_OPTIONS;
    if (isJepangSubtest) return DEFAULT_JEPANG_MATERI_OPTIONS;
    if (isKoreaSubtest) return DEFAULT_KOREA_MATERI_OPTIONS;
    if (isArabSubtest) return DEFAULT_ARAB_MATERI_OPTIONS;
    if (isMtkLanjutSubtest) return DEFAULT_MTK_LANJUT_MATERI_OPTIONS;
    if (isMtkSubtest) return DEFAULT_MTK_MATERI_OPTIONS;
    if (isBingLanjutSubtest) return DEFAULT_BING_LANJUT_MATERI_OPTIONS;
    if (isBingSubtest) return DEFAULT_BING_MATERI_OPTIONS;
    if (isBindoLanjutSubtest) return DEFAULT_BINDO_LANJUT_MATERI_OPTIONS;
    return DEFAULT_BINDO_MATERI_OPTIONS;
  };

  // Materi States (Per-Stimulus allocation)
  const [materiMode, setMateriMode] = useState<'default' | 'custom'>('default');
  const [materiList, setMateriList] = useState<string[]>(DEFAULT_BINDO_MATERI_OPTIONS.slice(0, 6));

  // Sync materiList length with stimulusCount
  useEffect(() => {
    const activeOptions = getActiveMateriOptions();
    setMateriList(prev => {
      if (prev.length === stimulusCount) return prev;
      const updated = [...prev];
      if (updated.length < stimulusCount) {
        while (updated.length < stimulusCount) {
          const nextOpt = activeOptions[updated.length % activeOptions.length];
          updated.push(nextOpt);
        }
        return updated;
      } else {
        return updated.slice(0, stimulusCount);
      }
    });
  }, [stimulusCount, isKimiaSubtest, isFisikaSubtest, isBiologiSubtest, isPpknSubtest, isEkonomiSubtest, isGeografiSubtest, isSosiologiSubtest, isSejarahSubtest, isAntropologiSubtest, isPkwuSubtest, isPrancisSubtest, isJermanSubtest, isJepangSubtest, isKoreaSubtest, isArabSubtest, isMtkSubtest, isMtkLanjutSubtest, isBingSubtest, isBingLanjutSubtest, isBindoLanjutSubtest]);

  const handleMateriChange = (sIdx: number, val: string) => {
    setMateriList(prev => {
      const copy = [...prev];
      copy[sIdx] = val;
      return copy;
    });
  };

  const handleApplyDiverseMateri = () => {
    const activeOptions = getActiveMateriOptions();
    const diverse = Array.from({ length: stimulusCount }, (_, i) =>
      activeOptions[i % activeOptions.length]
    );
    setMateriList(diverse);
    toast.success(`${stimulusCount} materi bervariasi otomatis disetel!`);
  };

  // Generation Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [meta, setMeta] = useState<any>(null);

  // Batch Progress Tracking (progressive generation in chunks of 5)
  const BATCH_SIZE = 5;
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchQuestionsLoaded, setBatchQuestionsLoaded] = useState(0);

  // Package Modal & Selection
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savePackageName, setSavePackageName] = useState('');
  const [existingPackages, setExistingPackages] = useState<Array<{ name: string; count: number }>>([]);

  const CACHE_KEY = 'stubia_ai_generated_questions_cache';

  // Fetch existing packages for quick suggestion
  useEffect(() => {
    questionsApi.getPackages().then(setExistingPackages).catch(() => {});
  }, []);

  // Restore cached questions from localStorage on component mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          setGeneratedQuestions(parsed.questions);
          if (parsed.selectedIndices && Array.isArray(parsed.selectedIndices)) {
            setSelectedIndices(parsed.selectedIndices);
          } else {
            setSelectedIndices(parsed.questions.map((_: any, i: number) => i));
          }
          if (parsed.meta) setMeta(parsed.meta);
          if (parsed.subtes) setSubtes(parsed.subtes);
          toast.success(`Draft dipulihkan: ${parsed.questions.length} soal tersimpan dari sesi sebelumnya!`, { id: 'cache-restore' });
        }
      }
    } catch (e) {
      console.warn('[Cache] Failed to load draft questions:', e);
    }
  }, []);

  // Save generated questions to localStorage whenever updated
  useEffect(() => {
    try {
      if (generatedQuestions.length > 0) {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            questions: generatedQuestions,
            selectedIndices,
            meta,
            subtes,
            timestamp: Date.now(),
          })
        );
      }
    } catch (e) {
      console.warn('[Cache] Failed to save draft questions:', e);
    }
  }, [generatedQuestions, selectedIndices, meta, subtes]);

  const handleClearDraft = () => {
    localStorage.removeItem(CACHE_KEY);
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    setMeta(null);
    toast.success('Draft soal berhasil dihapus!');
  };

  // Live Elapsed Timer State during Generation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Helper calculation for Difficulty sum
  const diffSum = diffEasy + diffMedium + diffHots;

  // Helper calculation for Types sum
  const typesSum = selectedTypes.reduce((acc, t) => acc + (typesAlloc[t] || 0), 0);

  // Load Skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const data = await aiGeneratorApi.getSkills();
        setSkills(data);
        
        // Check if navigation passed a pre-selected skill
        if (location.state?.selectedSkill) {
          const navSkill = location.state.selectedSkill as AISkill;
          const found = data.find(s => s.id === navSkill.id);
          if (found) {
            handleSkillSelect(found);
          }
        } else if (data.length > 0) {
          handleSkillSelect(data[0]);
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat list skill.');
      }
    };
    fetchSkills();
  }, [location.state]);

  const handleSkillSelect = (skill: AISkill) => {
    setSelectedSkill(skill);
    setSubtes(skill.subtes);
    setSelectedTopics(skill.topikCakupanJson.slice(0, 5));
    const skillSubtes = skill.subtes.toLowerCase();
    const isKimia = skillSubtes.includes('kimia');
    const isFisika = skillSubtes.includes('fisika');
    const isBiologi = skillSubtes.includes('biologi');
    const isPpkn = skillSubtes.includes('ppkn') || skillSubtes.includes('pancasila');
    const isEkonomi = skillSubtes.includes('ekonomi');
    const isGeografi = skillSubtes.includes('geografi');
    const isSosiologi = skillSubtes.includes('sosiologi');
    const isSejarah = skillSubtes.includes('sejarah');
    const isAntropologi = skillSubtes.includes('antropologi');
    const isPkwu = skillSubtes.includes('pkwu') || skillSubtes.includes('kewirausahaan');
    const isPrancis = skillSubtes.includes('prancis') || skillSubtes.includes('francais');
    const isJerman = skillSubtes.includes('jerman') || skillSubtes.includes('german') || skillSubtes.includes('deutsch');
    const isJepang = skillSubtes.includes('jepang') || skillSubtes.includes('japanese') || skillSubtes.includes('nihongo');
    const isKorea = skillSubtes.includes('korea') || skillSubtes.includes('korean') || skillSubtes.includes('hangul') || skillSubtes.includes('hangugeo');
    const isArab = skillSubtes.includes('arab') || skillSubtes.includes('arabic');
    const isBindoLanjut = skillSubtes.includes('indo') && (skillSubtes.includes('lanjut') || skillSubtes.includes('tingkat lanjut'));
    const isMtkLanjut = skillSubtes.includes('matematika') && (skillSubtes.includes('tingkat lanjut') || skillSubtes.includes('lanjut'));
    const isMtk = skillSubtes.includes('matematika') && !isMtkLanjut;
    const isBingLanjut = (skillSubtes.includes('inggris') || skillSubtes.includes('english')) && (skillSubtes.includes('tingkat lanjut') || skillSubtes.includes('lanjut'));
    const isBing = (skillSubtes.includes('inggris') || skillSubtes.includes('english')) && !isBingLanjut;

    if (isKimia) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_KIMIA_MATERI_OPTIONS[i % DEFAULT_KIMIA_MATERI_OPTIONS.length]));
    } else if (isFisika) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_FISIKA_MATERI_OPTIONS[i % DEFAULT_FISIKA_MATERI_OPTIONS.length]));
    } else if (isBiologi) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BIOLOGI_MATERI_OPTIONS[i % DEFAULT_BIOLOGI_MATERI_OPTIONS.length]));
    } else if (isPpkn) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_PPKN_MATERI_OPTIONS[i % DEFAULT_PPKN_MATERI_OPTIONS.length]));
    } else if (isEkonomi) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_EKONOMI_MATERI_OPTIONS[i % DEFAULT_EKONOMI_MATERI_OPTIONS.length]));
    } else if (isGeografi) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_GEOGRAFI_MATERI_OPTIONS[i % DEFAULT_GEOGRAFI_MATERI_OPTIONS.length]));
    } else if (isSosiologi) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_SOSIOLOGI_MATERI_OPTIONS[i % DEFAULT_SOSIOLOGI_MATERI_OPTIONS.length]));
    } else if (isSejarah) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_SEJARAH_MATERI_OPTIONS[i % DEFAULT_SEJARAH_MATERI_OPTIONS.length]));
    } else if (isAntropologi) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_ANTROPOLOGI_MATERI_OPTIONS[i % DEFAULT_ANTROPOLOGI_MATERI_OPTIONS.length]));
    } else if (isPkwu) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_PKWU_MATERI_OPTIONS[i % DEFAULT_PKWU_MATERI_OPTIONS.length]));
    } else if (isPrancis) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_PRANCIS_MATERI_OPTIONS[i % DEFAULT_PRANCIS_MATERI_OPTIONS.length]));
    } else if (isJerman) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_JERMAN_MATERI_OPTIONS[i % DEFAULT_JERMAN_MATERI_OPTIONS.length]));
    } else if (isJepang) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_JEPANG_MATERI_OPTIONS[i % DEFAULT_JEPANG_MATERI_OPTIONS.length]));
    } else if (isKorea) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_KOREA_MATERI_OPTIONS[i % DEFAULT_KOREA_MATERI_OPTIONS.length]));
    } else if (isArab) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_ARAB_MATERI_OPTIONS[i % DEFAULT_ARAB_MATERI_OPTIONS.length]));
    } else if (isMtkLanjut) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_MTK_LANJUT_MATERI_OPTIONS[i % DEFAULT_MTK_LANJUT_MATERI_OPTIONS.length]));
    } else if (isMtk) {
      setJumlah(25);
      setIncludeImagePrompts(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_MTK_MATERI_OPTIONS[i % DEFAULT_MTK_MATERI_OPTIONS.length]));
    } else if (isBingLanjut) {
      setJumlah(25);
      setIncludeImagePrompts(false);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BING_LANJUT_MATERI_OPTIONS[i % DEFAULT_BING_LANJUT_MATERI_OPTIONS.length]));
    } else if (isBing) {
      setJumlah(25);
      setIncludeImagePrompts(false);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BING_MATERI_OPTIONS[i % DEFAULT_BING_MATERI_OPTIONS.length]));
    } else if (isBindoLanjut) {
      setJumlah(25);
      setIncludeImagePrompts(false);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BINDO_LANJUT_MATERI_OPTIONS[i % DEFAULT_BINDO_LANJUT_MATERI_OPTIONS.length]));
    } else {
      setJumlah(30);
      const count = Math.ceil(30 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BINDO_MATERI_OPTIONS[i % DEFAULT_BINDO_MATERI_OPTIONS.length]));
    }
  };

  const handleTopicToggle = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const rebalanceTypesAlloc = (types: Array<'PG' | 'PGK' | 'BS' | 'ISIAN'>, mode: 'even' | 'tka' | 'custom') => {
    if (types.length === 0) return;
    
    if (mode === 'tka' && types.includes('PG') && types.includes('BS') && types.includes('PGK')) {
      const is25Paket = isKimiaSubtest || isFisikaSubtest || isBiologiSubtest || isMtkSubtest || isMtkLanjutSubtest || isBingSubtest || isBingLanjutSubtest || isBindoLanjutSubtest;
      if (is25Paket) {
        setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 }); // 16 PG, 5 BS, 4 PGK (total 25)
      } else {
        setTypesAlloc({ PG: 67, BS: 20, PGK: 13, ISIAN: 0 }); // 20 PG, 6 BS, 4 PGK (total 30)
      }
      return;
    }

    if (mode === 'even' || mode === 'tka') {
      const basePct = Math.floor(100 / types.length);
      const remainder = 100 - basePct * types.length;
      const newAlloc: Record<string, number> = { PG: 0, PGK: 0, BS: 0, ISIAN: 0 };
      types.forEach((t, idx) => {
        newAlloc[t] = basePct + (idx === 0 ? remainder : 0);
      });
      setTypesAlloc(newAlloc);
    }
  };

  const handleTypeToggle = (t: 'PG' | 'PGK' | 'BS' | 'ISIAN') => {
    let updated: Array<'PG' | 'PGK' | 'BS' | 'ISIAN'>;
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length === 1) {
        toast.error('Pilih minimal 1 tipe soal!');
        return;
      }
      updated = selectedTypes.filter(item => item !== t);
    } else {
      updated = [...selectedTypes, t];
    }
    setSelectedTypes(updated);
    rebalanceTypesAlloc(updated, typeCompMode);
  };

  const handleSelectAllTypes = () => {
    const all: Array<'PG' | 'PGK' | 'BS' | 'ISIAN'> = ['PG', 'PGK', 'BS', 'ISIAN'];
    setSelectedTypes(all);
    rebalanceTypesAlloc(all, 'even');
  };

  const handleSelectTkaPreset = () => {
    const tkaTypes: Array<'PG' | 'PGK' | 'BS' | 'ISIAN'> = ['PG', 'PGK', 'BS'];
    setSelectedTypes(tkaTypes);
    setTypeCompMode('tka');
    const subtesLower = (subtes || selectedSkill?.subtes || '').toLowerCase();
    const isKimia = subtesLower.includes('kimia');
    const isFisika = subtesLower.includes('fisika');
    const isBiologi = subtesLower.includes('biologi');
    const isPpkn = subtesLower.includes('ppkn') || subtesLower.includes('pancasila');
    const isEkonomi = subtesLower.includes('ekonomi');
    const isGeografi = subtesLower.includes('geografi');
    const isSosiologi = subtesLower.includes('sosiologi');
    const isSejarah = subtesLower.includes('sejarah');
    const isAntropologi = subtesLower.includes('antropologi');
    const isPkwu = subtesLower.includes('pkwu') || subtesLower.includes('kewirausahaan');
    const isPrancis = subtesLower.includes('prancis') || subtesLower.includes('francais');
    const isJerman = subtesLower.includes('jerman') || subtesLower.includes('german') || subtesLower.includes('deutsch');
    const isJepang = subtesLower.includes('jepang') || subtesLower.includes('japanese') || subtesLower.includes('nihongo');
    const isKorea = subtesLower.includes('korea') || subtesLower.includes('korean') || subtesLower.includes('hangul') || subtesLower.includes('hangugeo');
    const isArab = subtesLower.includes('arab') || subtesLower.includes('arabic');
    const isBindoLanjut = subtesLower.includes('indo') && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
    const isMtkLanjut = subtesLower.includes('matematika') && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
    const isMtk = subtesLower.includes('matematika') && !isMtkLanjut;
    const isBingLanjut = (subtesLower.includes('inggris') || subtesLower.includes('english')) && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
    const isBing = (subtesLower.includes('inggris') || subtesLower.includes('english')) && !isBingLanjut;

    if (isKimia) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_KIMIA_MATERI_OPTIONS[i % DEFAULT_KIMIA_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Kimia Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isFisika) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_FISIKA_MATERI_OPTIONS[i % DEFAULT_FISIKA_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Fisika Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isBiologi) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BIOLOGI_MATERI_OPTIONS[i % DEFAULT_BIOLOGI_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Biologi Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isPpkn) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_PPKN_MATERI_OPTIONS[i % DEFAULT_PPKN_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA PPKn Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isEkonomi) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_EKONOMI_MATERI_OPTIONS[i % DEFAULT_EKONOMI_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Ekonomi Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isGeografi) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_GEOGRAFI_MATERI_OPTIONS[i % DEFAULT_GEOGRAFI_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Geografi Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isSosiologi) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_SOSIOLOGI_MATERI_OPTIONS[i % DEFAULT_SOSIOLOGI_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Sosiologi Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isSejarah) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_SEJARAH_MATERI_OPTIONS[i % DEFAULT_SEJARAH_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Sejarah Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isAntropologi) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_ANTROPOLOGI_MATERI_OPTIONS[i % DEFAULT_ANTROPOLOGI_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Antropologi Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isPkwu) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_PKWU_MATERI_OPTIONS[i % DEFAULT_PKWU_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA PKWU Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isPrancis) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(36);
      setDiffMedium(40);
      setDiffHots(24);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_PRANCIS_MATERI_OPTIONS[i % DEFAULT_PRANCIS_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Bahasa Prancis Aktif: 25 Soal (Mudah 9, Sedang 10, Sulit 6) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isJerman) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(36);
      setDiffMedium(40);
      setDiffHots(24);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_JERMAN_MATERI_OPTIONS[i % DEFAULT_JERMAN_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Bahasa Jerman Aktif: 25 Soal (Mudah 9, Sedang 10, Sulit 6) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isJepang) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(36);
      setDiffMedium(40);
      setDiffHots(24);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_JEPANG_MATERI_OPTIONS[i % DEFAULT_JEPANG_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Bahasa Jepang Aktif: 25 Soal (Mudah 9, Sedang 10, Sulit 6) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isKorea) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(36);
      setDiffMedium(40);
      setDiffHots(24);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_KOREA_MATERI_OPTIONS[i % DEFAULT_KOREA_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Bahasa Korea Aktif: 25 Soal (Mudah 9, Sedang 10, Sulit 6) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isArab) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(32);
      setDiffMedium(40);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_ARAB_MATERI_OPTIONS[i % DEFAULT_ARAB_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Bahasa Arab Aktif: 25 Soal (Mudah 8, Sedang 10, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isMtkLanjut) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_MTK_LANJUT_MATERI_OPTIONS[i % DEFAULT_MTK_LANJUT_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA MTK Lanjut Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isMtk) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setIncludeImagePrompts(true);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_MTK_MATERI_OPTIONS[i % DEFAULT_MTK_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA Matematika Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4) + Prompt Gambar');
    } else if (isBingLanjut) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BING_LANJUT_MATERI_OPTIONS[i % DEFAULT_BING_LANJUT_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA B. Inggris Lanjut Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4)');
    } else if (isBing) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BING_MATERI_OPTIONS[i % DEFAULT_BING_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA B. Inggris Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4)');
    } else if (isBindoLanjut) {
      setJumlah(25);
      setTypesAlloc({ PG: 64, BS: 20, PGK: 16, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(28);
      setDiffMedium(44);
      setDiffHots(28);
      setReuseStimulus(true);
      const count = Math.ceil(25 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BINDO_LANJUT_MATERI_OPTIONS[i % DEFAULT_BINDO_LANJUT_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA B. Indonesia Lanjut Aktif: 25 Soal (Mudah 7, Sedang 11, Sulit 7) & (PG 16, BS 5, PGK 4)');
    } else {
      setJumlah(30);
      setTypesAlloc({ PG: 67, BS: 20, PGK: 13, ISIAN: 0 });
      setDifficultyMode('distribution');
      setDiffEasy(30);
      setDiffMedium(50);
      setDiffHots(20);
      setReuseStimulus(true);
      const count = Math.ceil(30 / questionsPerStimulus);
      setMateriList(Array.from({ length: count }, (_, i) => DEFAULT_BINDO_MATERI_OPTIONS[i % DEFAULT_BINDO_MATERI_OPTIONS.length]));
      toast.success('Preset Paket TKA B. Indonesia Aktif: 30 Soal (Mudah 30%, Sedang 50%, Sulit 20%) & (PG 20, BS 6, PGK 4)');
    }
  };

  const setDifficultyPreset = (easy: number, med: number, hots: number) => {
    setDifficultyMode('distribution');
    setDiffEasy(easy);
    setDiffMedium(med);
    setDiffHots(hots);
  };

  const triggerGenerate = async () => {
    if (!selectedSkill) {
      toast.error('Pilih skill prompt terlebih dahulu!');
      return;
    }
    if (selectedTopics.length === 0) {
      toast.error('Pilih minimal 1 topik cakupan!');
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error('Pilih minimal 1 tipe soal!');
      return;
    }
    if (jumlah < 1 || jumlah > 50) {
      toast.error('Jumlah soal harus berada di antara 1 dan 50!');
      return;
    }

    if (difficultyMode === 'distribution' && diffSum !== 100) {
      toast.error(`Total persentase kesulitan harus 100% (saat ini: ${diffSum}%)`);
      return;
    }

    if (typeCompMode === 'custom' && typesSum !== 100) {
      toast.error(`Total persentase tipe soal harus 100% (saat ini: ${typesSum}%)`);
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    setMeta(null);

    // Calculate batches (e.g. 25 soal → 5 batches of 5)
    const totalBatches = Math.ceil(jumlah / BATCH_SIZE);
    const generationStartTime = Date.now();
    setBatchTotal(totalBatches);
    setBatchCurrent(0);
    setBatchQuestionsLoaded(0);

    const allQuestions: GeneratedQuestion[] = [];
    let totalTokens = 0;
    let totalCost = 0;
    let totalBlocked = 0;
    let totalWarning = 0;
    let totalSafe = 0;
    let hasError = false;

    for (let batch = 0; batch < totalBatches; batch++) {
      if (hasError) break;

      const batchJumlah = Math.min(BATCH_SIZE, jumlah - batch * BATCH_SIZE);
      setBatchCurrent(batch + 1);

      // Slice materiList for this batch so each batch gets unique materi entries
      const batchMateriList = materiList && materiList.length > 0
        ? (() => {
            const stimulusPerBatch = reuseStimulus
              ? Math.ceil(batchJumlah / questionsPerStimulus)
              : batchJumlah;
            const startIdx = batch * (reuseStimulus ? Math.ceil(BATCH_SIZE / questionsPerStimulus) : BATCH_SIZE);
            return materiList.slice(startIdx, startIdx + stimulusPerBatch);
          })()
        : undefined;

      const configPayload = {
        subtes,
        topik: selectedTopics,
        materi: batchMateriList && batchMateriList.length > 0 ? batchMateriList[0] : (materiList[0] || undefined),
        materiList: batchMateriList && batchMateriList.length > 0 ? batchMateriList : undefined,
        difficulty: difficultyMode === 'single' ? singleDifficulty : 'MEDIUM',
        difficultyDistribution: difficultyMode === 'distribution' ? {
          EASY: diffEasy,
          MEDIUM: diffMedium,
          HOTS: diffHots,
        } : undefined,
        tipe: selectedTypes[0],
        tipes: selectedTypes,
        typesDistribution: typesAlloc,
        jumlah: batchJumlah,
        reuseStimulus,
        questionsPerStimulus,
        includeImagePrompts,
      };

      try {
        const result = await aiGeneratorApi.generateQuestions(selectedSkill.id, configPayload, selectedModel);

        // Append this batch's questions to running total
        allQuestions.push(...result.questions);
        totalTokens += result.meta.tokensUsed || 0;
        totalCost += result.meta.costEstimateUsd || 0;
        totalBlocked += result.meta.summary.blocked || 0;
        totalWarning += result.meta.summary.warning || 0;
        totalSafe += result.meta.summary.safe || 0;

        // Progressively update state so user sees results appearing live
        setGeneratedQuestions([...allQuestions]);
        setBatchQuestionsLoaded(allQuestions.length);

        // Auto-select all questions loaded so far
        setSelectedIndices(allQuestions.map((_, idx) => idx));

        // Update aggregated meta progressively
        setMeta({
          durationMs: Date.now() - generationStartTime,
          tokensUsed: totalTokens,
          costEstimateUsd: totalCost,
          summary: {
            blocked: totalBlocked,
            warning: totalWarning,
            safe: totalSafe,
            total: allQuestions.length,
          },
        });

        toast.success(`Batch ${batch + 1}/${totalBatches} selesai — ${result.questions.length} soal baru (total: ${allQuestions.length})`, {
          id: `batch-${batch}`,
          duration: 2000,
        });
      } catch (err: any) {
        hasError = true;
        if (allQuestions.length > 0) {
          // Partial success: some batches completed
          toast.error(`Batch ${batch + 1}/${totalBatches} gagal: ${err.message || 'Error'}. ${allQuestions.length} soal dari batch sebelumnya tetap tersimpan.`);
        } else {
          toast.error(err.message || 'Gagal generate soal via AI.');
        }
      }
    }

    // Final summary
    if (allQuestions.length > 0) {
      setMeta((prev: any) => ({
        ...prev,
        durationMs: Date.now() - generationStartTime,
        summary: {
          blocked: totalBlocked,
          warning: totalWarning,
          safe: totalSafe,
          total: allQuestions.length,
        },
      }));
      if (!hasError) {
        toast.success(`✅ Selesai! ${allQuestions.length} soal berhasil digenerate AI dalam ${totalBatches} batch!`, { duration: 4000 });
      }
    }

    setIsGenerating(false);
  };

  const handleFieldChange = (index: number, field: string, value: any) => {
    const updated = [...generatedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedQuestions(updated);
  };

  const handleSelectToggle = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleSelectAllSafe = () => {
    const allIndices = generatedQuestions.map((_, idx) => idx);
    setSelectedIndices(allIndices);
  };

  const handleSaveSelected = () => {
    const indicesToSave = selectedIndices.length > 0 ? selectedIndices : generatedQuestions.map((_, idx) => idx);
    if (indicesToSave.length === 0) {
      toast.error('Pilih minimal 1 soal untuk disimpan!');
      return;
    }
    // Pre-populate package name if skill has a name and not already set
    if (!savePackageName && selectedSkill?.namaSkill) {
      const dateStr = new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      setSavePackageName(`${selectedSkill.namaSkill} - ${dateStr}`);
    }
    setIsSaveModalOpen(true);
  };

  const confirmSaveToBank = async (overridePkg?: string) => {
    const indicesToSave = selectedIndices.length > 0 ? selectedIndices : generatedQuestions.map((_, idx) => idx);
    if (indicesToSave.length === 0) {
      toast.error('Pilih minimal 1 soal untuk disimpan!');
      return;
    }

    const pkg = (overridePkg !== undefined ? overridePkg : savePackageName).trim();
    const selectedQuestions = indicesToSave.map(idx => generatedQuestions[idx]);
    const payload = {
      questions: selectedQuestions,
      skillId: selectedSkill?.id,
      packageName: pkg || undefined,
      config: {
        subtes,
        topik: selectedTopics,
        materi: materiList[0] || undefined,
        materiList: materiMode === 'custom' ? materiList : undefined,
        difficulty: difficultyMode === 'single' ? singleDifficulty : 'MEDIUM',
        difficultyDistribution: difficultyMode === 'distribution' ? { EASY: diffEasy, MEDIUM: diffMedium, HOTS: diffHots } : undefined,
        tipe: selectedTypes[0],
        tipes: selectedTypes,
        typesDistribution: typesAlloc,
        jumlah,
        reuseStimulus,
        questionsPerStimulus,
        includeImagePrompts,
      },
      modelUsed: selectedModel,
      tokensUsed: meta?.tokensUsed,
      costEstimateUsd: meta?.costEstimateUsd,
      durationMs: meta?.durationMs,
    };

    try {
      const result = await aiGeneratorApi.saveQuestions(payload);
      localStorage.removeItem(CACHE_KEY);
      toast.success(`${result.saved} soal berhasil disimpan ke Bank Soal ${pkg ? `(Paket "${pkg}")` : ''}!`);
      setIsSaveModalOpen(false);
      navigate(pkg ? `/questions?packageName=${encodeURIComponent(pkg)}` : '/questions');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan soal.');
    }
  };

  const handleExportTkaExcel = async () => {
    const indicesToExport = selectedIndices.length > 0 
      ? selectedIndices 
      : generatedQuestions.map((_, idx) => idx);

    if (indicesToExport.length === 0) {
      toast.error('Tidak ada soal untuk di-export!');
      return;
    }

    const selectedQuestions = indicesToExport.map(idx => generatedQuestions[idx]);
    const subtesLower = (subtes || selectedSkill?.subtes || '').toLowerCase();
    const isKimia = subtesLower.includes('kimia');
    const isFisika = subtesLower.includes('fisika');
    const isBiologi = subtesLower.includes('biologi');
    const isPpkn = subtesLower.includes('ppkn') || subtesLower.includes('pancasila');
    const isEkonomi = subtesLower.includes('ekonomi');
    const isGeografi = subtesLower.includes('geografi');
    const isSosiologi = subtesLower.includes('sosiologi');
    const isSejarah = subtesLower.includes('sejarah');
    const isAntropologi = subtesLower.includes('antropologi');
    const isPkwu = subtesLower.includes('pkwu') || subtesLower.includes('kewirausahaan');
    const isPrancis = subtesLower.includes('prancis') || subtesLower.includes('francais');
    const isJerman = subtesLower.includes('jerman') || subtesLower.includes('german') || subtesLower.includes('deutsch');
    const isJepang = subtesLower.includes('jepang') || subtesLower.includes('japanese') || subtesLower.includes('nihongo');
    const isKorea = subtesLower.includes('korea') || subtesLower.includes('korean') || subtesLower.includes('hangul') || subtesLower.includes('hangugeo');
    const isArab = subtesLower.includes('arab') || subtesLower.includes('arabic');
    const isBindoLanjut = subtesLower.includes('indo') && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
    const isMtkLanjut = subtesLower.includes('matematika') && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
    const isMtk = subtesLower.includes('matematika') && !isMtkLanjut;
    const isBingLanjut = (subtesLower.includes('inggris') || subtesLower.includes('english')) && (subtesLower.includes('tingkat lanjut') || subtesLower.includes('lanjut'));
    const isBing = (subtesLower.includes('inggris') || subtesLower.includes('english')) && !isBingLanjut;
    const prefix = isKimia 
      ? 'TKA_KIMIA_TRYOUT' 
      : (isFisika 
        ? 'TKA_FISIKA_TRYOUT' 
        : (isBiologi 
          ? 'TKA_BIOLOGI_TRYOUT' 
          : (isPpkn
            ? 'TKA_PPKN_TRYOUT'
            : (isEkonomi
              ? 'TKA_EKONOMI_TRYOUT'
              : (isGeografi
                ? 'TKA_GEOGRAFI_TRYOUT'
                : (isSosiologi
                  ? 'TKA_SOSIOLOGI_TRYOUT'
                  : (isSejarah
                    ? 'TKA_SEJARAH_TRYOUT'
                    : (isAntropologi
                      ? 'TKA_ANTROPOLOGI_TRYOUT'
                      : (isPkwu
                        ? 'TKA_PKWU_TRYOUT'
                        : (isPrancis
                          ? 'TKA_PRANCIS_TRYOUT'
                          : (isJerman
                            ? 'TKA_JERMAN_TRYOUT'
                            : (isJepang
                              ? 'TKA_JEPANG_TRYOUT'
                              : (isKorea
                                ? 'TKA_KOREA_TRYOUT'
                                : (isArab
                                  ? 'TKA_ARAB_TRYOUT'
                                  : (isMtkLanjut 
                                    ? 'TKA_MATEMATIKA_LANJUT_TRYOUT' 
                                    : (isMtk 
                                      ? 'TKA_MATEMATIKA_TRYOUT' 
                                      : (isBingLanjut 
                                        ? 'TKA_BING_LANJUT_TRYOUT' 
                                        : (isBing 
                                          ? 'TKA_BING_TRYOUT' 
                                          : (isBindoLanjut 
                                            ? 'TKA_BINDO_LANJUT_TRYOUT' 
                                            : 'TKA_BINDO_TRYOUT')))))))))))))))))));
    const label = isKimia 
      ? 'TKA Kimia' 
      : (isFisika 
        ? 'TKA Fisika' 
        : (isBiologi 
          ? 'TKA Biologi' 
          : (isPpkn
            ? 'TKA PPKn'
            : (isEkonomi
              ? 'TKA Ekonomi'
              : (isGeografi
                ? 'TKA Geografi'
                : (isSosiologi
                  ? 'TKA Sosiologi'
                  : (isSejarah
                    ? 'TKA Sejarah'
                    : (isAntropologi
                      ? 'TKA Antropologi'
                      : (isPkwu
                        ? 'TKA PKWU'
                        : (isPrancis
                          ? 'TKA B. Prancis'
                          : (isJerman
                            ? 'TKA B. Jerman'
                            : (isJepang
                              ? 'TKA B. Jepang'
                              : (isKorea
                                ? 'TKA B. Korea'
                                : (isArab
                                  ? 'TKA B. Arab'
                                  : (isMtkLanjut 
                                    ? 'TKA MTK Lanjut' 
                                    : (isMtk 
                                      ? 'TKA Matematika' 
                                      : (isBingLanjut 
                                        ? 'TKA B. Inggris Lanjut' 
                                        : (isBing 
                                          ? 'TKA B. Inggris' 
                                          : (isBindoLanjut 
                                            ? 'TKA Bindo Lanjut' 
                                            : 'TKA')))))))))))))))))));
    const toastId = toast.loading(`Mengkompilasi ${selectedQuestions.length} soal Excel ${label}...`);

    try {
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `${prefix}_${dateStr}`;
      await aiGeneratorApi.exportTkaExcel(selectedQuestions, fileName);
      toast.success(`${selectedQuestions.length} soal Excel ${label} berhasil diunduh!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengekspor Excel.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#CBD5E1] rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="text-xl font-bold text-[#0F172A]">AI Question Generator Panel</h2>
          </div>
          <p className="text-xs font-semibold text-[#64748B] mt-1">
            Buat soal ujian secara instan berbasis stimulus teks, atur proporsi tingkat kesulitan dan komposisi tipe soal secara merata.
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/ai-generator/skills')}
          className="text-xs font-bold border-[#CBD5E1] hover:bg-[#F1F5F9] focus:ring-[#CBD5E1]"
        >
          <Library className="h-4 w-4 mr-1.5" /> Buka Skill Library
        </Button>
      </div>

      {/* Main Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* Left Config Column (40% / 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#CBD5E1] border-l-4 border-l-[#7C3AED] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#7C3AED] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> 1. Konfigurasi Generate
            </h3>
            <button
              type="button"
              onClick={handleSelectTkaPreset}
              className="text-[11px] font-bold text-[#7C3AED] bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition-colors"
              title="Setel otomatis 30 soal TKA (Mudah 30%, Sedang 50%, Sulit 20%)"
            >
              ⚡ Preset Paket TKA
            </button>
          </div>

          {/* Skill Selector (Searchable Combobox) */}
          <div ref={skillDropdownRef} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#64748B]">
                Pilih Skill Prompt
              </label>
              {skills.length > 0 && (
                <span className="text-[10px] text-[#7C3AED] font-semibold">
                  {skills.length} Skill Tersedia
                </span>
              )}
            </div>

            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSkillDropdownOpen(prev => !prev)}
              className={`w-full min-h-[42px] px-3.5 py-2 border rounded-xl text-left flex items-center justify-between gap-2 shadow-sm transition-all bg-white ${
                isSkillDropdownOpen 
                  ? 'border-[#7C3AED] ring-2 ring-purple-100' 
                  : 'border-[#CBD5E1] hover:border-[#7C3AED]'
              }`}
            >
              <div className="flex-1 min-w-0">
                {selectedSkill ? (
                  <div>
                    <div className="text-xs font-bold text-[#0F172A] truncate">
                      {selectedSkill.namaSkill}
                    </div>
                    <div className="text-[10px] text-[#64748B] font-medium truncate mt-0.5">
                      Subtes: <span className="text-[#7C3AED] font-semibold">{selectedSkill.subtes}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-[#94A3B8] font-medium">-- Pilih Skill Prompt --</span>
                )}
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-[#64748B] transition-transform duration-200 shrink-0 ${
                  isSkillDropdownOpen ? 'rotate-180 text-[#7C3AED]' : ''
                }`} 
              />
            </button>

            {/* Dropdown Popover */}
            {isSkillDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#CBD5E1] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {/* Search Input */}
                <div className="p-2 border-b border-[#F1F5F9] bg-[#F8FAFC] flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 ml-1" />
                  <input
                    ref={skillSearchInputRef}
                    type="text"
                    placeholder="Cari nama skill / subtes..."
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-medium"
                  />
                  {skillSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setSkillSearchQuery('')}
                      className="p-1 hover:bg-slate-200 rounded transition-colors text-[#94A3B8] hover:text-[#0F172A]"
                      title="Hapus pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Options List */}
                <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                  {filteredSkills.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#94A3B8]">
                      Tidak ada skill yang cocok dengan "{skillSearchQuery}"
                    </div>
                  ) : (
                    filteredSkills.map(s => {
                      const isSelected = selectedSkill?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            handleSkillSelect(s);
                            setIsSkillDropdownOpen(false);
                            setSkillSearchQuery('');
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-purple-50 text-[#7C3AED] font-bold border border-purple-200'
                              : 'text-[#1E293B] hover:bg-[#F1F5F9] font-medium'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-semibold text-xs">
                              {s.namaSkill}
                            </div>
                            <div className="text-[10px] text-[#64748B] truncate mt-0.5">
                              {s.subtes}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#7C3AED] shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subtest (Autofilled / Override) */}
          <Input
            label="Subtes UTBK / TKA (Auto-fill)"
            value={subtes}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubtes(e.target.value)}
            placeholder="Subtes akademik..."
            className="focus:ring-[#7C3AED]"
          />

          {/* Topic Select Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#64748B]">
                Pilih Topik Cakupan
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedSkill) {
                    if (selectedTopics.length === selectedSkill.topikCakupanJson.length) {
                      setSelectedTopics([selectedSkill.topikCakupanJson[0]]);
                    } else {
                      setSelectedTopics([...selectedSkill.topikCakupanJson]);
                    }
                  }
                }}
                className="text-[11px] text-[#7C3AED] hover:underline font-semibold"
              >
                {selectedSkill && selectedTopics.length === selectedSkill.topikCakupanJson.length ? 'Pilih 1' : 'Pilih Semua'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border border-[#CBD5E1] rounded-xl p-3 bg-[#F8FAFC]">
              {selectedSkill?.topikCakupanJson.map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTopicToggle(topic)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                    selectedTopics.includes(topic)
                      ? 'bg-purple-100 border-[#7C3AED] text-[#5B21B6]'
                      : 'bg-white border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Per-Stimulus Materi Specification Section */}
          <div className="space-y-3 pt-3 border-t border-[#CBD5E1]/60">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#0F172A]">
                  Fokus Materi ({stimulusCount} Teks Stimulus)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (materiMode === 'default') {
                      setMateriMode('custom');
                    } else {
                      setMateriMode('default');
                    }
                  }}
                  className="text-[10px] text-[#7C3AED] font-bold underline"
                >
                  {materiMode === 'default' ? 'Pilih per Stimulus' : 'Ganti ke Default (Otomatis)'}
                </button>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                materiMode === 'default' ? 'bg-slate-100 text-slate-700' : 'bg-purple-100 text-purple-800'
              }`}>
                {materiMode === 'default' ? '✨ Default (Otomatis)' : `🎯 ${stimulusCount} Materi Khusus`}
              </span>
            </div>

            {materiMode === 'default' ? (
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#CBD5E1] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span className="font-semibold text-[11px] leading-relaxed">
                    Setiap <b className="text-[#0F172A]">{stimulusCount} teks wacana</b> akan diisi materi beragam secara otomatis oleh AI (Puisi, Dongeng, Cerpen, Berita, Editorial, Artikel Ilmiah, dll).
                  </span>
                  <button
                    type="button"
                    onClick={() => setMateriMode('custom')}
                    className="text-[11px] font-bold text-[#7C3AED] hover:underline shrink-0 ml-3 bg-white px-2 py-1 rounded border border-purple-200 shadow-sm"
                  >
                    Atur per Stimulus ✏️
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#64748B] font-semibold leading-relaxed">
                    Pilih/ketik materi untuk masing-masing <b className="text-[#0F172A]">{stimulusCount} stimulus</b> ({questionsPerStimulus} soal per teks):
                  </p>
                  <button
                    type="button"
                    onClick={handleApplyDiverseMateri}
                    className="text-[10px] text-[#7C3AED] bg-white hover:bg-purple-50 border border-purple-200 px-2 py-1 rounded font-bold transition-colors shadow-sm shrink-0"
                    title="Isi otomatis dengan variasi genre teks berbeda"
                  >
                    ⚡ Acak Beragam
                  </button>
                </div>

                {/* Stimulus Materi Cards List */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {Array.from({ length: stimulusCount }).map((_, sIdx) => {
                    const startNum = sIdx * questionsPerStimulus + 1;
                    const endNum = Math.min(jumlah, (sIdx + 1) * questionsPerStimulus);
                    const activeOptions = getActiveMateriOptions();
                    const currentMateri = materiList[sIdx] || activeOptions[sIdx % activeOptions.length];

                    return (
                      <div
                        key={sIdx}
                        className="bg-white border border-[#CBD5E1] rounded-xl p-3 space-y-2 shadow-sm hover:border-purple-300 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              {sIdx + 1}
                            </span>
                            <span className="text-xs font-bold text-[#0F172A]">
                              Stimulus #{sIdx + 1}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Soal No. {startNum} – {endNum}
                          </span>
                        </div>

                        {/* Input custom or selected genre */}
                        <input
                          type="text"
                          value={currentMateri}
                          onChange={(e) => handleMateriChange(sIdx, e.target.value)}
                          placeholder="Ketik materi spesifik..."
                          className="w-full h-8 px-2.5 border border-[#CBD5E1] rounded-lg text-xs bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-semibold"
                        />

                        {/* Quick Genre Chips for this slot */}
                        <div className="flex flex-wrap gap-1">
                          {activeOptions.slice(0, 8).map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => handleMateriChange(sIdx, chip)}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border transition-all ${
                                currentMateri === chip
                                  ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-xs'
                                  : 'bg-slate-50 text-[#64748B] border-[#CBD5E1] hover:bg-purple-50 hover:border-purple-300'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Difficulty Distribution Section */}
          <div className="space-y-3 pt-3 border-t border-[#CBD5E1]/60">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#0F172A]">Distribusi Tingkat Kesulitan</label>
                <button
                  type="button"
                  onClick={() => setDifficultyMode(difficultyMode === 'distribution' ? 'single' : 'distribution')}
                  className="text-[10px] text-[#7C3AED] font-bold underline"
                >
                  {difficultyMode === 'distribution' ? 'Ganti ke Tunggal' : 'Ganti ke Proporsional (%)'}
                </button>
              </div>
              {difficultyMode === 'distribution' && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  diffSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 animate-pulse'
                }`}>
                  Total: {diffSum}%
                </span>
              )}
            </div>

            {difficultyMode === 'distribution' ? (
              <div className="space-y-2.5 bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setDifficultyPreset(30, 50, 20)}
                    className="text-[10px] px-2 py-1 bg-white border border-purple-200 rounded font-semibold text-[#5B21B6] hover:bg-purple-50"
                  >
                    ⚡ Standar TKA (30/50/20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficultyPreset(33, 34, 33)}
                    className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    ⚖️ Rata (33/34/33%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficultyPreset(10, 40, 50)}
                    className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    🔥 HOTS (10/40/50%)
                  </button>
                </div>

                {/* 3 Inputs Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-700 mb-1 text-center">
                      MUDAH (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={diffEasy}
                      onChange={(e) => setDiffEasy(parseInt(e.target.value) || 0)}
                      className="w-full h-9 px-2 border border-[#CBD5E1] rounded-lg text-center font-bold text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                    <span className="block text-[10px] text-center text-[#64748B] mt-0.5 font-medium">
                      ~{Math.max(1, Math.round((diffEasy / 100) * jumlah))} soal
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-700 mb-1 text-center">
                      SEDANG (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={diffMedium}
                      onChange={(e) => setDiffMedium(parseInt(e.target.value) || 0)}
                      className="w-full h-9 px-2 border border-[#CBD5E1] rounded-lg text-center font-bold text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                    <span className="block text-[10px] text-center text-[#64748B] mt-0.5 font-medium">
                      ~{Math.max(1, Math.round((diffMedium / 100) * jumlah))} soal
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-red-700 mb-1 text-center">
                      SULIT (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={diffHots}
                      onChange={(e) => setDiffHots(parseInt(e.target.value) || 0)}
                      className="w-full h-9 px-2 border border-[#CBD5E1] rounded-lg text-center font-bold text-xs bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                    />
                    <span className="block text-[10px] text-center text-[#64748B] mt-0.5 font-medium">
                      ~{Math.max(1, Math.round((diffHots / 100) * jumlah))} soal
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-4 p-3 bg-[#F8FAFC] rounded-xl border border-[#CBD5E1]">
                {['EASY', 'MEDIUM', 'HOTS'].map((diff) => (
                  <label key={diff} className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer">
                    <input
                      type="radio"
                      name="singleDifficulty"
                      checked={singleDifficulty === diff}
                      onChange={() => setSingleDifficulty(diff as any)}
                      className="text-[#7C3AED] focus:ring-[#7C3AED]"
                    />
                    {diff === 'EASY' ? 'Mudah' : diff === 'MEDIUM' ? 'Sedang' : 'Sulit (HOTS)'}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Multi-Type Selection & Composition Section */}
          <div className="space-y-3 pt-3 border-t border-[#CBD5E1]/60">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#0F172A]">Komposisi Tipe Soal</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAllTypes}
                  className="text-[10px] px-2 py-0.5 rounded font-bold transition-all bg-purple-50 text-[#7C3AED] hover:bg-purple-100 border border-purple-200"
                  title="Pilih seluruh 4 tipe soal"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeCompMode('even');
                    rebalanceTypesAlloc(selectedTypes, 'even');
                    toast.success('Komposisi disetel bagi rata');
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                    typeCompMode === 'even' ? 'bg-[#7C3AED] text-white' : 'bg-purple-50 text-[#7C3AED]'
                  }`}
                  title="Bagi rata jumlah soal ke semua tipe yang dipilih"
                >
                  ⚖️ Bagi Rata
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeCompMode('custom');
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                    typeCompMode === 'custom' ? 'bg-[#7C3AED] text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  🛠️ Kustom (%)
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-xl border border-[#CBD5E1]">
              {[
                { key: 'PG', label: 'Pilihan Ganda (PG)', code: 'multiple_choice' },
                { key: 'PGK', label: 'PG Kompleks (PGK)', code: 'complex_mc_tf' },
                { key: 'BS', label: 'PG Jawaban Jamak (BS)', code: 'complex_mc_multi' },
                { key: 'ISIAN', label: 'Isian Singkat', code: 'ISIAN' },
              ].map((item) => {
                const isChecked = selectedTypes.includes(item.key as any);
                const pct = typesAlloc[item.key] || 0;
                const approxCount = isChecked ? Math.max(1, Math.round((pct / 100) * jumlah)) : 0;

                return (
                  <div key={item.key} className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#0F172A] cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTypeToggle(item.key as any)}
                        className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                      <div>
                        <span>{item.label}</span>
                        <span className="block text-[10px] text-[#64748B] font-normal">{item.code}</span>
                      </div>
                    </label>

                    {isChecked && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {typeCompMode === 'custom' ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={pct}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setTypesAlloc({ ...typesAlloc, [item.key]: val });
                              }}
                              className="w-14 h-7 px-1.5 border border-[#CBD5E1] rounded text-center text-xs font-bold bg-white text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                            />
                            <span className="text-[10px] text-[#64748B]">%</span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-[#5B21B6] bg-purple-100 px-2 py-0.5 rounded">
                            {pct}% (~{approxCount} soal)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {typeCompMode === 'custom' && (
                <div className="flex justify-between items-center pt-2 border-t border-[#CBD5E1]/60 text-xs font-bold">
                  <span className="text-[#64748B]">Total Komposisi Tipe:</span>
                  <span className={typesSum === 100 ? 'text-emerald-600' : 'text-red-600 animate-pulse'}>
                    {typesSum}% {typesSum === 100 ? '✅' : '(Harus 100%)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stimulus Reuse Toggle & Configuration */}
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-[#5B21B6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={reuseStimulus}
                  onChange={(e) => setReuseStimulus(e.target.checked)}
                  className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <span>Kelompokkan Soal per Teks Stimulus (Reuse Stimulus)</span>
              </label>
              {reuseStimulus && (
                <span className="text-[10px] font-bold text-[#5B21B6] bg-purple-200/70 px-2 py-0.5 rounded-full">
                  ~{Math.ceil(jumlah / questionsPerStimulus)} Teks Wacana
                </span>
              )}
            </div>

            {reuseStimulus && (
              <div className="pl-5 space-y-2 pt-1 border-t border-purple-200/60">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#5B21B6]">1 Stimulus untuk berapa soal?</span>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionsPerStimulus(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          questionsPerStimulus === num
                            ? 'bg-[#7C3AED] text-white shadow-sm'
                            : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-[#6B21A8] leading-relaxed">
                  1 teks wacana (250–300 kata) dipakai untuk <strong>{questionsPerStimulus} soal berturut-turut</strong>. (Total {jumlah} soal = <strong>{Math.ceil(jumlah / questionsPerStimulus)} teks wacana berbeda</strong>).
                </p>
              </div>
            )}
          </div>

          {/* Model and Qty with Presets */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Jumlah Soal (1–50)"
                  type="number"
                  min={1}
                  max={50}
                  value={jumlah}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJumlah(parseInt(e.target.value) || 5)}
                  className="focus:ring-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5">Model AI</label>
                <select
                  value={selectedModel}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedModel(e.target.value)}
                  className="w-full h-10 px-3 border border-[#CBD5E1] rounded-lg text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-semibold"
                >
                  <option value="stubia-v.1">stubia-v.1</option>
                  <option value="claude-sonnet-4.6">claude-sonnet-4.6</option>
                  <option value="gemini-flash-3.8">gemini-flash-3.8</option>
                  <option value="gh/gpt-4o">gh/gpt-4o</option>
                  <option value="claude-opus-4.6">claude-opus-4.6</option>
                </select>
              </div>
            </div>

            {/* Quick Count Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#64748B] mr-1">Preset Jumlah:</span>
              {[5, 10, 15, 20, 25, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setJumlah(num)}
                  className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                    jumlah === num
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {num} {num === 25 ? '🔥 (Mapel Pilihan)' : num === 30 ? '🔥 (Mapel Wajib)' : 'Soal'}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Image Prompt Generation */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#7C3AED]" />
                <label className="text-xs font-bold text-[#0F172A]">
                  Prompt Gambar / Infografis (Opsional)
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImagePrompts}
                  onChange={(e) => setIncludeImagePrompts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C3AED]"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium leading-relaxed">
              Jika aktif, AI akan membuat deskripsi prompt visual detail untuk soal/wacana yang menggunakan infografis, grafik data, diagram, atau ilustrasi. Kolom <b className="text-[#0F172A]">PROMPT GAMBAR</b> akan otomatis disertakan di ujung kanan Excel.
            </p>
          </div>

          {/* Prompt Preview Accordion */}
          <PromptPreview
            skill={selectedSkill}
            config={{
              subtes,
              topik: selectedTopics,
              materi: materiList[0] || undefined,
              materiList: materiMode === 'custom' ? materiList : undefined,
              difficulty: difficultyMode === 'single' ? singleDifficulty : 'MEDIUM',
              difficultyDistribution: difficultyMode === 'distribution' ? { EASY: diffEasy, MEDIUM: diffMedium, HOTS: diffHots } : undefined,
              tipe: selectedTypes[0],
              tipes: selectedTypes,
              typesDistribution: typesAlloc,
              jumlah,
              reuseStimulus,
              questionsPerStimulus,
              includeImagePrompts,
            }}
          />

          {/* Submit Trigger */}
          <Button
            variant="ai"
            className="w-full h-12 text-base font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            onClick={triggerGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Clock className="h-5 w-5 shrink-0 animate-spin text-white" />
                <span>Batch {batchCurrent}/{batchTotal} — {batchQuestionsLoaded}/{jumlah} soal ({formatTimer(elapsedSeconds)})</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 shrink-0" />
                <span>Generate {jumlah} Soal AI ({selectedTypes.join(', ')})</span>
              </>
            )}
          </Button>
        </div>

        {/* Right Output Column (60% / 6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Cost details metadata card */}
          {meta && (
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border-r border-[#CBD5E1]/50 pr-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Durasi Proses</span>
                <p className="text-base font-extrabold text-[#0F172A] mt-1">{(meta.durationMs / 1000).toFixed(2)}s</p>
              </div>
              <div className="border-r border-[#CBD5E1]/50 pr-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Total Tokens</span>
                <p className="text-base font-extrabold text-[#0F172A] mt-1">{meta.tokensUsed.toLocaleString()}</p>
              </div>
              <div className="border-r border-[#CBD5E1]/50 pr-2">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Estimasi Biaya</span>
                <p className="text-base font-extrabold text-[#7C3AED] mt-1">${meta.costEstimateUsd.toFixed(5)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Status Preview</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="Safe">{meta.summary.safe}</Badge>
                  {meta.summary.warning > 0 && <Badge variant="Warning">{meta.summary.warning}</Badge>}
                  {meta.summary.blocked > 0 && <Badge variant="Blocked">{meta.summary.blocked}</Badge>}
                </div>
              </div>
            </div>
          )}

          {isGenerating ? (
            // Loading State with Batch Progress Tracking
            <div className="space-y-6">
              <div className="bg-white border-2 border-purple-200 rounded-2xl p-8 shadow-md flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
                {/* Header Badge with Live Timer */}
                <div className="flex items-center gap-2.5 bg-purple-100/80 border border-purple-300 text-[#5B21B6] px-4 py-2 rounded-full shadow-sm">
                  <Clock className="h-4 w-4 text-[#7C3AED] animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">Waktu Berjalan:</span>
                  <span className="text-sm font-black font-mono bg-white text-[#7C3AED] px-2.5 py-0.5 rounded-md border border-purple-200 shadow-inner">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>

                {/* Central Glowing Icon */}
                <div className="relative">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-[#7C3AED] to-purple-400 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 animate-pulse">
                    <Sparkles className="h-10 w-10 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow border border-purple-200">
                    <Cpu className="h-4 w-4 text-[#7C3AED] animate-bounce" />
                  </div>
                </div>

                {/* Dynamic Batch Text */}
                <div className="text-center space-y-2 max-w-md">
                  <h4 className="text-base font-extrabold text-[#0F172A] flex items-center justify-center gap-2">
                    <span>
                      {batchCurrent > 0
                        ? `Memproses Batch ${batchCurrent} dari ${batchTotal}`
                        : 'Mempersiapkan Generate...'}
                    </span>
                  </h4>
                  <p className="text-xs text-[#64748B] font-semibold leading-relaxed">
                    {batchQuestionsLoaded > 0
                      ? `${batchQuestionsLoaded} soal selesai digenerate. Mengerjakan batch berikutnya (per ${BATCH_SIZE} soal) untuk menghindari timeout...`
                      : `Mengirim batch pertama ke AI (${Math.min(BATCH_SIZE, jumlah)} soal)...`}
                  </p>
                </div>

                {/* Real Progress Bar */}
                <div className="w-full max-w-md bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-[#64748B]">Target: {jumlah} Soal ({selectedTypes.join(', ')})</span>
                    <span className="text-[#7C3AED]">
                      Batch {batchCurrent}/{batchTotal} — {batchQuestionsLoaded} soal selesai
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-[#7C3AED] via-purple-400 to-[#7C3AED] rounded-full transition-all duration-700 relative overflow-hidden"
                      style={{ width: `${Math.max(3, (batchQuestionsLoaded / jumlah) * 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Batch pills */}
                  <div className={`grid gap-1.5 pt-1`} style={{ gridTemplateColumns: `repeat(${Math.min(batchTotal, 10)}, 1fr)` }}>
                    {Array.from({ length: batchTotal }, (_, idx) => {
                      const batchNum = idx + 1;
                      const isDone = batchNum < batchCurrent;
                      const isCurrent = batchNum === batchCurrent;
                      const batchSoalCount = Math.min(BATCH_SIZE, jumlah - idx * BATCH_SIZE);

                      return (
                        <div
                          key={idx}
                          className={`text-[9px] font-bold text-center py-1.5 px-0.5 rounded transition-all truncate ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isCurrent
                              ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-300 animate-pulse'
                              : 'bg-white text-slate-400 border border-slate-200'
                          }`}
                          title={`Batch ${batchNum}: ${batchSoalCount} soal`}
                        >
                          {isDone ? '✓' : isCurrent ? '⏳' : ''} B{batchNum} ({batchSoalCount})
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Show already-generated questions below the loading panel */}
              {generatedQuestions.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span className="text-xs font-bold text-emerald-800">
                      {generatedQuestions.length} soal sudah digenerate — batch selanjutnya sedang diproses...
                    </span>
                  </div>
                  <div className="space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
                    {generatedQuestions.map((q, idx) => (
                      <AIResultCard
                        key={idx}
                        question={q}
                        index={idx}
                        isSelected={selectedIndices.includes(idx)}
                        onSelectToggle={handleSelectToggle}
                        onFieldChange={handleFieldChange}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : generatedQuestions.length === 0 ? (
            // Empty State
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-3">
              <div className="h-14 w-14 bg-purple-100 text-[#7C3AED] rounded-2xl flex items-center justify-center shadow-inner">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-[#0F172A]">Pratinjau Hasil Kosong</h4>
              <p className="text-xs text-[#64748B] max-w-sm font-semibold">
                Konfigurasikan parameter pembuat soal di sebelah kiri dan klik tombol generate untuk melihat soal hasil kurasi AI di sini.
              </p>
            </div>
          ) : (
            // Results list and action bar
            <div className="space-y-4">
              {/* Draft Persisted Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span>Draft Tersimpan Otomatis: Soal Anda aman dan tidak akan hilang meski halaman di-refresh.</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline px-2 py-1 shrink-0 ml-2"
                >
                  🗑️ Hapus Draft
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748B]">
                  Terpilih: {selectedIndices.length} dari {generatedQuestions.length} soal
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2.5 py-1.5 h-8 font-bold border-[#CBD5E1]"
                    onClick={handleSelectAllSafe}
                  >
                    Pilih Semua SAFE
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2.5 py-1.5 h-8 font-bold border-[#CBD5E1] text-[#EF4444] hover:bg-red-50 hover:border-red-300"
                    onClick={() => setSelectedIndices([])}
                  >
                    Batal Semua
                  </Button>
                </div>
              </div>

              {/* Generated cards */}
              <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <AIResultCard
                    key={idx}
                    question={q}
                    index={idx}
                    isSelected={selectedIndices.includes(idx)}
                    onSelectToggle={handleSelectToggle}
                    onFieldChange={handleFieldChange}
                  />
                ))}
              </div>

              {/* Action save bar */}
              <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 sticky bottom-0 z-10">
                <span className="text-xs font-bold text-[#0F172A] hidden sm:block">
                  Simpan soal terpilih ke database bank soal.
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="font-bold flex items-center gap-2 border-[#CBD5E1] text-[#7C3AED] hover:bg-purple-50 hover:border-purple-300"
                    onClick={handleExportTkaExcel}
                  >
                    <FileSpreadsheet className="h-4 w-4 shrink-0" />
                    <span>Export Excel TKA ({selectedIndices.length > 0 ? selectedIndices.length : generatedQuestions.length} Soal)</span>
                  </Button>
                  <Button
                    variant="ai"
                    className="font-bold shadow-md flex items-center gap-2"
                    onClick={handleSaveSelected}
                  >
                    <Save className="h-4 w-4 shrink-0" />
                    <span>Simpan {selectedIndices.length > 0 ? selectedIndices.length : generatedQuestions.length} Soal → Bank</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Simpan ke Paket */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="Simpan Soal ke Bank Soal"
      >
        <div className="space-y-4 pt-1">
          <div className="bg-purple-50 border border-purple-200/70 rounded-xl p-3.5 text-xs text-purple-900 flex items-start gap-2.5">
            <Package className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
            <p>
              Menyimpan <strong className="font-extrabold">{selectedIndices.length > 0 ? selectedIndices.length : generatedQuestions.length} soal</strong> terpilih ke Bank Soal. Kelompokkan ke dalam nama paket agar tidak bercampur dengan paket lainnya.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Nama Paket / Batch Soal
            </label>
            <input
              type="text"
              list="existing-ai-packages-list"
              value={savePackageName}
              onChange={(e) => setSavePackageName(e.target.value)}
              placeholder="e.g. Tryout Akbar UTBK 2026 Batch 1, Latihan TKA Bab 1..."
              className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent font-semibold transition-all"
              autoFocus
            />
            <datalist id="existing-ai-packages-list">
              {existingPackages.map((pkg) => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name} ({pkg.count} soal)
                </option>
              ))}
            </datalist>
            <p className="text-[11px] text-[#64748B] mt-1 font-medium">
              Ketik nama paket baru atau pilih dari paket yang sudah ada agar tersusun rapi.
            </p>
          </div>

          {existingPackages.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Pilih Cepat Paket yang Ada:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {existingPackages.map((pkg) => (
                  <button
                    key={pkg.name}
                    type="button"
                    onClick={() => setSavePackageName(pkg.name)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-all ${
                      savePackageName === pkg.name
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#475569] hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                    }`}
                  >
                    <Package className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[180px]">{pkg.name}</span>
                    <span className="text-[10px] opacity-75">({pkg.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#CBD5E1]/40 mt-5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => confirmSaveToBank('')}
              className="text-xs font-bold text-[#64748B] border-[#CBD5E1]"
            >
              Simpan Tanpa Paket
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-xs font-bold border-[#CBD5E1]"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="ai"
                size="sm"
                onClick={() => confirmSaveToBank()}
                className="text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan ke Bank Soal</span>
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default GeneratePanel;
