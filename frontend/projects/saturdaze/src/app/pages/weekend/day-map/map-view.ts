import { MapPin, MapPoint } from 'api';

/**
 * Fits a day's stops (and home) onto a fixed 4:3 frame of OpenStreetMap tiles
 * (L2-103). Pure Web Mercator maths; positions come back as percentages of the
 * frame so the map scales with its container.
 */

/** The frame's virtual size in pixels; the container keeps the same 4:3 ratio. */
export const FRAME = { width: 640, height: 480 } as const;
const TILE = 256;
const PADDING = 56;
const MAX_ZOOM = 15;
const MIN_ZOOM = 3;

/** OpenStreetMap's standard tiles; the attribution must stay visible (L2-103 AC3). */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export interface PositionedTile {
  readonly key: string;
  readonly src: string;
  readonly left: number;
  readonly top: number;
}

export interface PositionedPin extends MapPin {
  readonly left: number;
  readonly top: number;
}

export interface MapView {
  readonly zoom: number;
  readonly tiles: readonly PositionedTile[];
  readonly pins: readonly PositionedPin[];
  readonly home: { readonly left: number; readonly top: number } | null;
  /** Polyline points in frame pixels: home → each stop in order → home. */
  readonly route: string;
  /** Tile size as a percentage of the frame's width and height. */
  readonly tileWidth: number;
  readonly tileHeight: number;
}

function project(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const size = TILE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  };
}

function fitZoom(points: readonly MapPoint[]): number {
  for (let z = MAX_ZOOM; z > MIN_ZOOM; z--) {
    const xy = points.map((p) => project(p.latitude, p.longitude, z));
    const spanX = Math.max(...xy.map((p) => p.x)) - Math.min(...xy.map((p) => p.x));
    const spanY = Math.max(...xy.map((p) => p.y)) - Math.min(...xy.map((p) => p.y));
    if (spanX <= FRAME.width - 2 * PADDING && spanY <= FRAME.height - 2 * PADDING) return z;
  }
  return MIN_ZOOM;
}

export function mapView(stops: readonly MapPin[], home: MapPoint | null): MapView {
  const points: MapPoint[] = [...stops, ...(home ? [home] : [])];
  const zoom = fitZoom(points);
  const xy = points.map((p) => project(p.latitude, p.longitude, zoom));
  const centreX = (Math.max(...xy.map((p) => p.x)) + Math.min(...xy.map((p) => p.x))) / 2;
  const centreY = (Math.max(...xy.map((p) => p.y)) + Math.min(...xy.map((p) => p.y))) / 2;
  const left = centreX - FRAME.width / 2;
  const top = centreY - FRAME.height / 2;
  const toFrame = (p: MapPoint) => {
    const q = project(p.latitude, p.longitude, zoom);
    return { x: q.x - left, y: q.y - top };
  };
  const pct = (p: { x: number; y: number }) => ({
    left: (p.x / FRAME.width) * 100,
    top: (p.y / FRAME.height) * 100,
  });

  const count = 2 ** zoom;
  const tiles: PositionedTile[] = [];
  for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + FRAME.height) / TILE); ty++) {
    if (ty < 0 || ty >= count) continue;
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + FRAME.width) / TILE); tx++) {
      const wrapped = ((tx % count) + count) % count;
      tiles.push({
        key: `${zoom}/${tx}/${ty}`,
        src: TILE_URL.replace('{z}', String(zoom))
          .replace('{x}', String(wrapped))
          .replace('{y}', String(ty)),
        left: ((tx * TILE - left) / FRAME.width) * 100,
        top: ((ty * TILE - top) / FRAME.height) * 100,
      });
    }
  }

  const homeXy = home ? toFrame(home) : null;
  const stopXy = stops.map(toFrame);
  const route = [...(homeXy ? [homeXy] : []), ...stopXy, ...(homeXy ? [homeXy] : [])]
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  return {
    zoom,
    tiles,
    pins: stops.map((s, i) => ({ ...s, ...pct(stopXy[i]!) })),
    home: homeXy ? pct(homeXy) : null,
    route,
    tileWidth: (TILE / FRAME.width) * 100,
    tileHeight: (TILE / FRAME.height) * 100,
  };
}
