import { getBlock } from "@/lib/content";
import PageBuilder from "@/components/admin/PageBuilder";

export const metadata = { title: "Add New Page" };

export default async function NewPagePage() {
  const contact = await getBlock("page.contact");
  return (
    <PageBuilder
      id={null}
      initial={{ title: "", slug: "", status: "draft", seoTitle: "", seoDescription: "", blocks: [] }}
      serviceOptions={contact.serviceOptions}
    />
  );
}
