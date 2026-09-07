type Review = {
  name: string;
  source: string;
  rating: number;
  quote: string;
};

const reviews: Review[] = [
  { name: "Sophie Marchand", source: "Google", rating: 5, quote: "Formation très concrète, le formateur s'appuie sur des cas réels du métier. Je recommande sans hésiter." },
  { name: "Karim Belloumi", source: "Google", rating: 5, quote: "Equipe à l'écoute et plateaux techniques bien équipés. On repart avec des compétences réellement applicables." },
  { name: "Julie Ferreira", source: "Google", rating: 4, quote: "Bon rythme, contenu clair. Quelques modules pourraient être un peu plus approfondis mais globalement très satisfaite." },
  { name: "Thomas Ridel", source: "Google", rating: 5, quote: "Excellent accompagnement avant et après la session. L'organisme répond vite et le suivi est sérieux." },
  { name: "Nadia Cherfi", source: "Google", rating: 5, quote: "Formateurs expérimentés et pédagogues. La partie pratique m'a permis de vraiment prendre en main les outils." },
];

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
        <span className="review-avatar">{initials(item.name)}</span>
        <div>
          <strong>{item.name}</strong>
          <span className="review-source">{item.source}</span>
        </div>
      </div>
      <Stars rating={item.rating} />
      <p>&ldquo;{item.quote}&rdquo;</p>
    </article>
  );
}

export function TestimonialCarousel() {
  const track = [...reviews, ...reviews];

  return (
    <div className="review-carousel">
      <div className="review-carousel-heading">
        <h2>Nos clients en parlent mieux que nous</h2>
      </div>
      <div className="review-track-viewport">
        <div className="review-track">
          {track.map((item, index) => (
            <ReviewCard item={item} key={`${item.name}-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
