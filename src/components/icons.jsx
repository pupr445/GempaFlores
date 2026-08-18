'use client';

/**
 * Set ikon garis (line icon) ringan — SVG inline, tanpa dependensi
 * tambahan, supaya bundle tetap kecil untuk static export.
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconCamera(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.086a1 1 0 0 0 .765-.354l1.03-1.292A1 1 0 0 1 10.146 5h3.708a1 1 0 0 1 .765.354l1.03 1.292a1 1 0 0 0 .765.354H18.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

export function IconUpload(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
      <path d="M12 15V4" />
      <path d="M7.5 8.5 12 4l4.5 4.5" />
    </svg>
  );
}

export function IconMapPin(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M12 21s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  );
}

export function IconRefresh(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9L20.5 8.5" />
      <path d="M20.5 4.5v4h-4" />
      <path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9L3.5 15.5" />
      <path d="M3.5 19.5v-4h4" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M20 20l-4.35-4.35" />
    </svg>
  );
}

export function IconX(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function IconTrash(props) {
  return (
    <svg {...base} width={props.size || 16} height={props.size || 16} className={props.className}>
      <path d="M5 7h14" />
      <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
      <path d="M6.5 7 7.2 19a1.5 1.5 0 0 0 1.5 1.4h6.6a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </svg>
  );
}

export function IconLoader(props) {
  return (
    <svg
      {...base}
      width={props.size || 18}
      height={props.size || 18}
      className={`icon-spin ${props.className || ''}`}
    >
      <path d="M12 3v3.2" opacity="1" />
      <path d="M12 17.8V21" opacity="0.25" />
      <path d="M4.9 4.9 7.2 7.2" opacity="0.9" />
      <path d="M16.8 16.8l2.3 2.3" opacity="0.4" />
      <path d="M3 12h3.2" opacity="0.8" />
      <path d="M17.8 12H21" opacity="0.55" />
      <path d="M4.9 19.1l2.3-2.3" opacity="0.7" />
      <path d="M16.8 7.2l2.3-2.3" opacity="0.65" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...base} width={props.size || 16} height={props.size || 16} className={props.className}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  );
}

export function IconAlert(props) {
  return (
    <svg {...base} width={props.size || 18} height={props.size || 18} className={props.className}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="16.8" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconClipboard(props) {
  return (
    <svg {...base} width={props.size || 18} height={props.size || 18} className={props.className}>
      <path d="M8 5h8v2.4H8V5Z" />
      <path d="M6 6.4h12a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V7.9A1.5 1.5 0 0 1 6 6.4Z" />
      <path d="M8 12h8M8 15.5h5.5" />
    </svg>
  );
}

export function IconVideo(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h8A1.5 1.5 0 0 1 15 7.5v9A1.5 1.5 0 0 1 13.5 18h-8A1.5 1.5 0 0 1 4 16.5v-9Z" />
      <path d="M15 10.2 19.4 7a.6.6 0 0 1 .96.48v9.04a.6.6 0 0 1-.96.48L15 13.8" />
    </svg>
  );
}

export function IconHistory(props) {
  return (
    <svg {...base} width={props.size || 18} height={props.size || 18} className={props.className}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5v4.2h4.2" />
      <path d="M12 8v4.4l3 2" />
    </svg>
  );
}

export function IconLock(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <rect x="5" y="10.5" width="14" height="9" rx="1.8" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconLogout(props) {
  return (
    <svg {...base} width={props.size || 18} height={props.size || 18} className={props.className}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 15.5 19 12l-5-3.5" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function IconDownload(props) {
  return (
    <svg {...base} width={props.size || 18} height={props.size || 18} className={props.className}>
      <path d="M12 4v11.5" />
      <path d="M7.5 11 12 15.5 16.5 11" />
      <path d="M4.5 17v1.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V17" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.7 19c.6-3 2.9-5 5.8-5s5.2 2 5.8 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.3 14.3c2.3.3 4 2.1 4.4 4.7" />
    </svg>
  );
}

export function IconFileSpreadsheet(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M6 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V5A1.5 1.5 0 0 1 5.5 3.5H6Z" />
      <path d="M14 3.5V8h4" />
      <path d="M8 12.5h8M8 15.5h8M8 18h5" />
    </svg>
  );
}

export function IconFileText(props) {
  return (
    <svg {...base} width={props.size || 20} height={props.size || 20} className={props.className}>
      <path d="M6 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V5A1.5 1.5 0 0 1 5.5 3.5H6Z" />
      <path d="M14 3.5V8h4" />
      <path d="M8 12.5h8M8 15.5h5M8 18h6" />
    </svg>
  );
}
