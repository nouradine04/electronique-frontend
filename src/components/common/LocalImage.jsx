import React, { useEffect, useState } from 'react';
import { isLocalMediaReference, resolveLocalImage } from '../../services/localMedia.js';

export function LocalImage({ src, fallback = null, ...props }) {
  const [resolvedSource, setResolvedSource] = useState(() => isLocalMediaReference(src) ? '' : (src || ''));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setFailed(false);

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

  if (!resolvedSource || failed) return fallback;

  const { onError, ...imageProps } = props;
  return <img src={resolvedSource} {...imageProps} onError={event => {
    setFailed(true);
    onError?.(event);
  }} />;
}
