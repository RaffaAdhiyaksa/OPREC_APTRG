export type DivKey = "Mekanik" | "Sistem" | "GCS" | "Non-Technical";

export const DIV_COLORS: Record<DivKey, string> = {
  Mekanik: "#c81e2c",
  Sistem: "#2f7dd1",
  GCS: "#3aa66f",
  "Non-Technical": "#e3a548",
};

export type Meeting = {
  id: string;
  title: string;
  date: string; // ISO date
  time: string;
  location: string;
  division: DivKey;
  attendees: string[];
};

export const MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Review Desain Airframe v2",
    date: "2026-07-15",
    time: "16:00 - 17:30",
    location: "Lab Fabrikasi, Lt. 3",
    division: "Mekanik",
    attendees: ["RA", "DP", "SW", "FN"],
  },
  {
    id: "m2",
    title: "Integrasi Flight Controller",
    date: "2026-07-17",
    time: "13:00 - 15:00",
    location: "Ruang Avionik, Lt. 3",
    division: "Sistem",
    attendees: ["BK", "AL", "RA"],
  },
  {
    id: "m3",
    title: "Sprint Planning GCS Dashboard",
    date: "2026-07-20",
    time: "10:00 - 11:30",
    location: "Ruang Diskusi 2",
    division: "GCS",
    attendees: ["TP", "MN", "DP", "AL", "SW"],
  },
  {
    id: "m4",
    title: "Rapat Koordinasi Kompetisi",
    date: "2026-07-22",
    time: "15:30 - 17:00",
    location: "Aula Riset Teknik",
    division: "Non-Technical",
    attendees: ["FN", "MN", "BK"],
  },
];

export type Project = {
  id: string;
  title: string;
  division: DivKey;
  progress: number;
  team: string[];
  due: string;
  status: "todo" | "doing" | "done";
};

export const PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Fabrikasi Sayap Komposit",
    division: "Mekanik",
    progress: 0,
    team: ["RA", "DP"],
    due: "5 Agu 2026",
    status: "todo",
  },
  {
    id: "p2",
    title: "Kalibrasi Sensor IMU",
    division: "Sistem",
    progress: 0,
    team: ["BK", "AL"],
    due: "1 Agu 2026",
    status: "todo",
  },
  {
    id: "p3",
    title: "Modul Telemetri Real-time",
    division: "Sistem",
    progress: 60,
    team: ["AL", "RA", "BK"],
    due: "28 Jul 2026",
    status: "doing",
  },
  {
    id: "p4",
    title: "GCS Map Overlay",
    division: "GCS",
    progress: 45,
    team: ["TP", "MN"],
    due: "30 Jul 2026",
    status: "doing",
  },
  {
    id: "p5",
    title: "Dokumentasi SOP Uji Terbang",
    division: "Non-Technical",
    progress: 100,
    team: ["FN", "SW"],
    due: "10 Jul 2026",
    status: "done",
  },
  {
    id: "p6",
    title: "Desain Mounting Payload",
    division: "Mekanik",
    progress: 100,
    team: ["DP", "RA"],
    due: "8 Jul 2026",
    status: "done",
  },
];

export type Announcement = {
  id: string;
  title: string;
  meta: string;
  unread: boolean;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "Jadwal uji terbang perdana minggu depan",
    meta: "Koordinator Lab · 2 jam lalu",
    unread: true,
  },
  {
    id: "a2",
    title: "Pengumpulan laporan progres tubes divisi",
    meta: "Divisi Sistem · 1 hari lalu",
    unread: true,
  },
  {
    id: "a3",
    title: "Sesi sertifikasi soldering avionik dibuka",
    meta: "Mentor Divisi · 3 hari lalu",
    unread: false,
  },
];

export type Doc = {
  id: string;
  title: string;
  category: string;
};

export const DOCS: Doc[] = [
  { id: "d1", title: "Panduan Aerodinamika Dasar UAV", category: "Mekanik" },
  { id: "d2", title: "Setup PX4 & Mission Planner", category: "Sistem" },
  { id: "d3", title: "Protokol Komunikasi MAVLink", category: "GCS" },
  { id: "d4", title: "SOP Keselamatan Uji Terbang", category: "Umum" },
];

export type SkillBadge = { id: string; name: string; unlocked: boolean };

export const SKILLS: SkillBadge[] = [
  { id: "s1", name: "Soldering Avionik", unlocked: true },
  { id: "s2", name: "CAD Airframe", unlocked: true },
  { id: "s3", name: "Tuning PID", unlocked: false },
  { id: "s4", name: "Ground Station Ops", unlocked: false },
];

