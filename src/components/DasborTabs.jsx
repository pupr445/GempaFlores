'use client';

export default function DasborTabs({ tabs, aktif, onGanti }) {
  return (
    <nav className="nav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`nav-tab ${aktif === tab.key ? 'nav-tab-active' : ''}`}
          onClick={() => onGanti(tab.key)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
