import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Ressonance',
  tagline: 'Websockets made cheap, easy and fast',
  favicon: 'img/logo.png',

  future: {
    v4: true,
  },

  url: 'https://blog.ressonance.com',
  baseUrl: '/',
  organizationName: 'ressonancia',
  projectName: 'ressonance-blog',
  trailingSlash: false,
  deploymentBranch: 'master',
  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: {
          routeBasePath: '/',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },

        gtag: {
          trackingID: 'G-YQ2T3YF2JV',
          anonymizeIP: true,
        },

        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */

    ({
      metadata: [
        { name: 'og:title', content: 'Ressonance - Websockets made easy' },
        { name: 'og:description', content: 'Ressonance - The easy and cheapest way to run your websockets' },
        { name: 'og:image', content: 'img/docusaurus-social-card.jpg' },
        { name: 'twitter:card', content: 'img/docusaurus-social-card.jpg' }, // Or 'summary'
        { name: 'twitter:image', content: 'img/docusaurus-social-card.jpg' },
      ],
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Ressonance Blog',
        logo: {
          alt: 'Ressonance Blog Logo',
          src: 'img/logo.png',
          href: '/',
        },
        items: [
          {
            href: 'https://github.com/ressonancia',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Visit ressonance docs',
                to: 'https://docs.ressonance.com',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'X',
                href: 'https://x.com/@RessonanceCom',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/ressonancia',
              },
              {
                label: 'Blog',
                href: '/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ressonance.com`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }
    ),
};

export default config;
