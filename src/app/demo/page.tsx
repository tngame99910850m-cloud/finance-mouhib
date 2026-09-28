import { redirect } from "next/navigation";

// The whole app now runs without a database, so there's no separate
// read-only demo anymore — just go straight to the real thing.
export default function DemoRedirect() {
  redirect("/");
}
