import { GlassCard, RED } from "../aptrg/shared";
import { Avatar } from "./MemberLayout";
import { ORG, DIV_COLORS, DivKey } from "./data";

type Node = { name: string; role: string; initials: string };

function NodeCard({
  node,
  accent = RED,
  wide = false,
}: {
  node: Node;
  accent?: string;
  wide?: boolean;
}) {
  return (
    <GlassCard className={`p-4 ${wide ? "w-64" : "w-52"}`}>
      <div className="flex items-center gap-3">
        <Avatar initials={node.initials} size={40} />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold text-[#2a2320]">
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
      {/* Ketua Lab */}
      <NodeCard node={ORG.head} wide />

      {/* vertical connector */}
      <Line h={28} />
      {/* horizontal bus */}
      <div className="relative w-full max-w-5xl">
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
        {ORG.divisions.map((d) => {
          const color = DIV_COLORS[d.name as DivKey];
          return (
            <div key={d.name} className="flex flex-col items-center">
              <Line h={20} />
              <NodeCard node={d.lead} accent={color} />
              <div className="mt-1 mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
                Divisi {d.name}
              </div>
              {d.members.map((mem) => (
                <div key={mem.name} className="flex flex-col items-center">
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
