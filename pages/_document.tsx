import { Html, Head, Main, NextScript, DocumentContext } from 'next/document'
import Document from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Meta tags for PWA and mobile optimization */}
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
          <meta name="theme-color" content="#ffffff" />
          <meta name="description" content="Report Calculator - Professional report processing and payment management system" />
          
          {/* Fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
          
          {/* Preconnect for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </Head>
        <body className="bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
