import { useState, useEffect } from "react";
import { GlassCard, RED } from "../aptrg/shared";
import { Avatar } from "./MemberLayout";
import { supabase } from "../../../lib/supabaseClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DIV_COLORS, DivKey } from "./data";

type Node = { name: string; role: string; initials: string; imgUrl?: string };

function NodeCard({
  node,
  accent,
  wide = false,
}: {
  node: Node;
  accent: string;
  wide?: boolean;
}) {
  return (
    <GlassCard className={`p-4 ${wide ? "w-64" : "w-52"}`}>
      <div className="flex items-center gap-3">
        <Avatar initials={node.initials} size={40} imgUrl={node.imgUrl} />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold text-[#2a2320]" title={node.name}>
            {node.name}
          </div>
          <div className="truncate text-[12px] font-medium" style={{ color: accent }}>
            {node.role}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function StrukturOrganisasi() {
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      toast.error("Gagal memuat struktur: " + error.message);
    } else if (dbData) {
      const headMember = dbData.find(m => m.status_jabatan === "Ketua Lab");

      const divisionsList = ["Mekanik", "Sistem", "GCS", "Non-Technical"];
      const divisions = divisionsList.map((divName) => {
        const divMembers = dbData.filter(m => m.divisi === divName && m.status_jabatan !== "Ketua Lab");
        const lead = divMembers.find(m => m.status_jabatan === "Kepala Divisi");
        const members = divMembers.filter(m => m.status_jabatan !== "Kepala Divisi");

        return {
          name: divName,
          lead: lead ? {
            name: lead.nama,
            role: lead.status_jabatan,
            initials: lead.nama.slice(0, 2).toUpperCase(),
            imgUrl: lead.foto_url || undefined,
          } : {
            name: "Belum Ada",
            role: "Kepala Divisi",
            initials: "?",
          },
          members: members.map(m => ({
            name: m.nama,
            role: m.status_jabatan,
            initials: m.nama.slice(0, 2).toUpperCase(),
            imgUrl: m.foto_url || undefined,
          }))
        };
      });

      setOrgData({
        head: headMember ? {
          name: headMember.nama,
          role: headMember.status_jabatan,
          initials: headMember.nama.slice(0, 2).toUpperCase(),
          imgUrl: headMember.foto_url || undefined,
        } : {
          name: "Belum Ada",
          role: "Ketua Lab",
          initials: "?",
        },
        divisions
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#857a75]" />
      </div>
    );
  }

  if (!orgData) {
    return (
      <div className="py-20 text-center text-[14px] text-[#857a75]">
        Data struktur organisasi belum tersedia.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Ketua Lab */}
      <NodeCard node={orgData.head} accent={RED} wide />

      {/* vertical connector */}
      <Line h={28} />
      {/* horizontal bus */}
      <div className="relative w-full max-w-6xl">
        <div
          className="mx-auto h-px"
          style={{
            width: "calc(100% - 12.5%)",
            background: "rgba(200,30,44,0.4)",
          }}
        />
      </div>

      {/* Divisions */}
      <div className="grid w-full max-w-5xl grid-cols-2 gap-6 xl:grid-cols-4">
        {orgData.divisions.map((d: any) => {
          const color = DIV_COLORS[d.name as DivKey] || "#857a75";
          return (
            <div key={d.name} className="flex flex-col items-center">
              <Line h={20} />
              <div
                className="mb-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
                style={{ background: `${color}1a`, color }}
              >
                Divisi {d.name}
              </div>
              {d.members.map((mem: any, i: number) => (
                <div key={mem.name + i} className="flex flex-col items-center">
                  <Line h={18} />
                  <NodeCard node={mem} accent="#857a75" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Line({ h }: { h: number }) {
  return (
    <div
      style={{ height: h, width: 2, background: "rgba(200,30,44,0.4)" }}
    />
  );
}
