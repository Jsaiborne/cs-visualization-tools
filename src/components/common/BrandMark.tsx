import React, { useState } from 'react';
import { Code2 } from 'lucide-react';

const LOGO_URL = `${import.meta.env.BASE_URL}logo.png`;

/**
 * The site logo (public/logo.png, served under the app's base path). Until that file exists,
 * or if it fails to load, a plain outlined code glyph stands in at the same size.
 */
export const BrandMark: React.FC<{ size: number }> = ({ size }) => {
  const [failed, setFailed] = useState(false);
  const radius = Math.round(size * 0.2);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          border: '1px solid var(--border-strong)',
          background: 'var(--bg)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--text)',
        }}
      >
        <Code2 size={Math.round(size * 0.55)} />
      </span>
    );
  }

  return (
    <img
      src={LOGO_URL}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ borderRadius: radius, flexShrink: 0, display: 'block' }}
    />
  );
};

export default BrandMark;
