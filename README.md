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

    // Child Pages Under Parent

    $pages = [
        'home-page',
        'about-page',
        'contact-page',
        'services-page',
        'blog-page',
        'portfolio-page',
        'faq-page',
        'pricing-page',
        'team-page',
        'testimonials-page'
    ];

    foreach ($pages as $slug) {

        acf_add_options_sub_page([
            'page_title'  => ucwords(str_replace('-', ' ', $slug)),
            'menu_title'  => ucwords(str_replace('-', ' ', $slug)),
            'menu_slug'   => $slug,
            'parent_slug' => 'site-pages',

            // IMPORTANT: unique storage key
            'post_id'     => str_replace('-', '_', $slug),
        ]);
    }

});













add_action('rest_api_init', function () {

    register_rest_route('site/v1', '/options/(?P<slug>[a-zA-Z0-9_-]+)', [
        'methods'  => 'GET',
        'callback' => function ($data) {

            $slug = $data['slug'];
            $post_id = str_replace('-', '_', $slug);

            $fields = get_fields($post_id);

            if (!$fields) {
                return new WP_Error(
                    'no_options_found',
                    'No options found for this slug',
                    ['status' => 404]
                );
            }

            return $fields;
        },
        'permission_callback' => '__return_true'
    ]);

});
