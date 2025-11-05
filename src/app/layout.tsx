import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Related subreddits based on your comments',
  description: 'This visualization of related subreddits helps you find related subreddits',
  authors: [{ name: 'Andrei Kashcha' }],
  openGraph: {
    title: 'Graph of related subreddits',
    description: 'This visualization of related subreddits helps you find related subreddits',
    images: ['https://i.imgur.com/ysfYACZ.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TXT6313TGG"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TXT6313TGG');
          `
        }} />
      </head>
      <body className="font-sans antialiased text-primary bg-background">
        {children}
      </body>
    </html>
  )
}
