import React from 'react';

interface MatchSchemaProps {
  id: string;
  name: string;
  startDate: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: string;
  venueName?: string | null;
  location?: string | null;
}

export function MatchJsonLd({
  id,
  name,
  startDate,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  status,
  venueName,
  location,
}: MatchSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: name,
    startDate: startDate,
    eventStatus:
      status === 'FINISHED'
        ? 'https://schema.org/EventCompleted'
        : status === 'POSTPONED'
        ? 'https://schema.org/EventPostponed'
        : status === 'CANCELLED'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    homeTeam: {
      '@type': 'SportsTeam',
      name: homeTeamName,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: awayTeamName,
    },
    location: venueName
      ? {
          '@type': 'Place',
          name: venueName,
          address: location || 'Stadium',
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ArticleSchemaProps {
  headline: string;
  description?: string | null;
  image?: string | null;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
}

export function ArticleJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName = 'YallaSport Editorial Desk',
  publisherName = 'YallaSport',
  publisherLogo = 'https://yallasport.com/brand/logo.png',
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: headline,
    description: description || headline,
    image: image ? [image] : undefined,
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || datePublished || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
