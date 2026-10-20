import type { Review } from "../../shared/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} sur 5`}>
      {"★★★★★".slice(0, rating)}
      {"★★★★★".slice(rating).replace(/★/g, "☆")}
    </span>
  );
}

function ReviewCard({ item }: { item: Review }) {
  return (
    <article className="review-card">
      <div className="review-card-head">
        <span className="review-avatar">{initials(item.author)}</span>
        <div>
          <strong>{item.author}</strong>
          {/* Source, agence et période quand elles sont renseignées. */}
          <span className="review-source">
            {[item.source, item.city, item.period].filter(Boolean).join(" · ")}
          </span>
        </div>
      </div>
      <Stars rating={item.rating} />
      <p>&ldquo;{item.quote}&rdquo;</p>
    </article>
  );
}

export function TestimonialCarousel({ reviews }: { reviews: Review[] }) {
  // Piste doublée pour que le défilement en boucle soit continu.
  const track = [...reviews, ...reviews];

  if (!reviews.length) return null;

  return (
    <div className="review-carousel">
      <div className="review-carousel-heading">
        <h2>Nos clients en parlent mieux que nous</h2>
      </div>
      <div className="review-track-viewport">
        <div className="review-track">
          {track.map((item, index) => (
            <ReviewCard item={item} key={`${item.id}-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
