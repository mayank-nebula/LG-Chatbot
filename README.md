response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Security-Header"
        
        return response
