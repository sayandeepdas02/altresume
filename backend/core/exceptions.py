from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import traceback

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the HTTP status code to the response.
    if response is not None:
        if 'detail' in response.data:
            response.data['error'] = response.data.pop('detail')
        elif isinstance(response.data, list):
            response.data = {'error': response.data[0]}
        elif isinstance(response.data, dict) and 'error' not in response.data:
            # Get the first error message from the dictionary
            first_key = list(response.data.keys())[0]
            if isinstance(response.data[first_key], list):
                response.data = {'error': f"{first_key}: {response.data[first_key][0]}"}
            else:
                response.data = {'error': response.data[first_key]}
    else:
        # Unhandled exception logic
        traceback.print_exc()
        return Response({
            'error': 'An internal server error occurred.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
