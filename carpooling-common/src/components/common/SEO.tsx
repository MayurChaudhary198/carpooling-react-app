import React from "react";
import { Helmet } from "react-helmet";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  titleTemplate?: string;
  defaultTitle?: string;
  children?: React.ReactNode;
}

const BASE_SEO_KEYWORDS = [
  "patel mihir",
  "mihir patel",
  "patel mihir 2715",
  "patelmihir2715",
  "patelmihir_01",
  "mihirpatel2715",
  "mihir patel 2715",
  "Mayurchauhdary198",
  "Mayur Chaudhari",
  "Chaudhari Mayur",
  "ChauhdaryMayur198",
  "mayurchauhdary198",
  "mayur chaudhari",
  "chaudhari mayur",
  "chauhdarymayur198",
];

const DEFAULT_KEYWORDS = [
  "carpool",
  "rideshare",
  "commute",
  "travel",
  "driver",
  "passenger",
  "lift",
  "ride share",
  ...BASE_SEO_KEYWORDS,
];

export function SEO({
  title,
  description = "RideShare - Fast, safe, and affordable community carpooling and ride-sharing.",
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  ogUrl,
  twitterCard = "summary_large_image",
  twitterTitle,
  twitterDescription,
  twitterImage,
  titleTemplate = "%s | RideShare",
  defaultTitle = "RideShare - Smart Community Carpooling",
  children,
}: SEOProps) {
  const userKeywords = Array.isArray(keywords)
    ? keywords
    : keywords
      ? keywords.split(",").map((k) => k.trim())
      : DEFAULT_KEYWORDS;

  const allKeywords = Array.from(new Set([...userKeywords, ...BASE_SEO_KEYWORDS]));
  const keywordString = allKeywords.join(", ");
  const currentOgTitle = ogTitle || title || defaultTitle;
  const currentOgDesc = ogDescription || description;
  const currentTwitterTitle = twitterTitle || title || defaultTitle;
  const currentTwitterDesc = twitterDescription || description;
  const currentTwitterImage = twitterImage || ogImage;

  return (
    <Helmet
      title={title}
      defaultTitle={defaultTitle}
      titleTemplate={titleTemplate}
    >
      {/* Standard Meta Tags */}
      {description && <meta name="description" content={description} />}
      {keywordString && <meta name="keywords" content={keywordString} />}
      <meta name="author" content="Mihir Patel (patelmihir2715, patelmihir_01), Mayur Chaudhari (Mayurchauhdary198)" />
      <meta name="creator" content="Mihir Patel, Mayur Chaudhari" />
      <meta name="publisher" content="Mihir Patel, Mayur Chaudhari" />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Tags */}
      {currentOgTitle && <meta property="og:title" content={currentOgTitle} />}
      {currentOgDesc && <meta property="og:description" content={currentOgDesc} />}
      {ogType && <meta property="og:type" content={ogType} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Tags */}
      <meta name="twitter:card" content={twitterCard} />
      {currentTwitterTitle && <meta name="twitter:title" content={currentTwitterTitle} />}
      {currentTwitterDesc && <meta name="twitter:description" content={currentTwitterDesc} />}
      {currentTwitterImage && <meta name="twitter:image" content={currentTwitterImage} />}

      {/* Additional head tags passed as children */}
      {children}
    </Helmet>
  );
}

export { Helmet };
export default SEO;
