import type { CardMedia } from 'components';

// An illustrated stand-in, inlined so the docsite needs no image host. Not a photo.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="#f7d7b5"/><circle cx="128" cy="18" r="12" fill="#fde68a"/><path d="M0 52 C40 40 120 44 160 50 V90 H0Z" fill="#84a86d"/><path d="M80 52 L10 90 M80 52 L50 90 M80 52 L110 90 M80 52 L150 90" stroke="#7e5aa2" stroke-width="5"/></svg>`;

export const SAMPLE_PHOTO: CardMedia = {
  src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`,
  alt: 'Rows of lavender running to the horizon',
  width: 1600,
  height: 900,
  credit: 'Illustration · placeholder',
};
