'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function CountryJumpSelect({
  selectedCountry,
  jumpCountries,
  labelAll,
  countryLabels,
}: {
  selectedCountry: string;
  jumpCountries: Array<{ country: string; count: number }>;
  labelAll: string;
  countryLabels: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCountryChange = (country: string) => {
    const next = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (country === 'all') {
      next.delete('country');
    } else {
      next.set('country', country);
    }
    const q = next.toString();
    router.push(q ? `/leagues?${q}` : '/leagues');
  };

  return (
    <div className="shrink-0 flex items-center gap-1.5">
      <select
        value={selectedCountry}
        onChange={(e) => handleCountryChange(e.target.value)}
        aria-label="Select Country"
        className="h-10 rounded-full border border-border/80 bg-card px-4 text-xs font-bold text-foreground outline-none transition-colors hover:border-orange-500/60 focus:border-orange-500 cursor-pointer shadow-xs"
      >
        <option value="all">{labelAll}</option>
        {jumpCountries.map((c) => (
          <option key={c.country} value={c.country}>
            {countryLabels[c.country] || c.country} ({c.count})
          </option>
        ))}
      </select>
    </div>
  );
}
