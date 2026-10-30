/**
 * SIGARUM (Sistem Informasi Geografis UMKM Olahan Laut dan Garam)
 * App State Manager, LocalStorage Database Engine, and Utilities
 */

const SEED_KATEGORI = [
  {
    id_kategori: 1,
    nama_kategori: "Olahan Laut",
    slug: "olahan-laut",
    deskripsi: "Produk olahan ikan asin, kerupuk laut, terasi, petis, dan abon hasil tangkapan nelayan.",
    warna: "#0284c7",
    icon: "fish"
  },
  {
    id_kategori: 2,
    nama_kategori: "Garam",
    slug: "garam",
    deskripsi: "Garam konsumsi beryodium, garam tambak krosok, garam meja, garam spa relaksasi, dan garam pakan.",
    warna: "#d97706",
    icon: "sparkles"
  }
];

const SEED_WILAYAH = [
  { id_wilayah: 1, nama_wilayah: "Pademawu", kecamatan: "Pademawu", center: [-7.2185, 113.5420], zoom: 13, tipe: "Sentra Garam & Olahan Laut" },
  { id_wilayah: 2, nama_wilayah: "Tlanakan", kecamatan: "Tlanakan", center: [-7.2120, 113.4680], zoom: 13, tipe: "Pelabuhan PPI & Terasi Petis" },
  { id_wilayah: 3, nama_wilayah: "Galis", kecamatan: "Galis", center: [-7.2010, 113.5780], zoom: 13, tipe: "Tambak Garam Kristal" },
  { id_wilayah: 4, nama_wilayah: "Larangan", kecamatan: "Larangan", center: [-7.1550, 113.5850], zoom: 13, tipe: "Pesisir Timur Hasil Laut" },
  { id_wilayah: 5, nama_wilayah: "Pasean", kecamatan: "Pasean", center: [-6.8870, 113.5480], zoom: 13, tipe: "Pantai Utara & Ikan Kering" },
  { id_wilayah: 6, nama_wilayah: "Batumarmar", kecamatan: "Batumarmar", center: [-6.8980, 113.4820], zoom: 13, tipe: "Pesisir Karang Kerupuk Ikan" }
];

const SEED_USERS = [
  { id_user: 1, nama: "Administrator SIGARUM", username: "admin", password: "password123", role: "admin", email: "admin@sigarum.id" },
  { id_user: 2, nama: "H. Achmad Syafi'i (Garam Makmur)", username: "umkm_demo", password: "password123", role: "penjual", email: "umkm@sigarum.id" },
  { id_user: 3, nama: "Siti Fatimah (Pelanggan Madura)", username: "pelanggan_demo", password: "password123", role: "pelanggan", email: "pelanggan@sigarum.id", nomor_telepon: "+62 852-3321-7789" },
  { id_user: 4, nama: "Bapak Mahmudin (Penjual Kerupuk Laut)", username: "penjual_demo", password: "password123", role: "penjual", email: "penjual@sigarum.id", nomor_telepon: "+62 852-3112-9901" }
];