/* ---------- Member directory ---------- */
export type MemberStatus = "asisten" | "magang";

export type Member = {
  id: string;
  name: string;
  initials: string;
  division: DivKey;
  status: MemberStatus;
  angkatan: string;
  nim: string;
  role: string;
  joinDate: string;
  bio: string;
  email: string;
  phone: string;
  skills: string[];
  progress: { kehadiran: number; tubes: number; sertifikasi: number; dokumentasi: number };
  attendance: number[]; // 12 weeks, 0-3 intensity
  projects: { title: string; status: "todo" | "doing" | "done" }[];
};

export const MEMBERS: Member[] = [
  {
    id: "u1",
    name: "Rangga Aditya",
    initials: "RA",
    division: "Mekanik",
    status: "magang",
    angkatan: "2024",
    nim: "24/531001",
    role: "Anggota Magang",
    joinDate: "12 Feb 2026",
    bio: "Fokus pada desain airframe komposit dan fabrikasi struktur ringan untuk wahana UAV.",
    email: "rangga.a@student.ac.id",
    phone: "0812-3456-7890",
    skills: ["Soldering Avionik", "CAD Airframe"],
    progress: { kehadiran: 82, tubes: 50, sertifikasi: 50, dokumentasi: 7 },
    attendance: [2, 3, 1, 3, 2, 0, 3, 2, 3, 1, 2, 3],
    projects: [
      { title: "Fabrikasi Sayap Komposit", status: "todo" },
      { title: "Desain Mounting Payload", status: "done" },
    ],
  },
  {
    id: "u2",
    name: "Dewi Pratiwi",
    initials: "DP",
    division: "Mekanik",
    status: "asisten",
    angkatan: "2023",
    nim: "23/518220",
    role: "Asisten Lab",
    joinDate: "5 Mar 2025",
    bio: "Asisten divisi Mekanik, membimbing anggota magang dalam proses fabrikasi dan uji struktur.",
    email: "dewi.p@student.ac.id",
    phone: "0813-1122-3344",
    skills: ["CAD Airframe", "Uji Struktur", "3D Printing"],
    progress: { kehadiran: 95, tubes: 100, sertifikasi: 100, dokumentasi: 21 },
    attendance: [3, 3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 3],
    projects: [
      { title: "Desain Mounting Payload", status: "done" },
      { title: "Fabrikasi Sayap Komposit", status: "doing" },
    ],
  },
  {
    id: "u3",
    name: "Bagus Kurniawan",
    initials: "BK",
    division: "Sistem",
    status: "magang",
    angkatan: "2024",
    nim: "24/532110",
    role: "Anggota Magang",
    joinDate: "12 Feb 2026",
    bio: "Tertarik pada flight controller, tuning PID, dan integrasi sensor avionik.",
    email: "bagus.k@student.ac.id",
    phone: "0857-9988-7766",
    skills: ["Soldering Avionik"],
    progress: { kehadiran: 73, tubes: 25, sertifikasi: 25, dokumentasi: 4 },
    attendance: [1, 2, 0, 2, 1, 2, 0, 3, 1, 2, 1, 2],
    projects: [{ title: "Kalibrasi Sensor IMU", status: "todo" }],
  },
  {
    id: "u4",
    name: "Aisyah Lestari",
    initials: "AL",
    division: "Sistem",
    status: "asisten",
    angkatan: "2023",
    nim: "23/519405",
    role: "Asisten Lab",
    joinDate: "5 Mar 2025",
    bio: "Asisten divisi Sistem, spesialisasi telemetri real-time dan firmware avionik.",
    email: "aisyah.l@student.ac.id",
    phone: "0812-5566-7788",
    skills: ["Tuning PID", "Firmware", "MAVLink"],
    progress: { kehadiran: 91, tubes: 100, sertifikasi: 100, dokumentasi: 18 },
    attendance: [3, 2, 3, 3, 3, 2, 3, 3, 3, 3, 2, 3],
    projects: [{ title: "Modul Telemetri Real-time", status: "doing" }],
  },
  {
    id: "u5",
    name: "Taufik Prasetyo",
    initials: "TP",
    division: "GCS",
    status: "magang",
    angkatan: "2024",
    nim: "24/533221",
    role: "Anggota Magang",
    joinDate: "12 Feb 2026",
    bio: "Mengembangkan antarmuka ground control station dan visualisasi peta misi.",
    email: "taufik.p@student.ac.id",
    phone: "0821-3344-5566",
    skills: ["React", "MAVLink"],
    progress: { kehadiran: 68, tubes: 50, sertifikasi: 25, dokumentasi: 5 },
    attendance: [2, 1, 2, 0, 2, 1, 2, 2, 1, 0, 2, 1],
    projects: [{ title: "GCS Map Overlay", status: "doing" }],
  },
  {
    id: "u6",
    name: "Maya Nabila",
    initials: "MN",
    division: "GCS",
    status: "asisten",
    angkatan: "2022",
    nim: "22/501877",
    role: "Asisten Lab",
    joinDate: "1 Sep 2024",
    bio: "Asisten divisi GCS, memimpin pengembangan dashboard pemantauan misi.",
    email: "maya.n@student.ac.id",
    phone: "0813-7788-9900",
    skills: ["React", "Ground Station Ops", "UI/UX"],
    progress: { kehadiran: 97, tubes: 100, sertifikasi: 100, dokumentasi: 25 },
    attendance: [3, 3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 2],
    projects: [{ title: "GCS Map Overlay", status: "doing" }],
  },
  {
    id: "u7",
    name: "Fajar Nugroho",
    initials: "FN",
    division: "Non-Technical",
    status: "magang",
    angkatan: "2024",
    nim: "24/534332",
    role: "Anggota Magang",
    joinDate: "12 Feb 2026",
    bio: "Menangani dokumentasi, manajemen kompetisi, dan hubungan eksternal lab.",
    email: "fajar.n@student.ac.id",
    phone: "0856-2233-4455",
    skills: ["Dokumentasi", "Manajemen"],
    progress: { kehadiran: 79, tubes: 75, sertifikasi: 50, dokumentasi: 12 },
    attendance: [2, 3, 2, 2, 3, 1, 2, 3, 2, 2, 3, 2],
    projects: [{ title: "Dokumentasi SOP Uji Terbang", status: "done" }],
  },
  {
    id: "u8",
    name: "Sari Wulandari",
    initials: "SW",
    division: "Non-Technical",
    status: "asisten",
    angkatan: "2022",
    nim: "22/502991",
    role: "Asisten Lab",
    joinDate: "1 Sep 2024",
    bio: "Asisten Non-Technical, mengelola pendanaan, media, dan koordinasi kompetisi nasional.",
    email: "sari.w@student.ac.id",
    phone: "0812-9911-2233",
    skills: ["Manajemen", "Media", "Fundraising"],
    progress: { kehadiran: 93, tubes: 100, sertifikasi: 100, dokumentasi: 30 },
    attendance: [3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 3, 3],
    projects: [{ title: "Dokumentasi SOP Uji Terbang", status: "done" }],
  },
];

