export function shouldSync({ pending, force }) {
  return force || pending > 0;
}