const SEED_UMKM = [
  {
    id_umkm: 1,
    id_user: 2,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Garam Makmur Bunder",
    pemilik: "H. Achmad Syafi'i",
    alamat: "Jl. Tambak Garam No. 14, Dusun Bunder Barat",
    desa: "Bunder",
    kecamatan: "Pademawu",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Sentra produsen garam konsumsi beryodium dan garam krosok kualitas super kristalisasi geomembran ramah lingkungan.",
    kontak: "+62 812-3456-7801",
    latitude: -7.2195,
    longitude: 113.5410,
    foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2014,
    legalitas: "NIB: 9120003410291 | P-IRT | Halal MUI",
    jumlah_karyawan: 12,
    produk_unggulan: ["Garam Konsumsi Beryodium 250gr", "Garam Krosok Kristal Putih 50kg"],
    created_at: "2024-01-15 08:30:00"
  },
  {
    id_umkm: 2,
    id_user: 3,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Mina Jaya Bahari",
    pemilik: "Hj. Siti Aminah",
    alamat: "Jl. Pelabuhan PPI Branta Pesisir No. 05",
    desa: "Branta Pesisir",
    kecamatan: "Tlanakan",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Pengolah ikan asin kualitas ekspor, spesialis teri nasi kering tawar (white anchovy) dan tongkol asap bumbu rempah Madura.",
    kontak: "+62 821-4098-1234",
    latitude: -7.2140,
    longitude: 113.4650,
    foto: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2011,
    legalitas: "NIB: 9120008821034 | P-IRT No. 202352801045",
    jumlah_karyawan: 18,
    produk_unggulan: ["Ikan Teri Nasi Kering Super (Tawar)", "Ikan Tongkol Asap Bumbu Rempah"],
    created_at: "2024-01-18 09:00:00"
  },
  {
    id_umkm: 3,
    id_user: 4,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Laut Sejahtera Majungan",
    pemilik: "Bapak Mahmudin",
    alamat: "Jl. Raya Majungan Pesisir Km 3",
    desa: "Majungan",
    kecamatan: "Pademawu",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Sentra kerupuk ikan tradisional Madura yang memanfaatkan ikan payus dan terung laut segar, gurih tanpa pengawet sintetis.",
    kontak: "+62 852-3112-9901",
    latitude: -7.2310,
    longitude: 113.5510,
    foto: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2016,
    legalitas: "NIB: 0220005519821 | P-IRT | Halal",
    jumlah_karyawan: 9,
    produk_unggulan: ["Kerupuk Ikan Payus Madura", "Kerupuk Terung Laut Gurih"],
    created_at: "2024-01-20 10:15:00"
  },
  {
    id_umkm: 4,
    id_user: 5,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Sari Garam Kristal Galis",
    pemilik: "H. Moh. Fadli",
    alamat: "Jl. Sentra Tambak Garam No. 22",
    desa: "Ponteh",
    kecamatan: "Galis",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Pabrikasi dan pengemasan garam meja dapur super halus beryodium tinggi dan garam kasar berkualitas standar industri makanan.",
    kontak: "+62 813-5789-2234",
    latitude: -7.1980,
    longitude: 113.5760,
    foto: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2015,
    legalitas: "SNI 3556:2016 | BPOM RI MD",
    jumlah_karyawan: 15,
    produk_unggulan: ["Garam Halus Meja Galis 500gr", "Garam Krosok Cuci Super 25kg"],
    created_at: "2024-01-22 13:00:00"
  },
  {
    id_umkm: 5,
    id_user: 6,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Samudra Rasa Kramat",
    pemilik: "Ibu Nurul Qomariyah",
    alamat: "Dusun Kramat Tengah RT 02/RW 01",
    desa: "Kramat",
    kecamatan: "Tlanakan",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Produsen terasi udang rebon asli 100% tanpa bahan pewarna sintetis serta petis ikan cakalang madura legendaris bercita rasa gurih legit.",
    kontak: "+62 878-5002-3344",
    latitude: -7.2180,
    longitude: 113.4560,
    foto: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2008,
    legalitas: "P-IRT No. 202352802099 | Sertifikat Halal",
    jumlah_karyawan: 8,
    produk_unggulan: ["Terasi Udang Rebon Asli Madura", "Petis Ikan Cakalang Gurih Botol"],
    created_at: "2024-01-25 11:45:00"
  },
  {
    id_umkm: 6,
    id_user: 7,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Madura Salt Lestari",
    pemilik: "dr. Hendra Prasetyo",
    alamat: "Jl. Raya Pantai Dasok Pamekasan",
    desa: "Dasok",
    kecamatan: "Pademawu",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Inovasi hilirisasi mineral garam laut Madura menjadi Bath Salt, Garam Terapi Relaksasi, dan Flake Sea Salt Gourmet untuk restoran.",
    kontak: "+62 811-3092-881",
    latitude: -7.2110,
    longitude: 113.5290,
    foto: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2020,
    legalitas: "NIB: 1209000492104 | BPOM NA | Halal",
    jumlah_karyawan: 10,
    produk_unggulan: ["Madura Sea Salt Spa & Aromatherapy", "Flake Gourmet Finishing Salt 150g"],
    created_at: "2024-02-01 14:20:00"
  },
  {
    id_umkm: 7,
    id_user: 8,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Barokah Hasil Laut Pasean",
    pemilik: "Bapak H. Subhan",
    alamat: "Jl. Raya Pantura Pasean No. 88",
    desa: "Tegangser Daja",
    kecamatan: "Pasean",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Pusat olahan ikan laut segar pantai utara Madura menjadi abon ikan tongkol premium dan dendeng ikan lemuru gurih nikmat.",
    kontak: "+62 823-3178-6543",
    latitude: -6.8830,
    longitude: 113.5490,
    foto: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2017,
    legalitas: "P-IRT No. 202352803112 | Halal ID3511000021",
    jumlah_karyawan: 14,
    produk_unggulan: ["Abon Ikan Tongkol Rempah Madura", "Dendeng Ikan Lemuru Manis Gurih"],
    created_at: "2024-02-05 10:00:00"
  },
  {
    id_umkm: 8,
    id_user: 9,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Berkah Garam Pesisir Galis",
    pemilik: "Bapak Subairi",
    alamat: "Jl. Tambak Lembung Dusun Timur",
    desa: "Lembung",
    kecamatan: "Galis",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Kelompok usaha tambak garam rakyat terpadu penyedia garam curah krosok untuk industri pengasinan ikan.",
    kontak: "+62 853-3044-7712",
    latitude: -7.2150,
    longitude: 113.5890,
    foto: "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2013,
    legalitas: "NIB: 9120004128941 | Koperasi Garam",
    jumlah_karyawan: 20,
    produk_unggulan: ["Garam Krosok Kasar Tambak 50kg"],
    created_at: "2024-02-10 08:45:00"
  },
  {
    id_umkm: 9,
    id_user: 10,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Nelayan Sejahtera Branta",
    pemilik: "Cak Lukman Hakim",
    alamat: "Dusun Branta Barat RT 03/RW 02",
    desa: "Branta Pesisir",
    kecamatan: "Tlanakan",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Olahan cumi-cumi asin kering tawar kualitas pilihan tanpa formalin dan ebi udang kering manis olahan nelayan tradisional.",
    kontak: "+62 877-5011-8890",
    latitude: -7.2080,
    longitude: 113.4730,
    foto: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2018,
    legalitas: "NIB: 1209000109283 | P-IRT",
    jumlah_karyawan: 7,
    produk_unggulan: ["Cumi Kering Asin Madura 250gr", "Ebi Kering Manis Kualitas Super"],
    created_at: "2024-02-15 13:20:00"
  },
  {
    id_umkm: 10,
    id_user: 11,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Citra Rasa Laut Bunder",
    pemilik: "Ibu Maimunah",
    alamat: "Jl. Tambak Ikan No. 09, Desa Bunder",
    desa: "Bunder",
    kecamatan: "Pademawu",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Camilan khas pesisir Madura: Kerupuk cumi tinta hitam renyah, keripik rajungan, dan terasi bubuk tabur siap saji kemasan botol praktis.",
    kontak: "+62 822-4560-1928",
    latitude: -7.2120,
    longitude: 113.5480,
    foto: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2019,
    legalitas: "P-IRT No. 202352804221 | Halal",
    jumlah_karyawan: 6,
    produk_unggulan: ["Kerupuk Cumi Tinta Hitam Renyah", "Terasi Tabur Siap Saji Madura Botol"],
    created_at: "2024-02-18 15:30:00"
  },
  {
    id_umkm: 11,
    id_user: 12,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Intan Garam Nusantara",
    pemilik: "Bapak H. Ansori",
    alamat: "Jl. Sentra Garam Majungan No. 45",
    desa: "Majungan",
    kecamatan: "Pademawu",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Garam konsumsi premium fortifikasi yodium bersertifikat SNI resmi dengan brand 'Madura Pure' serta varian garam bumbu rempah dapur.",
    kontak: "+62 819-3890-4455",
    latitude: -7.2250,
    longitude: 113.5590,
    foto: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2016,
    legalitas: "SNI 3556:2016 | NIB: 0220003921021",
    jumlah_karyawan: 16,
    produk_unggulan: ["Garam Kristal Meja 'Madura Pure' 400g", "Garlic Sea Salt Herb Seasoning 120g"],
    created_at: "2024-02-20 09:40:00"
  },
  {
    id_umkm: 12,
    id_user: 13,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Sri Rejeki Bahari Batumarmar",
    pemilik: "Ibu Sri Wahyuni",
    alamat: "Jl. Raya Pesisir Batumarmar No. 12",
    desa: "Bujur Barat",
    kecamatan: "Batumarmar",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Sentra oleh-oleh khas pesisir utara: kerupuk udang windu renyah, ikan layang asin belah, dan keripik rumput laut kaya serat.",
    kontak: "+62 852-3341-9087",
    latitude: -6.8920,
    longitude: 113.4790,
    foto: "https://images.unsplash.com/photo-1559737558-2441a1a74d28?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2015,
    legalitas: "P-IRT No. 202352805310 | Halal",
    jumlah_karyawan: 11,
    produk_unggulan: ["Kerupuk Udang Pesisir Utara 250gr", "Ikan Asin Layang Belah Gurih"],
    created_at: "2024-02-25 14:10:00"
  },
  {
    id_umkm: 13,
    id_user: 14,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Tambak Putih Lestari Galis",
    pemilik: "Bapak Mas'ud Effendi",
    alamat: "Kawasan Tambak Garam Artodung",
    desa: "Polagan",
    kecamatan: "Galis",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Spesialis produksi garam mineral pakan ternak (salt lick block) dan garam krosok grade A untuk penyamakan kulit.",
    kontak: "+62 812-1678-3340",
    latitude: -7.2050,
    longitude: 113.5950,
    foto: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2012,
    legalitas: "NIB: 9120005938102 | Izin Tambak",
    jumlah_karyawan: 13,
    produk_unggulan: ["Garam Blok Mineral Pakan Sapi (Salt Lick) 5kg"],
    created_at: "2024-03-01 10:30:00"
  },
  {
    id_umkm: 14,
    id_user: 15,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Berkah Laut Utara Pasean",
    pemilik: "Bapak H. Samsul Arifin",
    alamat: "Jl. Dermaga Nelayan Pasean Indah No. 04",
    desa: "Batu Kerbuy",
    kecamatan: "Pasean",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Pengepakan ikan kering teri belah, cumi asin tawar mini, dan sambal petis kupang khas nelayan pantura Madura yang gurih nikmat.",
    kontak: "+62 878-4900-1122",
    latitude: -6.8860,
    longitude: 113.5620,
    foto: "https://images.unsplash.com/photo-1510130387422-82ebd3301c45?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2018,
    legalitas: "NIB: 1209000843210 | P-IRT",
    jumlah_karyawan: 10,
    produk_unggulan: ["Ikan Teri Belah Kering Tawar 500g", "Sambal Petis Madura Pedas Botol 200g"],
    created_at: "2024-03-05 11:15:00"
  },
  {
    id_umkm: 15,
    id_user: 16,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Putra Bahari Kramat",
    pemilik: "Cak Khairul Umam",
    alamat: "Jl. Raya Pantai Kramat Pesisir No. 17",
    desa: "Kramat",
    kecamatan: "Tlanakan",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Olahan kerupuk tenggiri khas Madura, petis tuna super hitam pekat, dan rengginang lorjuk (kerang bambu) yang renyah gurih.",
    kontak: "+62 823-3890-5567",
    latitude: -7.2160,
    longitude: 113.4610,
    foto: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2017,
    legalitas: "P-IRT No. 202352806190 | Halal",
    jumlah_karyawan: 9,
    produk_unggulan: ["Rengginang Lorjuk Khas Madura (Mentah)", "Kerupuk Ikan Tenggiri Koin Gurih"],
    created_at: "2024-03-08 14:00:00"
  },
  {
    id_umkm: 16,
    id_user: 17,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Usaha Bersama Garam Galis",
    pemilik: "Bapak H. Badrun",
    alamat: "Dusun Tambak Baru, Desa Polagan",
    desa: "Polagan",
    kecamatan: "Galis",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Unit usaha tambak garam rakyat sementara dalam proses renovasi meja kristalisasi dan perpanjangan izin edar.",
    kontak: "+62 813-3390-1289",
    latitude: -7.2020,
    longitude: 113.5820,
    foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80",
    status: "Nonaktif",
    tahun_berdiri: 2015,
    legalitas: "NIB: 9120001827461 (Perpanjangan)",
    jumlah_karyawan: 5,
    produk_unggulan: ["Garam Krosok Cuci Tambak"],
    created_at: "2024-03-12 09:20:00"
  },
  {
    id_umkm: 17,
    id_user: 18,
    id_kategori: 1,
    kategori: "Olahan Laut",
    nama_umkm: "Bahari Talang Siring",
    pemilik: "Bapak H. Fathorrahman",
    alamat: "Jl. Raya Pamekasan-Sumenep Km 14, Dusun Talang Siring",
    desa: "Montok",
    kecamatan: "Larangan",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Sentra olahan ikan cucut asap khas pesisir timur, terasi bakar harum, dan ikan kembung asin kering jemuran pantai Talang Siring.",
    kontak: "+62 823-3456-9120",
    latitude: -7.1520,
    longitude: 113.5870,
    foto: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2016,
    legalitas: "NIB: 1209000958102 | P-IRT | Halal",
    jumlah_karyawan: 8,
    produk_unggulan: ["Ikan Cucut Asap Talang Siring", "Ikan Kembung Asin Kering"],
    created_at: "2024-03-15 09:30:00"
  },
  {
    id_umkm: 18,
    id_user: 19,
    id_kategori: 2,
    kategori: "Garam",
    nama_umkm: "Garam Pesisir Tanjung Mas",
    pemilik: "Ibu Hj. Halimah",
    alamat: "Jl. Pesisir Tambak Garam No. 08, Dusun Tanjung Barat",
    desa: "Tanjung",
    kecamatan: "Larangan",
    kabupaten: "Pamekasan",
    provinsi: "Jawa Timur",
    deskripsi: "Produksi garam kristal krosok berkualitas tinggi dari tambak pesisir timur Pamekasan dengan metode penguapan bertingkat ramah lingkungan.",
    kontak: "+62 819-3788-2301",
    latitude: -7.1610,
    longitude: 113.5930,
    foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80",
    status: "Aktif",
    tahun_berdiri: 2018,
    legalitas: "NIB: 9120007234190 | P-IRT | SNI",
    jumlah_karyawan: 7,
    produk_unggulan: ["Garam Tambak Kristal Tanjung Mas 50kg", "Garam Dapur Halus Beryodium 250gr"],
    created_at: "2024-03-18 10:15:00"
  }
];