/* ---------- Knowledge base materials ---------- */
export type MatFormat = "Dokumen" | "Video" | "Slide";
export type Material = {
  id: string;
  title: string;
  division: DivKey | "Umum";
  format: MatFormat;
  meta: string;
};

export const MATERIALS: Material[] = [
  { id: "mt1", title: "Panduan Aerodinamika Dasar UAV", division: "Mekanik", format: "Dokumen", meta: "PDF · 24 hlm" },
  { id: "mt2", title: "Workshop Fabrikasi Komposit", division: "Mekanik", format: "Video", meta: "42 menit" },
  { id: "mt3", title: "Setup PX4 & Mission Planner", division: "Sistem", format: "Dokumen", meta: "PDF · 18 hlm" },
  { id: "mt4", title: "Tuning PID untuk Multirotor", division: "Sistem", format: "Slide", meta: "36 slide" },
  { id: "mt5", title: "Protokol Komunikasi MAVLink", division: "GCS", format: "Dokumen", meta: "PDF · 15 hlm" },
  { id: "mt6", title: "Membangun Dashboard GCS", division: "GCS", format: "Video", meta: "58 menit" },
  { id: "mt7", title: "Manajemen Tim & Kompetisi", division: "Non-Technical", format: "Slide", meta: "28 slide" },
  { id: "mt8", title: "SOP Keselamatan Uji Terbang", division: "Umum", format: "Dokumen", meta: "PDF · 12 hlm" },
  { id: "mt9", title: "Orientasi Anggota Baru APTRG", division: "Umum", format: "Video", meta: "31 menit" },
];

