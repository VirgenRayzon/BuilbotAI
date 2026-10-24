import { redirect } from "next/navigation";

export default async function SupportRequestsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ inquiry?: string }>;
}) {
  const { inquiry } = await searchParams;
  const params = new URLSearchParams({ tab: "contact-inbox" });
  if (inquiry) params.set("inquiry", inquiry);
  redirect(`/profile?${params.toString()}`);
}
