add_filter('rest_pre_serve_request', function ($served, $result, $request, $server) {

    if (strpos($request->get_route(), '/site/v1/') !== false) {

        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');

        header_remove('Last-Modified');
        header_remove('ETag');
    }

    return $served;

}, 10, 4);