/* ---------- Announcements (feed) ---------- */
export type AnnCategory = "Rapat" | "OPREC" | "Umum" | "Deadline";
export type FeedItem = {
  id: string;
  title: string;
  body: string;
  category: AnnCategory;
  author: string;
  time: string;
  pinned: boolean;
};

export const FEED: FeedItem[] = [
  {
    id: "f1",
    title: "Uji Terbang Perdana Prototipe UAV-V2",
    body: "Uji terbang dijadwalkan Sabtu, 19 Juli 2026 di lapangan kampus. Seluruh divisi wajib hadir untuk persiapan H-1.",
    category: "Rapat",
    author: "Koordinator Lab",
    time: "2 jam lalu",
    pinned: true,
  },
  {
    id: "f2",
    title: "Deadline Laporan Progres Tubes Divisi",
    body: "Kumpulkan laporan progres tugas besar masing-masing divisi paling lambat 25 Juli 2026 melalui portal.",
    category: "Deadline",
    author: "Divisi Sistem",
    time: "1 hari lalu",
    pinned: true,
  },
  {
    id: "f3",
    title: "Open Recruitment 2026 Gelombang 2 Dibuka",
    body: "Pendaftaran gelombang kedua kini dibuka. Bantu sebarkan informasi ke calon anggota berbakat.",
    category: "OPREC",
    author: "Tim Rekrutmen",
    time: "2 hari lalu",
    pinned: false,
  },
  {
    id: "f4",
    title: "Sesi Sertifikasi Soldering Avionik",
    body: "Sesi sertifikasi keterampilan soldering avionik dibuka untuk anggota magang divisi Sistem & Mekanik.",
    category: "Umum",
    author: "Mentor Divisi",
    time: "3 hari lalu",
    pinned: false,
  },
  {
    id: "f5",
    title: "Rapat Koordinasi Kompetisi Nasional",
    body: "Rapat persiapan kontes UAV nasional akan dilaksanakan pekan depan. Detail agenda menyusul via email.",
    category: "Rapat",
    author: "Non-Technical",
    time: "4 hari lalu",
    pinned: false,
  },
];

/* ---------- Org structure ---------- */
export const ORG = {
  head: { name: "Dr. Ir. Hendra Wijaya", role: "Ketua Lab APTRG", initials: "HW" },
  divisions: [
    {
      name: "Mekanik",
      lead: { name: "Dewi Pratiwi", role: "Kepala Divisi", initials: "DP" },
      members: [
        { name: "Rangga Aditya", role: "Anggota Magang", initials: "RA" },
      ],
    },
    {
      name: "Sistem",
      lead: { name: "Aisyah Lestari", role: "Kepala Divisi", initials: "AL" },
      members: [
        { name: "Bagus Kurniawan", role: "Anggota Magang", initials: "BK" },
      ],
    },
    {
      name: "GCS",
      lead: { name: "Maya Nabila", role: "Kepala Divisi", initials: "MN" },
      members: [
        { name: "Taufik Prasetyo", role: "Anggota Magang", initials: "TP" },
      ],
    },
    {
      name: "Non-Technical",
      lead: { name: "Sari Wulandari", role: "Kepala Divisi", initials: "SW" },
      members: [
        { name: "Fajar Nugroho", role: "Anggota Magang", initials: "FN" },
      ],
    },
  ],
};

/* ---------- Struktur Panitia OPREC 2026 ---------- */
// Catatan: ini struktur panitia open recruitment (PDD, Acara, Logistik,
// Medpart), BEDA dengan struktur divisi riset lab (Mekanik/Sistem/GCS/
// Non-Technical) di atas. Makanya dikasih tipe & warna sendiri, gak numpang
// ke DivKey/DIV_COLORS supaya gak bentrok sama data Member/Meeting/Project.
export type OprecDivKey = "PDD" | "Acara" | "Logistik" | "Medpart";

export const OPREC_DIV_COLORS: Record<OprecDivKey, string> = {
  PDD: "#c81e2c",
  Acara: "#2f7dd1",
  Logistik: "#3aa66f",
  Medpart: "#e3a548",
};

export type OrgPerson = { name: string; role: string; initials: string };

