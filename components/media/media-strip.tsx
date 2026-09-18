import Image from "next/image";
import { getMediaPublicUrl } from "@/lib/media/url";
import type { SectionPayload } from "@/lib/media/data";

export function MediaStrip({ payload }: { payload: SectionPayload | null }) {
  if (!payload) return null;
  if (payload.section?.enabled === false) return null;
  if (payload.items.length === 0) return null;

  const section = payload.section;
  const sectionId = payload.seed.id;
  const layout = section?.layout ?? "marquee";
  const direction = section?.scroll_direction ?? "left";
  const speed = section?.scroll_speed ?? "medium";
  const itemsVisible = section?.items_visible ?? 4;
  const showCaptions = section?.show_captions ?? true;

  const items = payload.items.map(({ assignment, media }) => ({
    id: assignment.id,
    type: media.type,
    url: getMediaPublicUrl(media.storage_path),
    caption: media.caption,
    alt: media.alt ?? media.caption ?? "",
  }));

  const sectionTitle = section?.title ?? payload.seed.title;

  if (layout === "marquee") {
    const duplicated = [...items, ...items];
    return (
      <section id={`strip-${sectionId}`} className="media-strip media-strip--marquee scroll-mt-28" aria-label={sectionTitle}>
        <h3 className="media-strip__title">{sectionTitle}</h3>
        <div className="media-marquee" data-direction={direction} data-speed={speed}>
          <div className="media-marquee__track">
            {duplicated.map((item, idx) => (
              <figure key={`${item.id}-${idx}`} className="media-marquee__item">
                {item.type === "image" ? (
                  <Image src={item.url} alt={item.alt} width={480} height={320} className="media-marquee__img" />
                ) : (
                  <video src={item.url} autoPlay muted loop playsInline className="media-marquee__img" />
                )}
                {showCaptions && item.caption ? (
                  <figcaption className="media-marquee__caption">{item.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "grid") {
    return (
      <section id={`strip-${sectionId}`} className="media-strip media-strip--grid scroll-mt-28" aria-label={sectionTitle}>
        <h3 className="media-strip__title">{sectionTitle}</h3>
        <div className="media-grid" style={{ ["--cols" as string]: itemsVisible }}>
          {items.map((item) => (
            <figure key={item.id} className="media-grid__item">
              {item.type === "image" ? (
                <Image src={item.url} alt={item.alt} width={480} height={320} className="media-grid__img" />
              ) : (
                <video src={item.url} autoPlay muted loop playsInline className="media-grid__img" />
              )}
              {showCaptions && item.caption ? (
                <figcaption className="media-grid__caption">{item.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </section>
    );
  }

  if (layout === "fade") {
    const count = items.length;
    const perItemSeconds = 4;
    const totalSeconds = count * perItemSeconds;
    return (
      <section id={`strip-${sectionId}`} className="media-strip media-strip--fade scroll-mt-28" aria-label={sectionTitle}>
        <h3 className="media-strip__title">{sectionTitle}</h3>
        <div
          className="media-fade"
          style={{
            ["--fade-count" as string]: count,
            ["--fade-total" as string]: `${totalSeconds}s`,
          }}
        >
          {items.map((item, idx) => (
            <figure
              key={item.id}
              className="media-fade__item"
              style={{ ["--fade-delay" as string]: `${idx * perItemSeconds}s` }}
            >
              {item.type === "image" ? (
                <Image src={item.url} alt={item.alt} width={960} height={640} className="media-fade__img" />
              ) : (
                <video src={item.url} autoPlay muted loop playsInline className="media-fade__img" />
              )}
              {showCaptions && item.caption ? (
                <figcaption className="media-fade__caption">{item.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </section>
    );
  }

  // carousel
  return (
    <section id={`strip-${sectionId}`} className="media-strip media-strip--carousel scroll-mt-28" aria-label={sectionTitle}>
      <h3 className="media-strip__title">{sectionTitle}</h3>
      <div className="media-carousel" style={{ ["--cols" as string]: itemsVisible }}>
        {items.map((item) => (
          <figure key={item.id} className="media-carousel__item">
            {item.type === "image" ? (
              <Image src={item.url} alt={item.alt} width={480} height={320} className="media-carousel__img" />
            ) : (
              <video src={item.url} autoPlay muted loop playsInline className="media-carousel__img" />
            )}
            {showCaptions && item.caption ? (
              <figcaption className="media-carousel__caption">{item.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
