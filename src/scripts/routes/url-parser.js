export function getActivePathname() {
  return location.hash.slice(1) || '/';
}

export function parseActivePathname() {
  const segments = getActivePathname().split('/').filter(Boolean);
  return { resource: segments[0] || null, id: segments[1] || null };
}

export function getActiveRoute() {
  const { resource } = parseActivePathname();
  if (resource === 'detail') return '/detail/:id';
  if (resource === 'about') return '/about';
  if (resource === 'add') return '/add';
  if (resource === 'login') return '/login';
  if (resource === 'register') return '/register';
  if (resource === 'favorite') return '/favorite';
  return '/';
}
