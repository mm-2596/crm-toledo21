import { NextResponse } from "next/server";
import { agentLogin } from "@/lib/api";

export const TOKEN_COOKIE = "toledo21_agent_token";
export const AGENT_COOKIE = "toledo21_agent_info";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    const { token, agent } = await agentLogin(email, password);
    const res = NextResponse.json({ agent });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };
    res.cookies.set(TOKEN_COOKIE, token, cookieOptions);
    res.cookies.set(AGENT_COOKIE, JSON.stringify(agent), cookieOptions);
    return res;
  } catch {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(TOKEN_COOKIE);
  res.cookies.delete(AGENT_COOKIE);
  return res;
}
