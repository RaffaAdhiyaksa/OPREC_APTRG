import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { GlassCard, RED } from "../aptrg/shared";
import { Avatar, DivTag, StatusBadge } from "./MemberLayout";
import { supabase } from "../../../lib/supabaseClient";
import { useAuthContext } from "../../context/AuthContext";
import { toast } from "sonner";
import type { Member, DivisionType, MemberStatus } from "../../types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";

const DIV_COLORS: Record<DivisionType | "Umum", string> = {
  Mekanik: "#c81e2c",
  Sistem: "#e3a548",
  GCS: "#2f7dd1",
  "Non-Technical": "#3aa66f",
  Umum: "#857a75",
};

const DIV_FILTERS: (DivisionType | "Semua")[] = [
  "Semua",
  "Mekanik",
  "Sistem",
  "GCS",
  "Non-Technical",
];
const STATUS_FILTERS = ["Semua", "Ketua Lab", "Kepala Divisi", "Asisten Lab", "Magang"] as const;
const ANGKATAN_FILTERS = ["Semua", "2022", "2023", "2024"] as const;

export function Anggota({
  onOpenMember,
}: {
  onOpenMember: (id: string) => void;
}) {
  const { role } = useAuthContext();
  const isAdmin = role === "admin" || role === "asisten";

  const [q, setQ] = useState("");
  const [div, setDiv] = useState<(typeof DIV_FILTERS)[number]>("Semua");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("Semua");
  const [angkatan, setAngkatan] = useState<(typeof ANGKATAN_FILTERS)[number]>("Semua");

  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Member>>({
    nama: "",
    nim: "",
    divisi: "Mekanik",
    status_jabatan: "Magang",
    angkatan: "2024",
    foto_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dbData, error } = await supabase
      .from("members")
      .select("*")
      .order("nama", { ascending: true });

    if (error) {
      toast.error("Gagal memuat anggota: " + error.message);
    } else {
      setData(dbData || []);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      nama: "",
      nim: "",
      divisi: "Mekanik",
      status_jabatan: "Magang",
      angkatan: "2024",
      foto_url: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, item: Member) => {
    e.stopPropagation();
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      nim: item.nim,
      divisi: item.divisi,
      status_jabatan: item.status_jabatan,
      angkatan: item.angkatan,
      foto_url: item.foto_url || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus anggota ini?")) return;
    
    const { error } = await supabase.from("members").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
    } else {
      toast.success("Anggota berhasil dihapus");
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = { ...formData };

    let error;
    if (editingId) {
      const res = await supabase.from("members").update(payload).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("members").insert(payload);
      error = res.error;
    }

    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
    } else {
      toast.success("Data anggota berhasil disimpan");
      setIsModalOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const filtered = data.filter((m) => {
    if (q && !m.nama.toLowerCase().includes(q.toLowerCase())) return false;
    if (div !== "Semua" && m.divisi !== div) return false;
    if (status !== "Semua" && m.status_jabatan !== status) return false;
    if (angkatan !== "Semua" && m.angkatan !== angkatan) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#857a75]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari anggota berdasarkan nama..."
              className="w-full rounded-full border border-gray-100 bg-white py-3 pl-12 pr-5 text-sm text-[#1a1614] outline-none placeholder:text-gray-400 focus:border-[#c81e2c] focus:ring-1 focus:ring-[#c81e2c]/20 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.04)] transition-all duration-300"
            />
          </div>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
              style={{ background: RED, boxShadow: "0 4px 14px -3px rgba(200,30,44,0.35)" }}
            >
              <Plus className="h-4 w-4" /> Tambah Anggota
            </button>
          )}
        </div>
        
        <div className="mt-4 space-y-3">
          <ChipRow label="Divisi" options={DIV_FILTERS} value={div} onChange={setDiv} />
          <ChipRow label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
          <ChipRow label="Angkatan" options={ANGKATAN_FILTERS} value={angkatan} onChange={setAngkatan} />
        </div>
      </GlassCard>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#857a75]" />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <button key={m.id} onClick={() => onOpenMember(m.id)} className="text-left group relative">
              <GlassCard className="p-6 hover:-translate-y-1 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.1)] relative h-full flex flex-col">
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-all duration-300 gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 z-10">
                    <div onClick={(e) => openEditModal(e, m)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-300 cursor-pointer" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </div>
                    <div onClick={(e) => handleDelete(e, m.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-300 cursor-pointer" title="Hapus">
                      <Trash2 className="h-3.5 w-3.5" />
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <Avatar initials={m.nama.slice(0, 2).toUpperCase()} size={52} imgUrl={m.foto_url || undefined} />
                  <StatusBadge status={m.status_jabatan === "Ketua Lab" || m.status_jabatan === "Kepala Divisi" || m.status_jabatan === "Asisten Lab" ? "asisten" : "magang"} />
                </div>
                <h3 className="mt-4 text-[16px] font-bold tracking-tight text-[#1a1614]">
                  {m.nama}
                </h3>
                <div className="mt-1 text-[12px] text-gray-400">
                  {m.status_jabatan} · Angkatan {m.angkatan}
                </div>
                <div className="mt-auto pt-3">
                  <DivTag label={m.divisi} color={DIV_COLORS[m.divisi] || "#857a75"} />
                </div>
              </GlassCard>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-14 text-center text-sm text-gray-400">
              Data anggota belum tersedia.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Anggota" : "Tambah Anggota"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nama Lengkap</Label>
                <Input
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label>NIM</Label>
                <Input
                  required
                  value={formData.nim}
                  onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                  placeholder="11012..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Divisi</Label>
                <Select
                  value={formData.divisi}
                  onValueChange={(val: DivisionType) => setFormData({ ...formData, divisi: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mekanik">Mekanik</SelectItem>
                    <SelectItem value="Sistem">Sistem</SelectItem>
                    <SelectItem value="GCS">GCS</SelectItem>
                    <SelectItem value="Non-Technical">Non-Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Angkatan</Label>
                <Select
                  value={formData.angkatan}
                  onValueChange={(val) => setFormData({ ...formData, angkatan: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status/Jabatan</Label>
              <Select
                value={formData.status_jabatan}
                onValueChange={(val: MemberStatus) => setFormData({ ...formData, status_jabatan: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ketua Lab">Ketua Lab</SelectItem>
                  <SelectItem value="Kepala Divisi">Kepala Divisi</SelectItem>
                  <SelectItem value="Asisten Lab">Asisten Lab</SelectItem>
                  <SelectItem value="Magang">Magang</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>URL Foto Profil (Opsional)</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.foto_url ?? ""}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                  placeholder="https://example.com/foto.jpg"
                />
              </div>
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

function ChipRow<T extends string>({
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 flex-none text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-300 ease-in-out"
            style={{
              background: on ? RED : "white",
              color: on ? "#fff" : "#6b6460",
              border: on ? "none" : "1px solid rgba(0,0,0,0.06)",
              boxShadow: on ? "0 2px 8px -2px rgba(200,30,44,0.3)" : "0 1px 3px -1px rgba(0,0,0,0.04)",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
