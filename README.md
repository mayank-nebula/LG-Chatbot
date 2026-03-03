'callback' => function ($data) {
    $slug = $data['slug'];
    $post_id = str_replace('-', '_', $slug);
    
    // Reset ACF's internal cache for this post only
    acf_get_store('values')->reset($post_id);
    
    $fields = get_fields($post_id); // keep as normal, repeaters safe
    
    if (!$fields) {
        return new WP_Error(
            'no_options_found',
            'No options found for this slug',
            ['status' => 404]
        );
    }

    $response = new WP_REST_Response($fields, 200);
    $response->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    return $response;
},
