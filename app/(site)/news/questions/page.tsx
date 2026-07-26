import { redirect } from "next/navigation";

export default function LegacyQuestionsRoute() {
  redirect("/questions");
}