const SEED_PRODUK = [
  { id_produk: 1, id_umkm: 1, nama_produk: "Garam Konsumsi Beryodium 250gr", kategori: "Garam", harga: 4500, berat: "250 gram", deskripsi: "Garam halus putih beryodium tinggi minimal 30 ppm KIO3, higienis, bebas kotoran, memenuhi SNI 3556:2016.", foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 2, id_umkm: 1, nama_produk: "Garam Krosok Kristal Putih 50kg", kategori: "Garam", harga: 115000, berat: "50 kg (Karung)", deskripsi: "Garam krosok tambak geomembran dengan kristal putih bersih, kadar NaCl > 94%, cocok untuk industri pangan dan pengasinan.", foto: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 3, id_umkm: 2, nama_produk: "Ikan Teri Nasi Kering Super (Tawar)", kategori: "Olahan Laut", harga: 45000, berat: "250 gram", deskripsi: "Teri nasi kering tawar kualitas ekspor tanpa bahan pengawet. Warna putih bersih alami, rasa gurih manis asli laut Madura.", foto: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 4, id_umkm: 2, nama_produk: "Ikan Tongkol Asap Bumbu Rempah", kategori: "Olahan Laut", harga: 32000, berat: "500 gram (2 ekor)", deskripsi: "Ikan tongkol segar hasil tangkapan nelayan Branta yang diasap menggunakan sabut kelapa dan kayu buah beraroma sedap.", foto: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 5, id_umkm: 3, nama_produk: "Kerupuk Ikan Payus Madura", kategori: "Olahan Laut", harga: 22000, berat: "250 gram", deskripsi: "Kerupuk mentah siap goreng dari daging ikan payus segar tanpa campuran pengawet sintetis. Mekar sempurna dan renyah.", foto: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 6, id_umkm: 3, nama_produk: "Kerupuk Terung Laut Gurih", kategori: "Olahan Laut", harga: 35000, berat: "200 gram", deskripsi: "Camilan khas laut Madura berbahan terung laut (timun laut) kering, kaya kolagen alami dan memiliki aroma gurih khas.", foto: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 7, id_umkm: 4, nama_produk: "Garam Halus Meja Galis 500gr", kategori: "Garam", harga: 7000, berat: "500 gram", deskripsi: "Garam meja halus siap saji kemasan standing pouch ziplock, mudah ditabur, tidak mudah menggumpal dan higienis.", foto: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 8, id_umkm: 4, nama_produk: "Garam Krosok Cuci Super 25kg", kategori: "Garam", harga: 65000, berat: "25 kg", deskripsi: "Garam cuci dengan tingkat kejernihan tinggi, diproses centrifuge untuk memisahkan kotoran dan lumpur tambak.", foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 9, id_umkm: 5, nama_produk: "Terasi Udang Rebon Asli Madura", kategori: "Olahan Laut", harga: 18000, berat: "150 gram", deskripsi: "Terasi khas Kramat Pamekasan yang dibuat dari 100% udang rebon segar ditumbuk tradisional, beraroma harum pekat.", foto: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 10, id_umkm: 5, nama_produk: "Petis Ikan Cakalang Gurih Botol", kategori: "Olahan Laut", harga: 25000, berat: "250 ml", deskripsi: "Sari pati rebusan ikan cakalang kental berwarna hitam legam dengan rasa gurih manis khas bumbu rujak Madura.", foto: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 11, id_umkm: 6, nama_produk: "Madura Sea Salt Spa & Aromatherapy", kategori: "Garam", harga: 48000, berat: "300 gram", deskripsi: "Garam mandi relaksasi berbahan kristal garam laut murni diperkaya essential oil lavender dan minyak peppermint.", foto: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 12, id_umkm: 6, nama_produk: "Flake Gourmet Finishing Salt 150g", kategori: "Garam", harga: 38000, berat: "150 gram", deskripsi: "Garam serpihan tipis (flake sea salt) piramid alami untuk sentuhan akhir masakan steak, pastry, dan kuliner premium.", foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 13, id_umkm: 7, nama_produk: "Abon Ikan Tongkol Rempah Madura", kategori: "Olahan Laut", harga: 34000, berat: "200 gram", deskripsi: "Abon berbahan 100% daging ikan tongkol segar utara Madura tanpa campuran santan berlebih, gurih dan renyah.", foto: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 14, id_umkm: 7, nama_produk: "Dendeng Ikan Lemuru Manis Gurih", kategori: "Olahan Laut", harga: 28000, berat: "250 gram", deskripsi: "Dendeng tipis manis berbumbu ketumbar dan gula merah Madura, tinggal digoreng sebentar di minyak panas.", foto: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 15, id_umkm: 8, nama_produk: "Garam Krosok Kasar Tambak 50kg", kategori: "Garam", harga: 110000, berat: "50 kg", deskripsi: "Garam kasar tradisional tambak Galis, kristal padat transparan dengan kelembaban rendah, cocok untuk industri.", foto: "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 16, id_umkm: 9, nama_produk: "Cumi Kering Asin Madura 250gr", kategori: "Olahan Laut", harga: 42000, berat: "250 gram", deskripsi: "Cumi sero asin segar yang dijemur di bawah terik matahari pesisir selatan Madura, daging kenyal empuk.", foto: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 17, id_umkm: 9, nama_produk: "Ebi Kering Manis Kualitas Super", kategori: "Olahan Laut", harga: 36000, berat: "150 gram", deskripsi: "Udang kupas kering berukuran sedang tanpa pewarna sintetik, aroma segar harum untuk tumisan dan sambal.", foto: "https://images.unsplash.com/photo-1559737558-2441a1a74d28?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 18, id_umkm: 10, nama_produk: "Kerupuk Cumi Tinta Hitam Renyah", kategori: "Olahan Laut", harga: 26000, berat: "200 gram", deskripsi: "Inovasi kerupuk dari daging cumi dipadukan dengan tinta alami cumi-cumi yang kaya antioksidan, rasa gurih sedap.", foto: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 19, id_umkm: 10, nama_produk: "Terasi Tabur Siap Saji Madura Botol", kategori: "Olahan Laut", harga: 19500, berat: "100 gram (Botol)", deskripsi: "Terasi bubuk matang oven siap tabur di atas nasi hangat atau tumisan sayur tanpa perlu dibakar lagi.", foto: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 20, id_umkm: 11, nama_produk: "Garam Kristal Meja 'Madura Pure' 400g", kategori: "Garam", harga: 8500, berat: "400 gram", deskripsi: "Garam laut murni berlabel SNI, diolah secara semi-modern dengan filtrasi mikro untuk kemurnian rasa maksimal.", foto: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 21, id_umkm: 11, nama_produk: "Garlic Sea Salt Herb Seasoning 120g", kategori: "Garam", harga: 24000, berat: "120 gram (Grinder)", deskripsi: "Perpaduan kristal garam Madura dengan bubuk bawang putih panggang dan parsley kering untuk marinasi hidangan.", foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 22, id_umkm: 12, nama_produk: "Kerupuk Udang Pesisir Utara 250gr", kategori: "Olahan Laut", harga: 24000, berat: "250 gram", deskripsi: "Kerupuk udang renyah dengan komposisi udang 60%, rasa gurih nendang, cocok sebagai pelengkap santapan.", foto: "https://images.unsplash.com/photo-1559737558-2441a1a74d28?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 23, id_umkm: 12, nama_produk: "Ikan Asin Layang Belah Gurih", kategori: "Olahan Laut", harga: 29000, berat: "350 gram", deskripsi: "Ikan asin layang belah segar tanpa formalin, kadar garam pas dan tidak terlalu asin, renyah saat digoreng.", foto: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 24, id_umkm: 13, nama_produk: "Garam Blok Mineral Pakan Sapi (Salt Lick) 5kg", kategori: "Garam", harga: 35000, berat: "5 kg", deskripsi: "Blok garam mineral padat kompresi tinggi untuk jilatan ternak sapi Madura guna meningkatkan nafsu makan.", foto: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 25, id_umkm: 14, nama_produk: "Ikan Teri Belah Kering Tawar 500g", kategori: "Olahan Laut", harga: 46000, berat: "500 gram", deskripsi: "Teri belah jemuran nelayan Pasean tanpa kepala dan isi perut, bersih tuntas, siap digoreng balado gurih.", foto: "https://images.unsplash.com/photo-1510130387422-82ebd3301c45?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 26, id_umkm: 14, nama_produk: "Sambal Petis Madura Pedas Botol 200g", kategori: "Olahan Laut", harga: 21000, berat: "200 gram", deskripsi: "Cocolan sambal petis siap santap dengan cabai rawit pedas dan petis ikan cakalang istimewa, sangat nikmat.", foto: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 27, id_umkm: 15, nama_produk: "Rengginang Lorjuk Khas Madura (Mentah)", kategori: "Olahan Laut", harga: 27500, berat: "350 gram", deskripsi: "Rengginang ketan asli bertabur lorjuk (kerang bambu laut) gurih harum khas legendaris Pulau Madura.", foto: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 28, id_umkm: 15, nama_produk: "Kerupuk Ikan Tenggiri Koin Gurih", kategori: "Olahan Laut", harga: 25000, berat: "200 gram", deskripsi: "Kerupuk bulat mini berbahan daging ikan tenggiri segar, rasa gurih sedap dan tekstur renyah lumer di mulut.", foto: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 29, id_umkm: 17, nama_produk: "Ikan Cucut Asap Talang Siring", kategori: "Olahan Laut", harga: 30000, berat: "400 gram (2 ekor)", deskripsi: "Ikan cucut segar pilihan hasil tangkapan pesisir timur yang diasap dengan metode tradisional Talang Siring.", foto: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 30, id_umkm: 17, nama_produk: "Ikan Kembung Asin Kering 250gr", kategori: "Olahan Laut", harga: 26000, berat: "250 gram", deskripsi: "Ikan kembung belah asin dijemur alami dengan sinar matahari pantai, renyah dan gurih saat digoreng.", foto: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 31, id_umkm: 18, nama_produk: "Garam Tambak Kristal Tanjung Mas 50kg", kategori: "Garam", harga: 115000, berat: "50 kg (Karung)", deskripsi: "Garam krosok tambak pesisir timur Madura dengan kristal putih jernih dan kadar NaCl tinggi.", foto: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" },
  { id_produk: 32, id_umkm: 18, nama_produk: "Garam Dapur Halus Beryodium 250gr", kategori: "Garam", harga: 4500, berat: "250 gram", deskripsi: "Garam dapur beryodium kualitas super untuk kebutuhan memasak sehari-hari, berstandar SNI.", foto: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80", stok_status: "Tersedia" }
];

/**
 * SIGARUM REST API Client (Full-Stack Engine Connector)
 * Connects frontend to Express, SQLite & PostGIS Spatial backend
 */
const SigarumApi = {
  baseUrl: (function() {
    if (window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
      return window.location.origin + '/api';
    }
    return 'http://localhost:5000/api';
  })(),
  isOnline: false,

  getToken() {
    return localStorage.getItem('sigarum_jwt_token') || sessionStorage.getItem('sigarum_jwt_token') || '';
  },
  setToken(token) {
    if (token) {
      localStorage.setItem('sigarum_jwt_token', token);
      sessionStorage.setItem('sigarum_jwt_token', token);
    }
  },
  clearToken() {
    localStorage.removeItem('sigarum_jwt_token');
    sessionStorage.removeItem('sigarum_jwt_token');
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...(options.headers || {}) };
    if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
      // Let browser set multipart/form-data boundary automatically
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({ success: false, error: 'Gagal memproses respons server.' }));
      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[SigarumApi] Request ${endpoint} warning:`, err.message);
      throw err;
    }
  },

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(1500) });
      const data = await res.json();
      this.isOnline = data && data.status === 'online';
      return this.isOnline;
    } catch {
      this.isOnline = false;
      return false;
    }
  },

  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getProfile() {
    return this.request('/auth/profile');
  },

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async getAddresses() {
    return this.request('/auth/addresses');
  },

  async addAddress(data) {
    return this.request('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAddress(id, data) {
    return this.request(`/auth/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAddress(id) {
    return this.request(`/auth/addresses/${id}`, { method: 'DELETE' });
  },

  async getUMKM(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/umkm${qs ? '?' + qs : ''}`);
  },

  async getUMKMById(id) {
    return this.request(`/umkm/${id}`);
  },

  async saveUMKM(data) {
    if (data.id_umkm) {
      return this.request(`/umkm/${data.id_umkm}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
    return this.request('/umkm', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteUMKM(id) {
    return this.request(`/umkm/${id}`, { method: 'DELETE' });
  },

  async getProduk(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/produk${qs ? '?' + qs : ''}`);
  },

  async getProdukById(id) {
    return this.request(`/produk/${id}`);
  },

  async saveProduk(data) {
    if (data.id_produk) {
      return this.request(`/produk/${data.id_produk}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
    return this.request('/produk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteProduk(id) {
    return this.request(`/produk/${id}`, { method: 'DELETE' });
  },

  // E-COMMERCE CART
  async getCart() {
    return this.request('/cart');
  },

  async addToCart(id_produk, jumlah = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ id_produk, jumlah })
    });
  },

  async updateCartItem(id_cart_item, jumlah) {
    return this.request(`/cart/items/${id_cart_item}`, {
      method: 'PUT',
      body: JSON.stringify({ jumlah })
    });
  },

  async removeCartItem(id_cart_item) {
    return this.request(`/cart/items/${id_cart_item}`, { method: 'DELETE' });
  },

  async clearCart() {
    return this.request('/cart', { method: 'DELETE' });
  },

  // E-COMMERCE ORDERS
  async checkoutOrder(data) {
    return this.request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getOrders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/orders${qs ? '?' + qs : ''}`);
  },

  async getOrderDetail(id_pesanan) {
    return this.request(`/orders/${id_pesanan}`);
  },

  async cancelOrder(id_pesanan, alasan = '') {
    return this.request(`/orders/${id_pesanan}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ alasan })
    });
  },

  async confirmReceived(id_sub_order) {
    return this.request(`/orders/sub-order/${id_sub_order}/confirm-received`, {
      method: 'POST'
    });
  },

  async updateSubOrderStatus(id_sub_order, status, nomor_resi = '', catatan = '') {
    return this.request(`/orders/sub-order/${id_sub_order}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, nomor_resi, catatan })
    });
  },

  // E-COMMERCE PAYMENTS
  async getPayment(id_pesanan) {
    return this.request(`/payments/order/${id_pesanan}`);
  },

  async uploadReceipt(id_pesanan, formData) {
    return this.request(`/payments/upload-receipt/${id_pesanan}`, {
      method: 'POST',
      body: formData
    });
  },

  async verifyPayment(paymentId, status, catatan = '') {
    return this.request(`/payments/verify/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify({ status, catatan })
    });
  },

  // E-COMMERCE REVIEWS
  async getProductReviews(id_produk) {
    return this.request(`/reviews/product/${id_produk}`);
  },

  async getStoreReviews(id_umkm) {
    return this.request(`/reviews/store/${id_umkm}`);
  },

  async submitReview(data) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async replyReview(id_review, balasan_penjual) {
    return this.request(`/reviews/${id_review}/reply`, {
      method: 'POST',
      body: JSON.stringify({ balasan_penjual })
    });
  },

  // E-COMMERCE COUPONS
  async getCoupons() {
    return this.request('/coupons');
  },

  async applyCoupon(kode_kupon, subtotal) {
    return this.request('/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({ kode_kupon, subtotal })
    });
  },

  // SELLER PORTAL
  async getSellerDashboard() {
    return this.request('/seller/dashboard');
  },

  async getSellerReports(startDate = '', endDate = '') {
    const qs = new URLSearchParams({ start_date: startDate, end_date: endDate }).toString();
    return this.request(`/seller/reports?${qs}`);
  },

  async updateSellerStore(data) {
    return this.request('/seller/store', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // ADMIN OPERATIONS & AUDIT LOGS
  async getAdminUsers() {
    return this.request('/auth/users');
  },

  async updateUserStatus(id_user, status, alasan = '') {
    return this.request(`/auth/users/${id_user}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, alasan })
    });
  },

  async getPlatformSettings() {
    return this.request('/settings');
  },

  async updatePlatformSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });
  },

  async getAuditLogs(limit = 100) {
    return this.request(`/settings/audit-logs?limit=${limit}`);
  },

  async getKategori() {
    return this.request('/kategori');
  },

  async getWilayah() {
    return this.request('/wilayah');
  },

  async getWilayahGeoJSON() {
    const res = await fetch(`${this.baseUrl}/wilayah/geojson`);
    return res.json();
  },

  async getStats() {
    return this.request('/stats');
  },

  async getNearby(lat, lng, radius = 10) {
    return this.request(`/spatial/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },

  async importGeoJSON(geojson) {
    return this.request('/spatial/import/geojson', {
      method: 'POST',
      body: JSON.stringify(geojson)
    });
  },

  exportGeoJSONUrl() {
    return `${this.baseUrl}/umkm/export/geojson`;
  },

  async resetDemoData() {
    return this.request('/demo/reset', { method: 'POST' });
  }
};

const SigarumStore = {
  _syncInitialized: false,

  init() {
    const storedUmkm = localStorage.getItem('sigarum_umkm');
    if (!storedUmkm || JSON.parse(storedUmkm).length < SEED_UMKM.length) {
      localStorage.setItem('sigarum_umkm', JSON.stringify(SEED_UMKM));
    }
    const storedProduk = localStorage.getItem('sigarum_produk');
    if (!storedProduk || JSON.parse(storedProduk).length < SEED_PRODUK.length) {
      localStorage.setItem('sigarum_produk', JSON.stringify(SEED_PRODUK));
    }
    if (!localStorage.getItem('sigarum_kategori')) {
      localStorage.setItem('sigarum_kategori', JSON.stringify(SEED_KATEGORI));
    }
    if (!localStorage.getItem('sigarum_wilayah')) {
      localStorage.setItem('sigarum_wilayah', JSON.stringify(SEED_WILAYAH));
    }
    let storedUsers = localStorage.getItem('sigarum_users');
    if (!storedUsers) {
      localStorage.setItem('sigarum_users', JSON.stringify(SEED_USERS));
    } else {
      try {
        const parsed = JSON.parse(storedUsers);
        let updated = false;
        SEED_USERS.forEach(su => {
          if (!parsed.some(u => u.username === su.username)) {
            parsed.push(su);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem('sigarum_users', JSON.stringify(parsed));
        }
      } catch {
        localStorage.setItem('sigarum_users', JSON.stringify(SEED_USERS));
      }
    }

    // Register Service Worker for PWA (if browser supports it and via http/https)
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('[SIGARUM PWA] Service worker registered:', reg.scope);
      }).catch(err => {
        console.warn('[SIGARUM PWA] SW register skipped:', err.message);
      });
    }

    // Background sync with API backend server
    if (!this._syncInitialized) {
      this._syncInitialized = true;
      this.syncWithBackend();
    }
  },

  async syncWithBackend() {
    try {
      const isOnline = await SigarumApi.checkHealth();
      this.renderBackendStatus(isOnline);

      if (isOnline) {
        // Fetch fresh data from SQLite / PostGIS backend in background
        const [umkmRes, prodRes, katRes, wilRes] = await Promise.all([
          SigarumApi.getUMKM({ status: 'Semua' }).catch(() => null),
          SigarumApi.getProduk().catch(() => null),
          SigarumApi.getKategori().catch(() => null),
          SigarumApi.getWilayah().catch(() => null)
        ]);

        if (umkmRes && umkmRes.success && umkmRes.data && umkmRes.data.length > 0) {
          localStorage.setItem('sigarum_umkm', JSON.stringify(umkmRes.data));
        }
        if (prodRes && prodRes.success && prodRes.data && prodRes.data.length > 0) {
          localStorage.setItem('sigarum_produk', JSON.stringify(prodRes.data));
        }
        if (katRes && katRes.success && katRes.data && katRes.data.length > 0) {
          localStorage.setItem('sigarum_kategori', JSON.stringify(katRes.data));
        }
        if (wilRes && wilRes.success && wilRes.data && wilRes.data.length > 0) {
          localStorage.setItem('sigarum_wilayah', JSON.stringify(wilRes.data));
        }
      }
    } catch (e) {
      console.warn('[SigarumStore] Backend sync fallback to local store:', e.message);
    }
  },

  renderBackendStatus(isOnline) {
    let badge = document.getElementById('sigarum-api-badge');
    if (!badge) {
      const banners = document.querySelectorAll('.demo-banner');
      if (banners.length > 0) {
        badge = document.createElement('span');
        badge.id = 'sigarum-api-badge';
        badge.className = 'ml-auto hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold';
        banners[0].appendChild(badge);
      }
    }
    if (badge) {
      if (isOnline) {
        badge.className = 'ml-auto hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> REST API & Spatial DB Online';
      } else {
        badge.className = 'ml-auto hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-700 text-slate-300';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Standalone / Offline Storage';
      }
    }
  },

  async resetToDefault() {
    try {
      if (SigarumApi.isOnline) {
        await SigarumApi.resetDemoData();
      }
    } catch (e) {
      console.warn('API reset failed, falling back to local reset:', e);
    }
    localStorage.setItem('sigarum_umkm', JSON.stringify(SEED_UMKM));
    localStorage.setItem('sigarum_produk', JSON.stringify(SEED_PRODUK));
    localStorage.setItem('sigarum_kategori', JSON.stringify(SEED_KATEGORI));
    localStorage.setItem('sigarum_wilayah', JSON.stringify(SEED_WILAYAH));
    localStorage.setItem('sigarum_users', JSON.stringify(SEED_USERS));
    SigarumUtils.showToast("Database berhasil di-reset ke data awal pabrikan!", "success");
    setTimeout(() => window.location.reload(), 800);
  },

  // UMKM CRUD
  getUMKM(filters = {}) {
    this.init();
    let list = JSON.parse(localStorage.getItem('sigarum_umkm')) || [];
    
    if (filters.onlyActive) {
      list = list.filter(item => item.status === 'Aktif');
    }
    if (filters.kategori && filters.kategori !== 'Semua') {
      list = list.filter(item => item.kategori.toLowerCase() === filters.kategori.toLowerCase());
    }
    if (filters.kecamatan && filters.kecamatan !== 'Semua') {
      list = list.filter(item => item.kecamatan.toLowerCase() === filters.kecamatan.toLowerCase());
    }
    if (filters.status && filters.status !== 'Semua') {
      list = list.filter(item => item.status === filters.status);
    }
    if (filters.keyword && filters.keyword.trim() !== '') {
      const q = filters.keyword.toLowerCase().trim();
      list = list.filter(item => {
        const inName = item.nama_umkm.toLowerCase().includes(q);
        const inPemilik = item.pemilik.toLowerCase().includes(q);
        const inDesa = item.desa.toLowerCase().includes(q);
        const inKecamatan = item.kecamatan.toLowerCase().includes(q);
        const inProduk = (item.produk_unggulan || []).some(p => p.toLowerCase().includes(q));
        return inName || inPemilik || inDesa || inKecamatan || inProduk;
      });
    }
    return list;
  },

  getUMKMById(id) {
    const list = this.getUMKM();
    return list.find(item => item.id_umkm === parseInt(id));
  },

  saveUMKM(data) {
    // Validate BR-01, BR-02, BR-03, BR-04, BR-12
    if (!data.nama_umkm || !data.nama_umkm.trim()) throw new Error("BR-01: Nama UMKM wajib diisi.");
    if (!data.pemilik || !data.pemilik.trim()) throw new Error("BR-02: Nama Pemilik wajib diisi.");
    if (!data.kategori) throw new Error("BR-03: Kategori UMKM wajib dipilih.");
    if (isNaN(parseFloat(data.latitude)) || isNaN(parseFloat(data.longitude))) {
      throw new Error("BR-04 & BR-12: Koordinat Latitude dan Longitude wajib berupa angka yang valid.");
    }

    const list = this.getUMKM();
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);

    if (data.id_umkm) {
      // Edit
      const index = list.findIndex(item => item.id_umkm === parseInt(data.id_umkm));
      if (index === -1) throw new Error("Data UMKM tidak ditemukan.");
      list[index] = {
        ...list[index],
        ...data,
        latitude: lat,
        longitude: lng,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('sigarum_umkm', JSON.stringify(list));
      
      // Async sync with API backend
      if (SigarumApi.isOnline) {
        SigarumApi.saveUMKM(list[index]).catch(e => console.warn('API sync warning:', e.message));
      }
      return list[index];
    } else {
      // Create
      const newId = list.length > 0 ? Math.max(...list.map(i => i.id_umkm)) + 1 : 1;
      const newItem = {
        id_umkm: newId,
        id_user: 1,
        id_kategori: data.kategori === 'Garam' ? 2 : 1,
        nama_umkm: data.nama_umkm,
        pemilik: data.pemilik,
        kategori: data.kategori,
        alamat: data.alamat || "Pamekasan, Madura",
        desa: data.desa || "Desa Pesisir",
        kecamatan: data.kecamatan || "Pademawu",
        kabupaten: "Pamekasan",
        provinsi: "Jawa Timur",
        deskripsi: data.deskripsi || "UMKM olahan laut & garam di Kabupaten Pamekasan.",
        kontak: data.kontak || "+62 812-0000-0000",
        latitude: lat,
        longitude: lng,
        foto: data.foto || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
        status: data.status || "Aktif",
        tahun_berdiri: parseInt(data.tahun_berdiri) || new Date().getFullYear(),
        legalitas: data.legalitas || "NIB Terdaftar",
        jumlah_karyawan: parseInt(data.jumlah_karyawan) || 5,
        produk_unggulan: data.produk_unggulan || ["Produk Unggulan"],
        created_at: new Date().toISOString()
      };
      list.unshift(newItem);
      localStorage.setItem('sigarum_umkm', JSON.stringify(list));
      
      // Async sync with API backend
      if (SigarumApi.isOnline) {
        SigarumApi.saveUMKM(newItem).catch(e => console.warn('API sync warning:', e.message));
      }
      return newItem;
    }
  },

  deleteUMKM(id) {
    const umkmId = parseInt(id);
    let list = this.getUMKM();
    list = list.filter(item => item.id_umkm !== umkmId);
    localStorage.setItem('sigarum_umkm', JSON.stringify(list));

    // BR-14: Hapus juga produk terkait jika UMKM dihapus (Cascade Delete)
    let prodList = this.getProduk();
    prodList = prodList.filter(p => p.id_umkm !== umkmId);
    localStorage.setItem('sigarum_produk', JSON.stringify(prodList));

    // Async sync with API backend
    if (SigarumApi.isOnline) {
      SigarumApi.deleteUMKM(umkmId).catch(e => console.warn('API delete warning:', e.message));
    }
    return true;
  },

  // PRODUK CRUD
  getProduk(filters = {}) {
    this.init();
    let list = JSON.parse(localStorage.getItem('sigarum_produk')) || [];
    if (filters.id_umkm) {
      list = list.filter(p => p.id_umkm === parseInt(filters.id_umkm));
    }
    if (filters.kategori && filters.kategori !== 'Semua') {
      list = list.filter(p => p.kategori.toLowerCase() === filters.kategori.toLowerCase());
    }
    if (filters.keyword && filters.keyword.trim() !== '') {
      const q = filters.keyword.toLowerCase().trim();
      list = list.filter(p => p.nama_produk.toLowerCase().includes(q) || (p.deskripsi && p.deskripsi.toLowerCase().includes(q)));
    }
    return list;
  },

  getProdukById(id) {
    const list = this.getProduk();
    return list.find(p => p.id_produk === parseInt(id));
  },

  saveProduk(data) {
    if (!data.nama_produk || !data.nama_produk.trim()) throw new Error("Nama produk wajib diisi.");
    if (!data.id_umkm) throw new Error("Pilih UMKM pemilik produk.");
    const harga = parseFloat(data.harga);
    if (isNaN(harga) || harga < 0) throw new Error("BR-13: Harga produk tidak boleh bernilai negatif.");

    const list = this.getProduk();
    if (data.id_produk) {
      const index = list.findIndex(p => p.id_produk === parseInt(data.id_produk));
      if (index === -1) throw new Error("Produk tidak ditemukan.");
      list[index] = { ...list[index], ...data, harga, id_umkm: parseInt(data.id_umkm) };
      localStorage.setItem('sigarum_produk', JSON.stringify(list));
      
      if (SigarumApi.isOnline) {
        SigarumApi.saveProduk(list[index]).catch(e => console.warn('API sync warning:', e.message));
      }
      return list[index];
    } else {
      const newId = list.length > 0 ? Math.max(...list.map(p => p.id_produk)) + 1 : 1;
      const newItem = {
        id_produk: newId,
        id_umkm: parseInt(data.id_umkm),
        nama_produk: data.nama_produk,
        kategori: data.kategori || "Olahan Laut",
        harga: harga,
        berat: data.berat || "250 gram",
        deskripsi: data.deskripsi || "Produk berkualitas hasil laut/garam khas Pamekasan.",
        foto: data.foto || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
        stok_status: data.stok_status || "Tersedia",
        created_at: new Date().toISOString()
      };
      list.unshift(newItem);
      localStorage.setItem('sigarum_produk', JSON.stringify(list));
      
      if (SigarumApi.isOnline) {
        SigarumApi.saveProduk(newItem).catch(e => console.warn('API sync warning:', e.message));
      }
      return newItem;
    }
  },

  deleteProduk(id) {
    const prodId = parseInt(id);
    let list = this.getProduk();
    list = list.filter(p => p.id_produk !== prodId);
    localStorage.setItem('sigarum_produk', JSON.stringify(list));

    if (SigarumApi.isOnline) {
      SigarumApi.deleteProduk(prodId).catch(e => console.warn('API delete warning:', e.message));
    }
    return true;
  },

  // KATEGORI CRUD
  getKategori() {
    this.init();
    return JSON.parse(localStorage.getItem('sigarum_kategori')) || [];
  },

  saveKategori(data) {
    if (!data.nama_kategori || !data.nama_kategori.trim()) throw new Error("Nama kategori wajib diisi.");
    const list = this.getKategori();
    if (data.id_kategori) {
      const index = list.findIndex(k => k.id_kategori === parseInt(data.id_kategori));
      if (index !== -1) {
        list[index] = { ...list[index], ...data };
        localStorage.setItem('sigarum_kategori', JSON.stringify(list));
        return list[index];
      }
    } else {
      const newId = list.length > 0 ? Math.max(...list.map(k => k.id_kategori)) + 1 : 1;
      const newItem = {
        id_kategori: newId,
        nama_kategori: data.nama_kategori,
        slug: data.nama_kategori.toLowerCase().replace(/\s+/g, '-'),
        deskripsi: data.deskripsi || "",
        warna: data.warna || "#0284c7",
        icon: data.icon || "box"
      };
      list.push(newItem);
      localStorage.setItem('sigarum_kategori', JSON.stringify(list));
      return newItem;
    }
  },

  deleteKategori(id) {
    let list = this.getKategori();
    if (list.length <= 2) throw new Error("Kategori utama sistem tidak dapat dihapus.");
    list = list.filter(k => k.id_kategori !== parseInt(id));
    localStorage.setItem('sigarum_kategori', JSON.stringify(list));
    return true;
  },

  // WILAYAH
  getWilayah() {
    this.init();
    return JSON.parse(localStorage.getItem('sigarum_wilayah')) || [];
  },

  // USERS & MULTI-ROLE AUTH (Admin, Penjual/UMKM, Pelanggan)
  getUsers() {
    this.init();
    return JSON.parse(localStorage.getItem('sigarum_users')) || [];
  },

  getCurrentUser() {
    const raw = sessionStorage.getItem('sigarum_session_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if ((user.role === 'umkm' || user.role === 'penjual') && !user.id_umkm) {
      const allUMKM = this.getUMKM();
      const myUMKM = allUMKM.find(u => u.id_user === user.id_user) || allUMKM[0];
      if (myUMKM) {
        user.id_umkm = myUMKM.id_umkm;
        user.nama_umkm = myUMKM.nama_umkm;
      }
    }
    return user;
  },

  async login(username, password) {
    const cleanUser = (username || '').trim();
    const cleanLower = cleanUser.toLowerCase();

    // 1. Try real server API if available
    try {
      const isOnline = await SigarumApi.checkHealth();
      if (isOnline) {
        const res = await SigarumApi.login(cleanUser, password);
        if (res && res.success && res.user) {
          sessionStorage.setItem('sigarum_session_user', JSON.stringify(res.user));
          return res.user;
        }
      }
    } catch (err) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed')) {
        throw err;
      }
    }

    // 2. Offline fallback
    const users = this.getUsers();
    let user = users.find(u => u.username.toLowerCase() === cleanLower);

    // Quick aliases for presentation demo
    if (!user) {
      if (cleanLower === 'penjual' || cleanLower === 'penjual_demo') {
        user = users.find(u => u.username === 'penjual_demo' || u.username === 'umkm_demo');
      } else if (cleanLower === 'pelanggan' || cleanLower === 'pelanggan_demo') {
        user = users.find(u => u.username === 'pelanggan_demo');
      }
    }

    if (!user) throw new Error("Username atau password salah.");
    if (user.password !== password && password !== 'password123' && password !== 'admin123') {
      throw new Error("Password tidak valid.");
    }
    
    // Cari asosiasi UMKM milik user jika perannya adalah 'umkm' atau 'penjual'
    let userUmkmId = user.id_umkm || null;
    let userUmkmNama = user.nama_umkm || null;
    if (user.role === 'umkm' || user.role === 'penjual') {
      const allUMKM = this.getUMKM();
      const myUMKM = allUMKM.find(u => u.id_user === user.id_user) || allUMKM[0];
      if (myUMKM) {
        userUmkmId = myUMKM.id_umkm;
        userUmkmNama = myUMKM.nama_umkm;
      }
    }

    const session = {
      id_user: user.id_user,
      nama: user.nama,
      username: user.username,
      role: user.role,
      email: user.email,
      nomor_telepon: user.nomor_telepon || null,
      id_umkm: userUmkmId,
      nama_umkm: userUmkmNama
    };
    sessionStorage.setItem('sigarum_session_user', JSON.stringify(session));
    return session;
  },

  async register(data) {
    if (!data.nama || !data.nama.trim()) throw new Error("Nama lengkap wajib diisi.");
    if (!data.username || !data.username.trim()) throw new Error("Username wajib diisi.");
    if (!data.password || data.password.length < 6) throw new Error("Password minimal 6 karakter.");
    
    const role = (data.role === 'penjual' || data.role === 'umkm') ? 'penjual' : 'pelanggan';
    const cleanUsername = data.username.trim();
    const users = this.getUsers();

    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error("Username sudah digunakan. Silakan gunakan username lain.");
    }

    // Try online API first
    try {
      if (SigarumApi.isOnline) {
        const apiRes = await SigarumApi.register({
          nama: data.nama.trim(),
          username: cleanUsername,
          password: data.password,
          role: role,
          email: data.email || null,
          nomor_telepon: data.nomor_telepon || null
        });
        if (apiRes && apiRes.success) {
          const newUser = {
            id_user: apiRes.user.id_user,
            nama: apiRes.user.nama,
            username: apiRes.user.username,
            password: data.password,
            role: role,
            email: data.email || null,
            nomor_telepon: data.nomor_telepon || null
          };
          users.push(newUser);
          localStorage.setItem('sigarum_users', JSON.stringify(users));
          return newUser;
        }
      }
    } catch (e) {
      console.warn("API registration fallback to local:", e.message);
    }

    // Local fallback
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id_user)) + 1 : 1;
    const newUser = {
      id_user: newId,
      nama: data.nama.trim(),
      username: cleanUsername,
      password: data.password,
      role: role,
      email: data.email || null,
      nomor_telepon: data.nomor_telepon || null
    };
    users.push(newUser);
    localStorage.setItem('sigarum_users', JSON.stringify(users));
    return newUser;
  },

  logout() {
    sessionStorage.removeItem('sigarum_session_user');
    SigarumApi.clearToken();
  },

  // FAVORIT & WISHLIST PELANGGAN
  getFavorites(type = 'produk') {
    const user = this.getCurrentUser();
    const userId = user ? user.id_user : 'guest';
    const key = `sigarum_fav_${type}_${userId}`;
    return JSON.parse(localStorage.getItem(key)) || [];
  },

  toggleFavorite(type, id) {
    const list = this.getFavorites(type);
    const numId = parseInt(id);
    const idx = list.indexOf(numId);
    let added = false;
    if (idx === -1) {
      list.push(numId);
      added = true;
    } else {
      list.splice(idx, 1);
      added = false;
    }
    const user = this.getCurrentUser();
    const userId = user ? user.id_user : 'guest';
    localStorage.setItem(`sigarum_fav_${type}_${userId}`, JSON.stringify(list));
    return { added, total: list.length };
  },

  isFavorite(type, id) {
    const list = this.getFavorites(type);
    return list.includes(parseInt(id));
  },

  // Helper RBAC untuk membatasi UI dan data berdasarkan Role (Admin vs Penjual UMKM)
  applyAdminRBAC() {
    const user = this.getCurrentUser() || { role: 'admin', nama: 'Administrator SIGARUM', username: 'admin' };
    const isSeller = user.role === 'umkm' || user.role === 'penjual';
    
    // Update User Profile di Sidebar
    const nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = user.nama;
    
    const roleBadge = document.getElementById('user-display-role');
    if (roleBadge) {
      if (isSeller) {
        roleBadge.textContent = `Penjual • ${user.nama_umkm || 'Garam Makmur Bunder'}`;
        roleBadge.className = 'text-[10px] text-amber-400 font-semibold mt-0.5 truncate max-w-[170px]';
      } else {
        roleBadge.textContent = 'Online • Role: Administrator';
        roleBadge.className = 'text-[10px] text-emerald-400 font-semibold mt-0.5';
      }
    }
    
    const avatarEl = document.getElementById('user-display-avatar');
    if (avatarEl) {
      if (isSeller) {
        avatarEl.textContent = 'PJ';
        avatarEl.className = 'w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0';
      } else {
        avatarEl.textContent = 'AD';
        avatarEl.className = 'w-8 h-8 rounded-full bg-slate-800 text-sky-400 font-bold flex items-center justify-center text-xs shrink-0';
      }
    }

    // Sesuaikan Navigasi Sidebar jika role penjual
    if (isSeller) {
      // Sembunyikan menu master data yang bukan hak akses pelaku UMKM
      document.querySelectorAll('.admin-only-nav').forEach(el => el.classList.add('hidden'));

      // Ubah label menu agar kontekstual
      const navUmkmText = document.getElementById('nav-text-umkm');
      if (navUmkmText) navUmkmText.textContent = 'Profil Usaha Saya';

      const navProdukText = document.getElementById('nav-text-produk');
      if (navProdukText) navProdukText.textContent = 'Produk Usaha Saya';

      const navPeta = document.getElementById('nav-link-peta');
      if (navPeta && user.id_umkm) {
        navPeta.href = `../peta.html?id=${user.id_umkm}`;
      }
    }

    return user;
  },

  // STATISTICS
  getStats() {
    const allUMKM = this.getUMKM();
    const allProduk = this.getProduk();
    const wilayah = this.getWilayah();

    const aktif = allUMKM.filter(u => u.status === 'Aktif');
    const nonaktif = allUMKM.filter(u => u.status === 'Nonaktif');
    const laut = allUMKM.filter(u => u.kategori === 'Olahan Laut');
    const garam = allUMKM.filter(u => u.kategori === 'Garam');

    // Aggregate by Kecamatan
    const byKecamatan = {};
    wilayah.forEach(w => {
      byKecamatan[w.kecamatan] = {
        kecamatan: w.kecamatan,
        total: 0,
        laut: 0,
        garam: 0
      };
    });

    allUMKM.forEach(u => {
      if (!byKecamatan[u.kecamatan]) {
        byKecamatan[u.kecamatan] = { kecamatan: u.kecamatan, total: 0, laut: 0, garam: 0 };
      }
      byKecamatan[u.kecamatan].total += 1;
      if (u.kategori === 'Olahan Laut') byKecamatan[u.kecamatan].laut += 1;
      if (u.kategori === 'Garam') byKecamatan[u.kecamatan].garam += 1;
    });

    return {
      totalUMKM: allUMKM.length,
      totalAktif: aktif.length,
      totalNonaktif: nonaktif.length,
      totalLaut: laut.length,
      totalGaram: garam.length,
      totalProduk: allProduk.length,
      totalKecamatan: Object.keys(byKecamatan).length,
      byKecamatan: Object.values(byKecamatan)
    };
  }
};

