import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "bolao_session";

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET não configurada");
  return new TextEncoder().encode(s);
}

export interface Session {
  id: number;
  name: string;
  isAdmin: boolean;
}

export async function createSession(session: Session, rememberMe = true) {
  const days = rememberMe ? 90 : 1;
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${days}d`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * days } : {}),
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: payload.id as number,
      name: payload.name as string,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (!session.isAdmin) throw new Error("FORBIDDEN");
  return session;
}
