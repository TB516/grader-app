const stringifyDetails = (details: unknown): string => {
  try {
    return JSON.stringify(details, null, 2) ?? String(details);
  } catch {
    return String(details);
  }
};

export const responseDetails = (response: Response): string => {
  return stringifyDetails({
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    redirected: response.redirected,
    type: response.type,
    bodyUsed: response.bodyUsed,
    headers: Object.fromEntries(response.headers.entries())
  });
};

export const errorDetails = (error: unknown): string => {
  if (error instanceof Error) {
    return stringifyDetails({
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }

  return stringifyDetails(error);
};
