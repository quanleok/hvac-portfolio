import { getSections } from "@/lib/media/data";
import { HomeClient } from "./_home/home-client";

const HOME_SECTION_IDS = [
  "office-more",
  "team-at-work",
  "equipment-installed",
  "field-locations",
];

export default async function Page() {
  const media = await getSections(HOME_SECTION_IDS);
  return <HomeClient media={media} />;
}
