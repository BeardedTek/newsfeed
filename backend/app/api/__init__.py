import os
def debug_log(msg):
    if os.environ.get('BACKEND_DEBUG', '').lower() == 'true':
        print(f'[DEBUG] {msg}')