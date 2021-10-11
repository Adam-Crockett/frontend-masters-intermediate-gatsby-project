module.exports = {
    siteMetadata: {
        title: 'My Book Club',
        navItems: [
            {
                label: 'Books',
                path:"/books",
            },
            {
                label: 'Authors',
                path:"/authors",
            },
        ],
    },
    plugins: [
        'gatsby-theme-shared-nav',
        'gatsby-plugin-image',
        'gatsby-plugin-sharp',
        'gatsby-transformer-sharp',
    ],
};
