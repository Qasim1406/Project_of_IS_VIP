import sys
import os
from io import BytesIO
from urllib.parse import urlparse

# Add the parent directory to Python path so we can import the Flask app
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import the Flask app from the main app.py
from Project_of_IS.app import app

# Vercel Blob storage imports
try:
    from vercel.blob import put, get, delete, list
    VERCEL_BLOB_AVAILABLE = True
except ImportError:
    VERCEL_BLOB_AVAILABLE = False

# WSGI adapter for Vercel
def wsgi_to_vercel_response(environ, start_response):
    """Convert WSGI response to Vercel format"""
    # Capture the WSGI response
    status = None
    headers = {}
    body = b''

    def start_response_capture(status_line, response_headers, exc_info=None):
        nonlocal status, headers
        status = status_line.split(' ')[0]
        headers = {name: value for name, value in response_headers}

    # Call the WSGI app
    response = app(environ, start_response_capture)

    # Collect response body
    for chunk in response:
        body += chunk

    return {
        'statusCode': int(status),
        'headers': headers,
        'body': body.decode('utf-8', errors='replace') if isinstance(body, bytes) else body
    }

def handler(request):
    """
    Vercel serverless function handler
    Converts Vercel's request format to WSGI and back
    """
    try:
        # Extract request data from Vercel format
        method = request.get('method', 'GET')
        url = request.get('url', '/')
        headers = request.get('headers', {})
        body = request.get('body', b'')

        # Parse URL
        parsed_url = urlparse(url)
        path = parsed_url.path
        query_string = parsed_url.query

        # Create WSGI environ
        environ = {
            'REQUEST_METHOD': method,
            'SCRIPT_NAME': '',
            'PATH_INFO': path,
            'QUERY_STRING': query_string,
            'CONTENT_TYPE': headers.get('content-type', ''),
            'CONTENT_LENGTH': str(len(body)) if body else '0',
            'SERVER_NAME': 'vercel',
            'SERVER_PORT': '443',
            'wsgi.version': (1, 0),
            'wsgi.url_scheme': 'https',
            'wsgi.input': BytesIO(body) if body else BytesIO(),
            'wsgi.errors': sys.stderr,
            'wsgi.multithread': False,
            'wsgi.multiprocess': False,
            'wsgi.run_once': False,
        }

        # Add HTTP headers
        for key, value in headers.items():
            environ[f'HTTP_{key.upper().replace("-", "_")}'] = value

        # Handle the request
        response = wsgi_to_vercel_response(environ, lambda status, headers: None)

        return response

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': f'{{"error": "Internal server error: {str(e)}"}}'
        }

# Export the handler for Vercel
__vercel_handler__ = handler
