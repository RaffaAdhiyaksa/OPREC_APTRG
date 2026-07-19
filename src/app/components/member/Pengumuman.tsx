import { useState, useEffect } from "react";
import { Pin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { GlassCard, RED } from "../aptrg/shared";
import { Avatar } from "./MemberLayout";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthContext } from "../../context/AuthContext";
import { toast } from "sonner";
import type { Announcement, AnnouncementCategory } from "../../types/database";
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
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

const CAT_COLORS: Record<AnnouncementCategory, string> = {
  Rapat: "#2f7dd1",
  OPREC: "#c81e2c",
  Umum: "#857a75",
  Deadline: "#e3a548",
};

const FILTERS: (AnnouncementCategory | "Semua")[] = [
  "Semua",
  "Rapat",
  "OPREC",
  "Umum",
  "Deadline",
];

export function Pengumuman() {
  const { role, profile } = useAuthContext();
  const isAdmin = role === "admin" || role === "asisten";

  const [cat, setCat] = useState<(typeof FILTERS)[number]>("Semua");
  const [data, setData] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: "",
    content: "",
    category: "Umum",
    is_pinned: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dbData, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat pengumuman: " + error.message);
    } else {
      setData(dbData || []);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      category: "Umum",
      is_pinned: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      is_pinned: item.is_pinned,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) return;
    
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
    } else {
      toast.success("Pengumuman berhasil dihapus");
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      is_pinned: formData.is_pinned,
      author: editingId ? undefined : (profile?.nama || "Admin"), // Jangan timpa author saat edit
    };

    let error;
    if (editingId) {
      const res = await supabase.from("announcements").update(payload).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("announcements").insert(payload);
      error = res.error;
    }

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Pengumuman berhasil disimpan");
      setIsModalOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const list = data.filter((f) => cat === "Semua" || f.category === cat).sort(
    (a, b) => Number(b.is_pinned) - Number(a.is_pinned)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const on = cat === f;
            return (
              <button
                key={f}
                onClick={() => setCat(f)}
                className="rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300 ease-in-out"
                style={{
                  background: on ? RED : "white",
                  color: on ? "#fff" : "#6b6460",
                  border: on ? "none" : "1px solid rgba(0,0,0,0.06)",
                  boxShadow: on ? "0 2px 8px -2px rgba(200,30,44,0.3)" : "0 1px 3px -1px rgba(0,0,0,0.04)",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
            style={{ background: RED, boxShadow: "0 4px 14px -3px rgba(200,30,44,0.35)" }}
          >
            <Plus className="h-4 w-4" /> Tambah Pengumuman
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#857a75]" />
        </div>
      ) : list.length === 0 ? (
        <div className="py-14 text-center text-sm text-gray-400">
          Belum ada data pengumuman.
        </div>
      ) : (
        list.map((f) => (
          <GlassCard
            key={f.id}
            className="p-7 relative group hover:scale-[1.01] cursor-default"
            style={
              f.is_pinned
                ? { borderLeft: `4px solid ${RED}` }
                : undefined
            }
          >
            {isAdmin && (
              <div className="absolute top-5 right-5 flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                <button onClick={() => openEditModal(f)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-300" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(f.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-300" title="Hapus">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                  style={{ background: CAT_COLORS[f.category as AnnouncementCategory] || "#857a75" }}
                >
                  {f.category}
                </span>
                {f.is_pinned && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#c81e2c]">
                    <Pin className="h-3.5 w-3.5" /> Disematkan
                  </span>
                )}
              </div>
              <span className="text-[12px] text-[#857a75]">
                {new Date(f.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h3 className="mt-4 text-[18px] font-bold tracking-tight text-[#1a1614]">{f.title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-gray-500 whitespace-pre-wrap">{f.content}</p>
            <div className="mt-5 flex items-center gap-2.5 border-t border-gray-100 pt-4">
              <Avatar initials={String(f.author || "").slice(0, 2).toUpperCase()} size={26} />
              <span className="text-[13px] font-medium text-gray-500">{f.author}</span>
            </div>
          </GlassCard>
        ))
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Pengumuman" : "Tambah Pengumuman"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Judul Pengumuman</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul..."
              />
            </div>
            
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(val: AnnouncementCategory) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Umum">Umum</SelectItem>
                  <SelectItem value="Rapat">Rapat</SelectItem>
                  <SelectItem value="OPREC">OPREC</SelectItem>
                  <SelectItem value="Deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Isi Pengumuman</Label>
              <Textarea
                required
                rows={5}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Tuliskan isi pengumuman..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
              />
              <Label className="cursor-pointer" onClick={() => setFormData({ ...formData, is_pinned: !formData.is_pinned })}>
                Sematkan Pengumuman (Tampil di atas)
              </Label>
            </div>

            <DialogFooter className="mt-4">
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