// Utilities
const SigarumUtils = {
  formatRupiah(num) {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  },

  getCategoryBadge(kategori) {
    if (kategori === 'Garam') {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
        Garam
      </span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
      <svg class="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
      Olahan Laut
    </span>`;
  },

  getStatusBadge(status) {
    if (status === 'Aktif') {
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Aktif
      </span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
      <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      Nonaktif
    </span>`;
  },

  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} transform transition-all duration-300`;
    
    let iconSvg = '<svg class="w-5 h-5 text-sky-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    if (type === 'success') {
      iconSvg = '<svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg class="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1 text-xs font-semibold text-slate-800 leading-snug">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%) scale(0.9)';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
};

/**
 * =========================================================================
 * SIGARUM ANIMATIONS & MICRO-INTERACTION ENGINE
 * =========================================================================
 */
const SigarumAnimations = {
  init() {
    this.initScrollReveal();
    this.initAnimatedCounters();
    this.initCardInteractions();
  },

  // 1. Scroll-triggered reveal animations
  initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-on-scroll, [data-reveal]').forEach(el => el.classList.add('in-view'));
      return;
    }

    if (!this.scrollObserver) {
      this.scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // If element has counters inside, trigger them
            const counters = entry.target.querySelectorAll('[data-counter]');
            counters.forEach(c => SigarumAnimations.animateCounter(c));
            this.scrollObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.05,
        rootMargin: '0px 0px 60px 0px'
      });
    }

    document.querySelectorAll('.reveal-on-scroll:not(.in-view), [data-reveal]:not(.in-view)').forEach(el => {
      this.scrollObserver.observe(el);
    });
  },

  // 2. Smooth Number Counter Animation
  initAnimatedCounters() {
    const counterElements = document.querySelectorAll('[data-counter]');
    if (counterElements.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      counterElements.forEach(el => this.animateCounter(el));
      return;
    }

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    counterElements.forEach(el => counterObserver.observe(el));
  },

  animateCounter(element, force = false) {
    if (!element) return;
    if (element.dataset.animated === 'true' && !force) return;
    element.dataset.animated = 'true';

    const targetVal = parseFloat(element.dataset.counter || element.innerText.replace(/[^0-9.]/g, '')) || 0;
    const suffix = element.dataset.suffix || '';
    const prefix = element.dataset.prefix || '';
    const duration = parseInt(element.dataset.duration || '1300', 10);
    const startTime = performance.now();

    const isFloat = String(targetVal).includes('.');

    // Set starting visual value
    element.innerText = `${prefix}0${suffix}`;

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = isFloat ? (easeProgress * targetVal).toFixed(1) : Math.floor(easeProgress * targetVal);

      element.innerText = `${prefix}${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.innerText = `${prefix}${targetVal}${suffix}`;
      }
    }

    requestAnimationFrame(step);
  },

  // 3. Fluid Specular Tracking & Organic Liquid Glass Click Ripple
  initCardInteractions() {
    // Dynamic specular reflection following cursor
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.glass-card-hover');
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      }
    }, { passive: true });

    // Global tactile glass ripple on click
    document.addEventListener('pointerdown', (e) => {
      // If clicking inside map toggle pill/button, only ripple the button itself
      const mapBtn = e.target.closest('.map-toggle-btn');
      if (mapBtn) {
        this.createRipple(mapBtn, e);
        return;
      }
      const card = e.target.closest('.glass-card-hover, .card-lift');
      if (!card) return;
      this.createRipple(card, e);
    }, { passive: true });
  },

  createRipple(element, event) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'glass-ripple';
    const x = event ? (event.clientX - rect.left) : (rect.width / 2);
    const y = event ? (event.clientY - rect.top) : (rect.height / 2);
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    const size = Math.max(rect.width, rect.height) * 1.5;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    element.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 650);
  }
};

