import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '101 דייטים ואף נשיכה - אודיובוק',
  description: 'האודיובוק המותאם אישית שלך מוכן להורדה! 🎧',
  openGraph: {
    title: '🎧 101 דייטים ואף נשיכה - אודיובוק',
    description: 'האודיובוק המותאם אישית שלך מוכן להורדה!',
    images: [
      {
        url: 'https://i4iguana.com/images/audiobook-cover.png',
        width: 600,
        height: 900,
        alt: '101 דייטים ואף נשיכה - ניר רם',
      },
    ],
    locale: 'he_IL',
    type: 'website',
    siteName: 'NO-ART GALLERY',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🎧 101 דייטים ואף נשיכה - אודיובוק',
    description: 'האודיובוק המותאם אישית שלך מוכן להורדה!',
    images: ['https://i4iguana.com/images/audiobook-cover.png'],
  },
}

export default function AudiobookDownloadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
