type Layout = "grid" | "marquee" | "carousel" | "fade";

export function LayoutPreview({ layout }: { layout: Layout }) {
  if (layout === "grid") {
    return (
      <div className="layout-preview layout-preview--grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="layout-preview__tile" />
        ))}
      </div>
    );
  }

  if (layout === "marquee") {
    return (
      <div className="layout-preview layout-preview--marquee">
        <div className="layout-preview__marquee-track">
          {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((i, idx) => (
            <div key={idx} className="layout-preview__tile" />
          ))}
        </div>
      </div>
    );
  }

  if (layout === "fade") {
    return (
      <div className="layout-preview layout-preview--fade">
        {[1, 2, 3].map((i, idx) => (
          <div
            key={i}
            className="layout-preview__tile layout-preview__tile--fade"
            style={{ ["--fade-delay" as string]: `${idx * 1.5}s` }}
          />
        ))}
      </div>
    );
  }

  // carousel
  return (
    <div className="layout-preview layout-preview--carousel">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="layout-preview__tile" />
      ))}
      <div className="layout-preview__scrollhint" aria-hidden="true">
        →
      </div>
    </div>
  );
}
