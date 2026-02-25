{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://letstalksupplychain.com/#organization",
      "name": "Lets Talk Supply Chain",
      "sameAs": [
        "https://web.facebook.com/letstalksupplychain/",
        "https://twitter.com/LetsTalkSChain"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://letstalksupplychain.com/#website",
      "url": "https://letstalksupplychain.com",
      "name": "Let's Talk Supply Chain",
      "publisher": {
        "@id": "https://letstalksupplychain.com/#organization"
      },
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": "1",
          "item": {
            "@id": "https://letstalksupplychain.com",
            "name": "Home"
          }
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "#webpage",
      "url": "",
      "name": "Page Not Found &bull; Let\u2019s Talk Supply Chain - Podcasts, Live Shows, Industry Experts, Supply Chain News",
      "isPartOf": {
        "@id": "https://letstalksupplychain.com/#website"
      },
      "inLanguage": "en-US",
      "breadcrumb": {
        "@id": "#breadcrumb"
      }
    }
  ]
}