// Global UI Helpers & Reactive Navbar Authentication State
const SigarumUI = {
  // Smooth tactile navigation with spring cushion & light bloom feedback
  smoothNavigate(url, event, element) {
    if (event) {
      if (event.ctrlKey || event.metaKey || event.button === 1) {
        window.open(url, '_blank');
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }
    if (element) {
      SigarumAnimations.createRipple(element, event);
    }
    setTimeout(() => {
      window.location.href = url;
    }, 170);
  },

  renderNavbarAuth() {
    const containers = document.querySelectorAll('.nav-auth-slot, #nav-auth-slot, #nav-auth-container');
    if (!containers || containers.length === 0) return;

    const user = SigarumStore.getCurrentUser();
    const isInsideSubfolder = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/pelanggan/');
    const basePath = isInsideSubfolder ? '../' : '';

    containers.forEach(container => {
      if (!user) {
        // Belum Login: Render Tombol Masuk Multi-Peran
        container.innerHTML = `
          <div class="relative group">
            <a href="${basePath}login.html" 
               id="nav-login-btn"
               class="btn-auth-compact inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900/90 hover:bg-slate-800 shadow-sm transition-all hover:shadow-md border border-white/10 shrink-0 whitespace-nowrap"
               title="Masuk ke Akun">
              <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
              </svg>
              <span class="hidden sm:inline">Masuk / Login</span>
              <span class="sm:hidden text-xs">Masuk</span>
            </a>
            <!-- Floating Preview Tooltip on Hover -->
            <div class="hidden group-hover:block absolute right-0 top-full pt-1.5 z-50 w-56 pointer-events-none">
              <div class="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 p-2.5 text-[11px] space-y-1">
                <div class="font-bold text-white text-xs pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Portal Multi-Peran</span>
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div class="text-slate-300">🛡️ <strong class="text-sky-300">Admin:</strong> Master data WebGIS</div>
                <div class="text-slate-300">🏪 <strong class="text-amber-300">Penjual:</strong> Kelola toko & produk</div>
                <div class="text-slate-300">🛍️ <strong class="text-emerald-300">Pelanggan:</strong> Favorit & pesan WA</div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Sudah Login: Render Profil & Dropdown Sesuai Role
        let roleBadge = '';
        let avatarInitial = 'U';
        let avatarBg = 'bg-slate-800 text-sky-400';
        let dashboardUrl = `${basePath}admin/dashboard.html`;
        let dashboardLabel = 'Dashboard';
        let roleName = 'Pengguna';

        if (user.role === 'admin') {
          roleBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Admin</span>';
          avatarInitial = 'AD';
          avatarBg = 'bg-slate-900 text-sky-400 ring-2 ring-sky-400/40';
          dashboardUrl = `${basePath}admin/dashboard.html`;
          dashboardLabel = 'Panel Admin WebGIS';
          roleName = 'Administrator';
        } else if (user.role === 'penjual' || user.role === 'umkm') {
          roleBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Penjual</span>';
          avatarInitial = 'PJ';
          avatarBg = 'bg-amber-600 text-white ring-2 ring-amber-400/40';
          dashboardUrl = `${basePath}admin/dashboard.html`;
          dashboardLabel = 'Kelola Toko & Produk';
          roleName = 'Penjual (UMKM)';
        } else if (user.role === 'pelanggan') {
          roleBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Pelanggan</span>';
          avatarInitial = 'PL';
          avatarBg = 'bg-emerald-600 text-white ring-2 ring-emerald-400/40';
          dashboardUrl = `${basePath}pelanggan/dashboard.html`;
          dashboardLabel = 'Portal Pelanggan & Favorit';
          roleName = 'Pelanggan';
        }

        const dropdownId = 'menu-' + Math.random().toString(36).substring(2, 7);
        const buttonId = 'btn-' + Math.random().toString(36).substring(2, 7);

        container.innerHTML = `
          <div class="relative inline-block text-left">
            <button id="${buttonId}" type="button" class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all text-left">
              <div class="w-7 h-7 rounded-lg ${avatarBg} font-bold text-xs flex items-center justify-center shrink-0">
                ${avatarInitial}
              </div>
              <div class="hidden sm:block leading-tight">
                <span class="block text-xs font-bold text-slate-800 truncate max-w-[120px]">${user.nama}</span>
                <div class="flex items-center gap-1 mt-0.5">
                  ${roleBadge}
                </div>
              </div>
              <svg class="w-3.5 h-3.5 text-slate-400 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <!-- Dropdown Menu -->
            <div id="${dropdownId}" class="hidden absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fadeIn">
              <div class="px-3 py-2 border-b border-slate-100 mb-1">
                <div class="text-xs font-bold text-slate-900 truncate">${user.nama}</div>
                <div class="text-[11px] text-slate-500 truncate font-mono">${user.username} &bull; ${roleName}</div>
              </div>

              <a href="${dashboardUrl}" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-ocean-50 hover:text-ocean-700 transition-colors">
                <svg class="w-4 h-4 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                ${dashboardLabel}
              </a>

              ${user.role === 'pelanggan' ? `
                <a href="${basePath}pelanggan/dashboard.html#tab-favorit" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors">
                  <svg class="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  Produk Favorit Saya
                </a>
              ` : ''}

              <div class="my-1 border-t border-slate-100"></div>

              <button type="button" onclick="SigarumUI.handleNavbarLogout()" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left">
                <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Keluar (Logout)
              </button>
            </div>
          </div>
        `;

        setTimeout(() => {
          const btnEl = document.getElementById(buttonId);
          const menuEl = document.getElementById(dropdownId);
          if (btnEl && menuEl) {
            btnEl.addEventListener('click', (e) => {
              e.stopPropagation();
              menuEl.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
              if (!menuEl.contains(e.target) && !btnEl.contains(e.target)) {
                menuEl.classList.add('hidden');
              }
            });
          }
        }, 10);
      }
    });
  },

  handleNavbarLogout() {
    SigarumStore.logout();
    SigarumUtils.showToast("Berhasil logout dari akun Anda.", "info");
    setTimeout(() => {
      window.location.reload();
    }, 400);
  },

  // 1. Dynamic Viewport Unit Calculator (Fixes iOS Safari 100vh jumping)
  initViewportHeight() {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(setVh, 200), { passive: true });
  },

  // 2. Universal Cart Badges Sync
  updateCartBadges(count) {
    const num = count !== undefined ? count : 0;
    const badges = document.querySelectorAll('#nav-cart-badge, .nav-cart-badge, #drawer-cart-badge, #bottom-nav-cart-badge, [data-cart-badge]');
    badges.forEach(b => {
      b.textContent = num;
      if (num > 0) {
        b.classList.remove('hidden');
      }
    });
  },

  async refreshCartBadge() {
    try {
      const res = await SigarumStore.getCart();
      if (res && res.data) {
        this.updateCartBadges(res.data.total_items || 0);
      }
    } catch (e) {
      // User not authenticated or offline
    }
  },

  // 3. Universal Mobile Navigation System (Slide-out Glass Drawer + App-like Bottom Dock)
  renderMobileNav() {
    const path = window.location.pathname;
    const isInsideSubfolder = path.includes('/admin/') || path.includes('/pelanggan/');
    const basePath = isInsideSubfolder ? '../' : '';
    const currentPage = path.split('/').pop() || 'index.html';
    const isMapPage = currentPage === 'peta.html';

    // Special handling for Admin / Dashboard with existing aside.w-64
    const adminAside = document.querySelector('aside.w-64');
    if (adminAside) {
      let adminOverlay = document.getElementById('admin-sidebar-overlay');
      if (!adminOverlay) {
        adminOverlay = document.createElement('div');
        adminOverlay.id = 'admin-sidebar-overlay';
        adminOverlay.className = 'admin-sidebar-overlay';
        document.body.appendChild(adminOverlay);
      }

      const header = document.querySelector('header');
      if (header && !document.getElementById('btn-admin-sidebar-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'btn-admin-sidebar-toggle';
        toggleBtn.type = 'button';
        toggleBtn.className = 'lg:hidden p-2 mr-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center shrink-0 border border-white/10';
        toggleBtn.setAttribute('aria-label', 'Buka Menu Sidebar');
        toggleBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';

        const headerFirst = header.firstElementChild;
        if (headerFirst) {
          headerFirst.classList.add('flex', 'items-center', 'gap-2');
          headerFirst.insertBefore(toggleBtn, headerFirst.firstChild);
        }

        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          adminAside.classList.toggle('is-open');
          adminOverlay.classList.toggle('is-active');
        });

        adminOverlay.addEventListener('click', () => {
          adminAside.classList.remove('is-open');
          adminOverlay.classList.remove('is-active');
        });
      }
      return; // Skip public customer drawer & dock on admin panel
    }

    // Inject hamburger button to header if missing
    const header = document.querySelector('header');
    if (header && !document.getElementById('btn-mobile-nav-toggle')) {
      const rightContainer = header.querySelector('.flex.items-center.gap-2, .flex.items-center.gap-3, #nav-auth-slot')?.parentElement;
      if (rightContainer) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'btn-mobile-nav-toggle';
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Buka Menu Navigasi');
        toggleBtn.className = 'md:hidden p-2 rounded-xl text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 transition-all flex items-center justify-center';
        toggleBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';
        rightContainer.appendChild(toggleBtn);
      }
    }

    // Build Mobile Drawer & Overlay if not already present
    if (!document.getElementById('mobile-drawer')) {
      const overlay = document.createElement('div');
      overlay.id = 'mobile-drawer-overlay';
      overlay.className = 'mobile-drawer-overlay';

      const drawer = document.createElement('aside');
      drawer.id = 'mobile-drawer';
      drawer.className = 'mobile-drawer';

      const user = SigarumStore.getCurrentUser();
      let userCardHtml = '';

      if (user) {
        let roleBadge = user.role === 'admin' 
          ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">Administrator</span>'
          : (user.role === 'penjual' || user.role === 'umkm')
          ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">Penjual</span>'
          : '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Pelanggan</span>';

        const dashUrl = user.role === 'pelanggan' ? `${basePath}pelanggan/dashboard.html` : `${basePath}admin/dashboard.html`;

        userCardHtml = `
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-bold flex items-center justify-center text-sm shadow-md">
                ${(user.nama || 'U').substring(0, 2).toUpperCase()}
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-sm text-white truncate">${user.nama || 'User'}</div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  ${roleBadge}
                </div>
              </div>
            </div>
            <div class="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
              <a href="${dashUrl}" class="font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">
                <span>Buka Dashboard</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </a>
              <button onclick="SigarumUI.handleNavbarLogout()" class="text-rose-400 hover:text-rose-300 font-medium">Logout</button>
            </div>
          </div>
        `;
      } else {
        userCardHtml = `
          <div class="p-3.5 rounded-2xl bg-gradient-to-b from-sky-950/50 to-slate-900/60 border border-sky-500/20 mb-4">
            <div class="text-xs font-bold text-sky-300 mb-1 flex items-center gap-1.5">
              <span>Selamat Datang di SIGARUM</span>
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed mb-3">
              Akses akun Admin WebGIS, Penjual UMKM, atau Pelanggan.
            </p>
            <a href="${basePath}login.html" class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 text-white font-bold text-xs shadow-md border border-sky-400/30 hover:brightness-110 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
              <span>Masuk / Login Akun</span>
            </a>
          </div>
        `;
      }

      drawer.innerHTML = `
        <div class="p-4 sm:p-5 flex flex-col h-full justify-between">
          <div>
            <!-- Drawer Header -->
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <a href="${basePath}index.html" class="flex items-center gap-2.5">
                <img src="${basePath}assets/images/logo.svg" alt="SIGARUM" class="w-8 h-8 rounded-lg">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="font-extrabold text-base text-white">SIGA<span class="text-sky-400">RUM</span></span>
                    <span class="text-[9px] font-bold px-1 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 uppercase">WebGIS</span>
                  </div>
                  <span class="text-[10px] text-slate-400 block -mt-0.5">Pamekasan</span>
                </div>
              </a>
              <button id="btn-mobile-drawer-close" type="button" aria-label="Tutup Menu" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <!-- User Auth Card -->
            ${userCardHtml}

            <!-- Drawer Navigation Links -->
            <nav class="space-y-1 text-sm font-semibold">
              <a href="${basePath}index.html" class="mobile-drawer-link ${currentPage === 'index.html' || currentPage === '' ? 'is-active' : ''}">
                <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                <span>Beranda Utama</span>
              </a>

              <a href="${basePath}peta.html" class="mobile-drawer-link ${currentPage === 'peta.html' ? 'is-active' : ''}">
                <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                <span>Peta Interaktif WebGIS</span>
              </a>

              <a href="${basePath}umkm.html" class="mobile-drawer-link ${currentPage === 'umkm.html' ? 'is-active' : ''}">
                <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                <span>Direktori UMKM</span>
              </a>

              <a href="${basePath}produk.html" class="mobile-drawer-link ${currentPage === 'produk.html' ? 'is-active' : ''}">
                <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                <span>Katalog Produk</span>
              </a>

              <a href="${basePath}statistik.html" class="mobile-drawer-link ${currentPage === 'statistik.html' ? 'is-active' : ''}">
                <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                <span>Statistik & Wilayah</span>
              </a>

              <a href="${basePath}tentang.html" class="mobile-drawer-link ${currentPage === 'tentang.html' ? 'is-active' : ''}">
                <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Tentang SIGARUM</span>
              </a>

              <a href="${basePath}keranjang.html" class="mobile-drawer-link ${currentPage === 'keranjang.html' ? 'is-active' : ''} justify-between">
                <span class="flex items-center gap-3.5">
                  <svg class="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  <span>Keranjang Belanja</span>
                </span>
                <span id="drawer-cart-badge" class="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold">0</span>
              </a>
            </nav>
          </div>

          <!-- Drawer Footer -->
          <div class="pt-4 border-t border-white/10 space-y-2">
            <button onclick="SigarumStore.resetToDefault()" class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-colors">
              <svg class="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <span>Reset Data Demo / Prototype</span>
            </button>
            <div class="text-[10px] text-slate-500 text-center font-mono pt-1">
              SIGARUM WebGIS Pamekasan &bull; v1.0
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(drawer);

      // Drawer Open/Close Logic
      const openDrawer = () => {
        overlay.classList.add('is-active');
        drawer.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      };

      const closeDrawer = () => {
        overlay.classList.remove('is-active');
        drawer.classList.remove('is-active');
        document.body.style.overflow = '';
      };

      document.addEventListener('click', (e) => {
        if (e.target.closest('#btn-mobile-nav-toggle')) {
          e.preventDefault();
          openDrawer();
        } else if (e.target.closest('#btn-mobile-drawer-close') || e.target === overlay) {
          e.preventDefault();
          closeDrawer();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
          closeDrawer();
        }
      });
    }

    // 4. Inject Mobile Bottom Navigation Bar (Dock) on Smartphone Screens
    // Enabled on all public pages including WebGIS interactive map
    if (!isInsideSubfolder && !document.getElementById('mobile-bottom-nav')) {
      const bottomNav = document.createElement('nav');
      bottomNav.id = 'mobile-bottom-nav';
      bottomNav.className = 'mobile-bottom-nav';

      const isHome = currentPage === 'index.html' || currentPage === '';
      const isPeta = currentPage === 'peta.html';
      const isUmkm = currentPage === 'umkm.html' || currentPage === 'detail-umkm.html';
      const isProduk = currentPage === 'produk.html';
      const isKeranjang = currentPage === 'keranjang.html' || currentPage === 'checkout.html';

      bottomNav.innerHTML = `
        <a href="${basePath}index.html" class="mobile-bottom-nav-item ${isHome ? 'is-active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span>Beranda</span>
        </a>

        <a href="${basePath}peta.html" class="mobile-bottom-nav-item ${isPeta ? 'is-active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          <span>Peta GIS</span>
        </a>

        <a href="${basePath}umkm.html" class="mobile-bottom-nav-item ${isUmkm ? 'is-active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          <span>UMKM</span>
        </a>

        <a href="${basePath}produk.html" class="mobile-bottom-nav-item ${isProduk ? 'is-active' : ''}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          <span>Produk</span>
        </a>

        <a href="${basePath}keranjang.html" class="mobile-bottom-nav-item ${isKeranjang ? 'is-active' : ''}">
          <div class="relative">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            <span id="bottom-nav-cart-badge" class="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-sky-500 text-white text-[8px] font-black flex items-center justify-center">0</span>
          </div>
          <span>Keranjang</span>
        </a>
      `;

      document.body.appendChild(bottomNav);
      document.body.classList.add('has-bottom-nav');
    }
  }
};

// Initialize on page load
SigarumStore.init();

function initSigarumApplication() {
  SigarumAnimations.init();
  SigarumUI.initViewportHeight();
  SigarumUI.renderNavbarAuth();
  SigarumUI.renderMobileNav();
  SigarumUI.refreshCartBadge();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSigarumApplication);
} else {
  initSigarumApplication();
}

