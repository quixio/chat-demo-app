from dataclasses import dataclass
import os
import requests
from typing import List

CLIENT_ID = os.environ["TwitchAppClientId"]
CLIENT_SECRET = os.environ["TwitchAppClientSecret"]
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
        'first': limit,
        'type': 'live',
        'language': 'en'
    }
    response = requests.get(f"{BASE_URL}streams", headers=headers, params=params)
    return response.json().get('data', [])

def get_top_streams(limit: int = 50) -> List["TwitchStream"]:
    oauth_token = get_oauth_token(CLIENT_ID, CLIENT_SECRET)
    top_streams = _get_top_streams(oauth_token, limit)

    return [TwitchStream.from_dict(stream) for stream in top_streams]

@dataclass
class TwitchStream:
    id: str
    user_id: str
    user_login: str
    user_name: str
    game_id: str
    game_name: str
    type: str
    title: str
    viewer_count: int
    started_at: str
    language: str
    thumbnail_url: str
    tag_ids: List[str]
    tags: List[str]
    is_mature: bool

    @classmethod
    def from_dict(cls, data):
        return cls(
            id=data['id'],
            user_id=data['user_id'],
            user_login=data['user_login'],
            user_name=data['user_name'],
            game_id=data['game_id'],
            game_name=data['game_name'],
            type=data['type'],
            title=data['title'],
            viewer_count=data['viewer_count'],
            started_at=data['started_at'],
            language=data['language'],
            thumbnail_url=data['thumbnail_url'],
            tag_ids=data['tag_ids'],
            tags=data['tags'],
            is_mature=data['is_mature']
        )