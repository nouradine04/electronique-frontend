import React, { useEffect, useState } from 'react';
import { isLocalMediaReference, resolveLocalImage } from '../../services/localMedia.js';

const reportedPhotoFailures = new Set();

export function LocalImage({ src, fallback = null, ...props }) {
  const [resolvedSource, setResolvedSource] = useState(() => isLocalMediaReference(src) ? '' : (src || ''));
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const retryImage = () => setRetry(value => value + 1);
    window.addEventListener('online', retryImage);
    window.addEventListener('focus', retryImage);
    window.addEventListener('nstock-session', retryImage);
    return () => {
      window.removeEventListener('online', retryImage);
      window.removeEventListener('focus', retryImage);
      window.removeEventListener('nstock-session', retryImage);
    };
  }, []);

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
    }).catch(error => {
      if (active) {
        setResolvedSource('');
        if (navigator.onLine !== false) {
          const reason = error?.status || error?.message || 'Erreur inconnue';
          const key = `${src}:${reason}`;
          if (!reportedPhotoFailures.has(key)) {
            reportedPhotoFailures.add(key);
            console.warn('[Photos] Lecture impossible :', reason);
          }
        }
      }
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, retry]);

  if (!resolvedSource || failed) return fallback;

  const { onError, ...imageProps } = props;
  return <img src={resolvedSource} {...imageProps} onError={event => {
    setFailed(true);
    onError?.(event);
  }} />;
}
