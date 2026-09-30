import { GlassCard, RED } from "../aptrg/shared";
import { Avatar } from "./MemberLayout";
import { STRUKTUR_OPREC, OPREC_DIV_COLORS, OprecDivKey, OrgPerson } from "./data";

function NodeCard({
 node,
 accent,
 wide = false,
}: {
 node: OrgPerson;
 accent: string;
 wide?: boolean;
}) {
 return (
 <GlassCard className={`p-4 ${wide ? "w-64" : "w-52"}`}>
 <div className="flex items-center gap-3">
 <Avatar initials={node.initials} size={40} />
 <div className="min-w-0">
 <div className="truncate text-[14px] font-bold text-[#2a2320] " title={node.name}>
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
 return (
 <div className="flex flex-col items-center">
 <div className="mb-6 text-center">
 <h2 className="text-[18px] font-bold text-[#2a2320] ">Struktur Panitia OPREC 2026</h2>
 <p className="mt-1 text-[13px] text-[#857a75] ">Susunan kepanitiaan open recruitment per divisi.</p>
 </div>

 <NodeCard node={STRUKTUR_OPREC.head} accent={RED} wide />
 <Line h={28} />
 <div className="relative w-full max-w-6xl">
 <div
 className="mx-auto h-px"
 style={{ width: "calc(100% - 12.5%)", background: "rgba(200,30,44,0.4)" }}
 />
 </div>

 <div className="grid w-full max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
 {STRUKTUR_OPREC.divisions.map((d) => {
 const color = OPREC_DIV_COLORS[d.name as OprecDivKey];
 return (
 <div key={d.name} className="flex flex-col items-center">
 <Line h={20} />
 <div
 className="mb-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
 style={{ background: `${color}1a`, color }}
 >
 Divisi {d.name}
 </div>

 <NodeCard node={d.ketua} accent={color} wide />

 {d.wakil && (
 <>
 <Line h={16} />
 <NodeCard node={d.wakil} accent={color} wide />
 </>
 )}

 {d.staff.length > 0 && (
 <>
 <Line h={20} />
 <div className="flex flex-col items-center gap-2.5">
 {d.staff.map((mem) => (
 <NodeCard key={mem.name} node={mem} accent="#857a75" />
 ))}
 </div>
 </>
 )}
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
