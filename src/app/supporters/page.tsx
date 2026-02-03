import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SupportersClient from "./supporters-client";

function readUser() {
  const c = cookies().get("conf_user")?.value;
  if (!c) return null;
  try {
    const json = Buffer.from(c, "base64").toString("utf8");
    return JSON.parse(json) as { fullName: string; email: string; org: string };
  } catch {
    return null;
  }
}

export default function SupportersPage() {
  const user = readUser();
  if (!user) redirect("/register");
  return <SupportersClient user={user} />;
}
