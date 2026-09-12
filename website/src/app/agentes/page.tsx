import { cookies } from "next/headers";
import { getAgentProperties } from "@/lib/api";
import { AgentLoginForm } from "@/components/AgentLoginForm";
import { AgentDashboard } from "@/components/AgentDashboard";
import { TOKEN_COOKIE, AGENT_COOKIE } from "@/app/api/agent-session/route";

export const metadata = { title: "Zona de agentes" };

async function loadAgentSession(token: string, agentRaw: string) {
  try {
    const agent = JSON.parse(agentRaw) as { id: string; name: string; email: string };
    const properties = await getAgentProperties(token, agent.id);
    return { agent, properties };
  } catch {
    return null;
  }
}

export default async function AgentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const agentRaw = cookieStore.get(AGENT_COOKIE)?.value;

  const session = token && agentRaw ? await loadAgentSession(token, agentRaw) : null;

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-32">
        <AgentLoginForm />
      </div>
    );
  }

  return <AgentDashboard agent={session.agent} properties={session.properties} />;
}
