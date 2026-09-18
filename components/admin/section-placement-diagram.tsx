interface Row {
  id: string | null; // null = not a CMS-managed row, just a structural label
  label: string;
}

const HOME_ROWS: Row[] = [
  { id: null, label: "Hero video" },
  { id: "office-more", label: "About / Office" },
  { id: null, label: "Local presence grid" },
  { id: "team-at-work", label: "Team / service strip" },
  { id: null, label: "Oklahoma conditions" },
  { id: "equipment-installed", label: "Equipment showcase" },
  { id: null, label: "Tech action video" },
  { id: "field-locations", label: "Service area video" },
  { id: null, label: "Replacement promo" },
  { id: null, label: "Reviews" },
  { id: null, label: "FAQ" },
];

const GALLERY_ROWS: Row[] = [
  { id: "gallery-people", label: "People" },
  { id: "gallery-work", label: "Work" },
  { id: "gallery-location", label: "Location" },
  { id: "gallery-reviews", label: "Reviews" },
];

export function SectionPlacementDiagram({
  activeId,
  page,
}: {
  activeId: string;
  page: "home" | "gallery";
}) {
  const rows = page === "home" ? HOME_ROWS : GALLERY_ROWS;

  return (
    <div className="space-y-1 rounded-md border border-[#25344a] bg-[#07101c] p-3 text-xs">
      <p className="px-1 pb-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#6c8096]">
        {page === "home" ? "Home page layout" : "Gallery page layout"}
      </p>
      {rows.map((row, idx) => {
        const isActive = row.id === activeId;
        return (
          <div
            key={idx}
            className={
              isActive
                ? "rounded-md border-2 border-[#c55a24] bg-[#2a1a0a] px-2 py-1.5 text-white"
                : row.id
                  ? "rounded-md border border-[#25344a] bg-[#0f1c2d] px-2 py-1.5 text-[#9aafc5]"
                  : "rounded-md border border-[#1a2433] bg-[#0a1320] px-2 py-1 text-[#6c8096] italic"
            }
          >
            <span>{row.label}</span>
            {isActive ? (
              <span className="ml-2 text-[0.6rem] font-extrabold uppercase tracking-[0.15em] text-[#c55a24]">
                ← your photos go here
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
