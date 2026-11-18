import type { Metadata } from "next";
import { AgentAvatar } from "@/components/AgentAvatar";
import { QrCode } from "@/components/QrCode";
import { TEAM } from "@/lib/team";

export const metadata: Metadata = {
  title: "Nuestro equipo",
  description: "Conoce al equipo de Toledo21 Madrid: las personas que te acompañan de principio a fin.",
};

export default function TeamDirectoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-28">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Las personas detrás de Toledo21</h1>
        <p className="mt-3 text-sm text-ink-soft sm:text-base">
          Cada propiedad tiene un equipo real detrás, disponible para acompañarte de principio a fin.
        </p>
      </div>

      {TEAM.map((group) => (
        <section key={group.office} className="mt-12" aria-labelledby={`equipo-${group.office}`}>
          <h2 id={`equipo-${group.office}`} className="border-b border-line pb-3 font-display text-xl text-ink sm:text-2xl">
            {group.office}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.members.map((member) => (
              <article key={member.name} className="flex flex-col items-center rounded-2xl border border-line bg-paper px-6 pb-7 pt-8 text-center shadow-sm">
                <AgentAvatar name={member.name} size={96} className="ring-4 ring-paper-dim" />
                <h3 className="mt-4 font-display text-lg text-ink">{member.name}</h3>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gold">{member.role}</p>
                <div className="mt-6">
                  <QrCode url={member.qrUrl} label={`Código QR de ${member.name}`} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
