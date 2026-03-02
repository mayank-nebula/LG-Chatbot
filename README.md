add_action('rest_api_init', function () {
    register_rest_route('site/v1', '/options', [
        'methods'  => 'GET',
        'callback' => function () {
            return get_fields('option'); // ACF options page
        },
        'permission_callback' => '__return_true'
    ]);
});
