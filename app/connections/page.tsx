import { redirect } from "next/navigation";

/** Legacy entry point kept so bookmarks and external links remain valid. */
export default function ConnectionsPage() {
  redirect("/whatsapp");
}
