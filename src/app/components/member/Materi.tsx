import { useState, useEffect } from "react";
import { FileText, Video, Presentation, Play, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { GlassCard, RED, AMBER } from "../aptrg/shared";
import { DivTag } from "./MemberLayout";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthContext } from "../../context/AuthContext";
import { toast } from "sonner";
import type { Material, MaterialFormat, MaterialCategory } from "../../types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { DIV_COLORS, DivKey } from "./data";

const DIVS: (MaterialCategory | "Semua")[] = [
  "Semua",
  "Mekanik",
  "Sistem",
  "GCS",
  "Non-Technical",
  "Umum",
];
const FORMATS: (MaterialFormat | "Semua")[] = ["Semua", "Dokumen", "Video", "Slide"];

const FMT_ICON: Record<MaterialFormat, typeof FileText> = {
  Dokumen: FileText,
  Video: Video,
  Slide: Presentation,
};

const divColor = (d: MaterialCategory) =>
  d === "Umum" ? "#857a75" : (DIV_COLORS[d as DivKey] || "#857a75");

export function Materi() {
  const { role } = useAuthContext();
  const isAdmin = role === "admin" || role === "asisten";

  const [div, setDiv] = useState<(typeof DIVS)[number]>("Semua");
  const [fmt, setFmt] = useState<(typeof FORMATS)[number]>("Semua");

  const [data, setData] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Material>>({
    title: "",
    format: "Dokumen",
    kategori_divisi: "Umum",
    url_link: "",
    meta_info: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dbData, error } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat materi: " + error.message);
    } else {
      setData(dbData || []);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      format: "Dokumen",
      kategori_divisi: "Umum",
      url_link: "",
      meta_info: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Material) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      format: item.format,
      kategori_divisi: item.kategori_divisi,
      url_link: item.url_link,
      meta_info: item.meta_info,
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
    
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
    } else {
      toast.success("Materi berhasil dihapus");
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = { ...formData };

    let error;
    if (editingId) {
      const res = await supabase.from("materials").update(payload).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("materials").insert(payload);
      error = res.error;
    }

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Materi berhasil disimpan");
      setIsModalOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const list = data.filter(
    (m) =>
      (div === "Semua" || m.kategori_divisi === div) &&
      (fmt === "Semua" || m.format === fmt)
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Filter sidebar */}
      <GlassCard className="h-fit p-5">
        {isAdmin && (
          <div className="mb-5 border-b border-gray-100 pb-5">
            <button
              onClick={openCreateModal}
              className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
              style={{ background: RED, boxShadow: "0 4px 14px -3px rgba(200,30,44,0.35)" }}
            >
              <Plus className="h-4 w-4" /> Tambah Materi
            </button>
          </div>
        )}
        <FilterGroup label="Divisi" options={DIVS} value={div} onChange={setDiv} />
        <div className="my-4 h-px bg-gray-100" />
        <FilterGroup label="Format" options={FORMATS} value={fmt} onChange={setFmt} />
      </GlassCard>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#857a75]" />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 content-start">
          {list.map((m) => {
            const Icon = FMT_ICON[m.format as MaterialFormat] || FileText;
            const c = divColor(m.kategori_divisi);
            return (
              <GlassCard key={m.id} className="overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.1)] relative group flex flex-col h-full">
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 z-10">
                    <button onClick={() => openEditModal(m)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-300" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-300" title="Hapus">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                
                <a href={m.url_link} target="_blank" rel="noreferrer" className="block outline-none">
                  <div
                    className="relative flex h-32 items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${c}22, ${AMBER}22)` }}
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg"
                      style={{ background: c }}
                    >
                      <Icon className="h-7 w-7" />
                    </div>
                    {m.format === "Video" && (
                      <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#c81e2c] shadow">
                        <Play className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </a>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between">
                    <DivTag label={m.kategori_divisi} color={c} />
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                      style={{ background: RED }}
                    >
                      {m.format}
                    </span>
                  </div>
                  <a href={m.url_link} target="_blank" rel="noreferrer" className="mt-2.5 block outline-none hover:underline decoration-[#2a2320]">
                    <h3 className="text-sm font-bold tracking-tight text-[#1a1614] line-clamp-2">
                      {m.title}
                    </h3>
                  </a>
                  <div className="mt-1.5 text-[12px] text-gray-400">{m.meta_info}</div>
                  {m.description && (
                    <p className="mt-3 text-[12px] text-gray-500 line-clamp-3">{m.description}</p>
                  )}
                </div>
              </GlassCard>
            );
          })}
          {list.length === 0 && (
            <div className="col-span-full py-14 text-center text-sm text-gray-400">
              Data materi belum tersedia.
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Materi" : "Tambah Materi"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            <div className="space-y-1.5">
              <Label>Judul Materi</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Modul Dasar Elektronika"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori Divisi</Label>
                <Select
                  value={formData.kategori_divisi}
                  onValueChange={(val: MaterialCategory) => setFormData({ ...formData, kategori_divisi: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mekanik">Mekanik</SelectItem>
                    <SelectItem value="Sistem">Sistem</SelectItem>
                    <SelectItem value="GCS">GCS</SelectItem>
                    <SelectItem value="Non-Technical">Non-Technical</SelectItem>
                    <SelectItem value="Umum">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Format File</Label>
                <Select
                  value={formData.format}
                  onValueChange={(val: MaterialFormat) => setFormData({ ...formData, format: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dokumen">Dokumen (PDF, Docs)</SelectItem>
                    <SelectItem value="Slide">Slide (PPTX)</SelectItem>
                    <SelectItem value="Video">Video (MP4, YouTube)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>URL/Link Materi Eksternal</Label>
              <Input
                required
                type="url"
                value={formData.url_link}
                onChange={(e) => setFormData({ ...formData, url_link: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Keterangan Singkat (Meta)</Label>
              <Input
                required
                value={formData.meta_info}
                onChange={(e) => setFormData({ ...formData, meta_info: e.target.value })}
                placeholder="Contoh: 12 Halaman / 15:30 Menit"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Deskripsi (Opsional)</Label>
              <Textarea
                rows={3}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi materi..."
              />
            </div>

            <DialogFooter className="mt-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-[#cbced4] hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50"
                style={{ background: RED }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Simpan Perubahan" : "Tambah"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </div>
      <div className="space-y-0.5">
        {options.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              onClick={() => onChange(o)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-300 ease-in-out"
              style={{
                background: on ? "rgba(200,30,44,0.07)" : "transparent",
                color: on ? "#1a1614" : "#6b6460",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{ background: on ? RED : "rgba(0,0,0,0.12)" }}
              />
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
