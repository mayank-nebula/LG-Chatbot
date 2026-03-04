add_action('acf/init', function() { 
    // Parent Page (Appears After ACF) 
    acf_add_options_page([ 
        'page_title' => 'Site Pages', 
        'menu_title' => 'Site Pages', 
        'menu_slug'  => 'site-pages', 
        'redirect'   => false, 
        'position'   => 81, 
        'icon_url'   => 'dashicons-admin-generic', 
    ]); 

    // Child Pages Under Parent (Sorted Alphabetically)
    $pages = [ 
        'about-us-page'             => 'About Us Page',
        'community-page'            => 'Community Page',
        'compliance-statement-page' => 'Compliance Statement Page',
        'events-page'               => 'Events Page',
        'faq-page'                  => 'FAQ',
        'footer'                    => 'Footer',
        'gemini-chatbot'            => 'Gemini Chatbot',
        'get-featured-page'         => 'Get Featured Page',
        'header'                    => 'Header',
        'home-page'                 => 'Home Page',
        'impact-page'               => 'Impact Page',
        'linkedin'                  => 'LinkedIn Page',
        'partner-with-us'           => 'Partner With Us',
        'performance-paradox-page'  => 'Performance Paradox Page',
        'podcasts-page'             => 'Podcasts Page',
        'pr-news'                   => 'PR News Page',
        'privacy-policy-page'       => 'Privacy Policy Page',
        'supply-chain-hub-page'     => 'Supply Chain Hub Page',
        'terms-and-conditions-page' => 'Terms And Conditions Page',
        'thoughts-and-coffee-page'  => 'Thoughts And Coffee Page',
        'tpm-today-page'            => 'Tpm Today Page',
        'watch'                     => 'Watch Page',
        'wisc-page'                 => 'WISC Page'
    ]; 

    foreach ($pages as $slug => $title) { 
        acf_add_options_sub_page([ 
            'page_title'  => $title,             
            'menu_title'  => $title,             
            'menu_slug'   => $slug,
            'parent_slug' => 'site-pages', 
            'post_id'     => str_replace('-', '_', $slug),
        ]); 
    } 
});
