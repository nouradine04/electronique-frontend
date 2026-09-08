import React, { useEffect, useState } from 'react';
import { isLocalMediaReference, resolveLocalImage } from '../../services/localMedia.js';

export function LocalImage({ src, fallback = null, ...props }) {
  const [resolvedSource, setResolvedSource] = useState(() => isLocalMediaReference(src) ? '' : (src || ''));

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    if (!src) {
      setResolvedSource('');
      return undefined;
    }
    if (!isLocalMediaReference(src)) {
      setResolvedSource(src);
      return undefined;
    }

    setResolvedSource('');
    resolveLocalImage(src).then(url => {
      objectUrl = url;
      if (active) setResolvedSource(url);
      else if (url) URL.revokeObjectURL(url);
    }).catch(() => {
      if (active) setResolvedSource('');
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolvedSource ? <img src={resolvedSource} {...props} /> : fallback;
}
