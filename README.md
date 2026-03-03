add_action('rest_api_init', function () {

    register_rest_route('site/v1', '/options/(?P<slug>[a-zA-Z0-9_-]+)', [
        'methods'  => 'GET',
        'callback' => function ($data) {

            // Disable external object cache for this request
            wp_using_ext_object_cache(false);
            wp_suspend_cache_addition(true);

            $slug    = $data['slug'];
            $post_id = str_replace('-', '_', $slug);

            // Clear ACF + WP caches
            if (function_exists('acf_flush_value_cache')) {
                acf_flush_value_cache($post_id);
            }
            clean_post_cache($post_id);
            wp_cache_delete($post_id, 'post_meta');

            // Get fresh fields (disable formatting cache)
            $fields = get_fields($post_id, false);

            if (!$fields) {
                return new WP_Error(
                    'no_options_found',
                    'No options found for this slug',
                    ['status' => 404]
                );
            }

            $response = new WP_REST_Response($fields);

            // Strong no-cache headers
            $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->header('Pragma', 'no-cache');
            $response->header('Expires', '0');

            return $response;
        },
        'permission_callback' => '__return_true'
    ]);

});
