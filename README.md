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

            $response = new WP_REST_Response($fields);

            // Disable caching
            $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->header('Pragma', 'no-cache');
            $response->header('Expires', '0');

            return $response;
        },
        'permission_callback' => '__return_true'
    ]);

});
