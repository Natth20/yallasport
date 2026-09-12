export function isLiveSportsApi() {
  const apiKey = process.env.SPORTS_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== 'placeholder-api-key');
}
