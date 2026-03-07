import { NextResponse } from "next/server";

export async function GET() {
  const providers: string[] = [];

  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push("github");
  }
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push("google");
  }
  if (
    process.env.KEYCLOAK_ISSUER &&
    process.env.KEYCLOAK_CLIENT_ID &&
    process.env.KEYCLOAK_CLIENT_SECRET
  ) {
    providers.push("keycloak");
  }

  return NextResponse.json(providers);
}
