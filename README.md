add_filter('rest_send_nocache_headers', '__return_true');

add_filter('rest_pre_dispatch', function ($result, $server, $request) {

    if (strpos($request->get_route(), '/site/v1/') !== false) {

        // Disable conditional requests completely
        remove_action('rest_api_init', 'rest_handle_options_request', 10);

        // Prevent Last-Modified / ETag comparison
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');

        // Stop WP from sending 304
        if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE'])) {
            unset($_SERVER['HTTP_IF_MODIFIED_SINCE']);
        }
        if (isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
            unset($_SERVER['HTTP_IF_NONE_MATCH']);
        }
    }

    return $result;

}, 10, 3);
