import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaReference } from '../../domain/models';
import type { ProviderAvailability } from '../../services/tmdb/client';
import { lookupAvailability, posterUrl } from '../../services/tmdb';
import { useRemote } from '../../hooks/useRemote';

const groups: [keyof Omit<ProviderAvailability, 'link'>, string][] = [
  ['flatrate', 'Subscription'], ['free', 'Free'], ['ads', 'With ads'], ['rent', 'Rent'], ['buy', 'Buy'],
];
function Offers({ media, region, selected }: { media: MediaReference; region: string; selected: number[] }) {
  const loader = useCallback(() => lookupAvailability(media, region), [media, region]);
  const result = useRemote(loader);
  if (result.loading) return <p className="card-availability-note">Checking services…</p>;
  if (result.error) return <div className="card-availability-note">Availability couldn’t load. <button className="availability-retry" onClick={result.retry}>Retry</button></div>;
  const present = groups.filter(([key]) => result.data?.[key]?.length);
  if (!present.length) return <p className="card-availability-note">Availability not reported.</p>;
  return <>{present.map(([key, label]) => <div className="card-offer-group" key={key}>
    <p className="offer-label">{label}</p>
    <ul className="card-services">{[...result.data![key]!].sort((a, b) => Number(selected.includes(b.provider_id)) - Number(selected.includes(a.provider_id))).map(provider => {
      const yours = selected.includes(provider.provider_id);
      const logo = posterUrl(provider.logo_path);
      return <li key={provider.provider_id} className={yours ? 'selected-service' : undefined}>
        {logo && <img src={logo} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = 'none'; }} />}
        <span>{provider.provider_name}{yours && <small>Your service</small>}</span>
      </li>;
    })}</ul>
  </div>)}</>;
}
export function CardAvailability(props: { media: MediaReference; region: string; selected: number[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { rootMargin: '200px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div className="card-availability" ref={container} aria-label={'Streaming availability for ' + props.media.title}>
    {visible ? <Offers {...props} /> : <p className="card-availability-note">Streaming services</p>}
  </div>;
}