export const STRUKTUR_OPREC: {
  head: OrgPerson;
  divisions: {
    name: OprecDivKey;
    ketua: OrgPerson;
    wakil?: OrgPerson;
    staff: OrgPerson[];
  }[];
} = {
  head: { name: "Afif Afsaruddin", role: "Ketua OPREC 2026", initials: "AA" },
  divisions: [
    {
      name: "PDD",
      ketua: { name: "Almer", role: "Ketua Divisi", initials: "AL" },
      staff: [
        { name: "Sherly", role: "Staff", initials: "SH" },
        { name: "Icha", role: "Staff", initials: "IC" },
        { name: "Mirza", role: "Staff", initials: "MI" },
        { name: "Natan", role: "Staff", initials: "NA" },
        { name: "Wafa", role: "Staff", initials: "WA" },
        { name: "Bani", role: "Staff", initials: "BA" },
      ],
    },
    {
      name: "Acara",
      ketua: { name: "Daffa", role: "Ketua Divisi", initials: "DA" },
      wakil: { name: "Deden", role: "Wakil Ketua", initials: "DE" },
      staff: [
        { name: "Alfa", role: "Staff", initials: "AL" },
        { name: "Aldo", role: "Staff", initials: "AD" },
        { name: "Zieta", role: "Staff", initials: "ZI" },
        { name: "Azky", role: "Staff", initials: "AZ" },
        { name: "Dean", role: "Staff", initials: "DN" },
        { name: "Richo", role: "Staff", initials: "RI" },
        { name: "Frans", role: "Staff", initials: "FR" },
      ],
    },
    {
      name: "Logistik",
      ketua: { name: "Ardika", role: "Ketua Divisi", initials: "AR" },
      wakil: { name: "Sulthon", role: "Wakil Ketua", initials: "SU" },
      staff: [
        { name: "Vacha", role: "Staff", initials: "VA" },
        { name: "Patar", role: "Staff", initials: "PA" },
        { name: "Nino", role: "Staff", initials: "NI" },
        { name: "Albin", role: "Staff", initials: "AB" },
        { name: "Ersha", role: "Staff", initials: "ER" },
        { name: "Alfi", role: "Staff", initials: "AF" },
        { name: "Rasyid", role: "Staff", initials: "RS" },
        { name: "Arfa", role: "Staff", initials: "AF" },
      ],
    },
    {
      name: "Medpart",
      ketua: { name: "Achmad Raffa", role: "Ketua Divisi", initials: "AR" },
      wakil: { name: "Azriel", role: "Wakil Ketua", initials: "AZ" },
      staff: [
        { name: "Rega", role: "Staff", initials: "RE" },
        { name: "Darma", role: "Staff", initials: "DR" },
        { name: "Doni", role: "Staff", initials: "DO" },
        { name: "Adit", role: "Staff", initials: "AD" },
        { name: "Glad", role: "Staff", initials: "GL" },
        { name: "Arkan", role: "Staff", initials: "AK" },
        { name: "Hafiz", role: "Staff", initials: "HF" },
      ],
    },
  ],
};

/* ---------- Asisten Lab: mentees ---------- */
export const MENTEES = MEMBERS.filter((m) => m.status === "magang").map((m) => ({
  id: m.id,
  name: m.name,
  initials: m.initials,
  division: m.division,
  progress: Math.round(
    (m.progress.kehadiran + m.progress.tubes + m.progress.sertifikasi) / 3
  ),
}));

/* ---------- Admin: OPREC pipeline & activity ---------- */
export const OPREC_PIPELINE = [
  { stage: "Pendaftaran", count: 142 },
  { stage: "Seleksi Administrasi", count: 98 },
  { stage: "Wawancara", count: 54 },
  { stage: "Pengumuman", count: 32 },
  { stage: "Onboarding Magang", count: 28 },
];

export const ACTIVITY = [
  { id: "ac1", text: "Aisyah Lestari menyetujui laporan tubes Modul Telemetri.", time: "15 menit lalu", who: "AL" },
  { id: "ac2", text: "12 pendaftar baru menyelesaikan seleksi administrasi.", time: "1 jam lalu", who: "SY" },
  { id: "ac3", text: "Jadwal rapat GCS Sprint Planning diperbarui.", time: "3 jam lalu", who: "MN" },
  { id: "ac4", text: "Pengumuman uji terbang perdana dipublikasikan.", time: "5 jam lalu", who: "HW" },
  { id: "ac5", text: "Fajar Nugroho mengunggah dokumen SOP baru.", time: "1 hari lalu", who: "FN" },
];

/* Progress menuju Asisten Lab */
export const PROGRESS = {
  overall: 62,
  kehadiran: { value: 82, label: "9 dari 11 rapat" },
  tubes: { value: 50, label: "2 dari 4 tubes" },
  sertifikasi: { value: 50, label: "2 dari 4 skill" },
  dokumentasi: { count: 7, label: "kontribusi dokumen" },
};
