import { redirect } from "next/navigation";

export default function VerifyRedirectPage() {
  redirect("/admin/verify");
}