import requests
import json

CLIENT_ID = 'elqo0jjhhzxyat9mhtniuowdj0tipj'
CLIENT_SECRET = 'ifb1km2w404mtcbh2s7moewiud77bs'
BASE_URL = 'https://api.twitch.tv/helix/'

HEADERS = {
    'Client-ID': CLIENT_ID,
    'Content-Type': 'application/json',
}

def get_oauth_token(client_id, client_secret):
    url = 'https://id.twitch.tv/oauth2/token'
    payload = {
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials'
    }
    response = requests.post(url, params=payload)
    return response.json().get('access_token')

def _get_top_streams(oauth_token: str, limit: int):
    headers = {
        **HEADERS,
        'Authorization': f"Bearer {oauth_token}"
    }
    params = {
        'first': limit
    }
    response = requests.get(f"{BASE_URL}streams", headers=headers, params=params)
    return response.json().get('data', [])

def get_top_streams(limit: int = 50):
    oauth_token = get_oauth_token(CLIENT_ID, CLIENT_SECRET)
    top_streams = get_top_streams(oauth_token, limit)

    return [stream["user_name"] for stream in top_streams]