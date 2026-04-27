export const projectUrl = (baseUrl: URL, path: string): URL => {
  const base = new URL(baseUrl);
  if (!base.pathname.endsWith('/')) base.pathname = `${base.pathname}/`;
  base.search = '';
  base.hash = '';

  const relativePath = path.replace(/^\/+/, '');

  return new URL(relativePath, base);
};
