import asyncio
from typing import List, AsyncGenerator
import twitchio
from twitchio.ext import commands
from twitch_api import get_top_streams, get_live_streams_by_users, TwitchStream


class Bot(commands.Bot):
    
    def __init__(self, token: str, on_ready_handler, on_message_handler):
        self.on_message_handler = on_message_handler 
        self.on_ready_handler = on_ready_handler
        super().__init__(token=token, prefix="!")

    async def event_ready(self):
        # Notify us when everything is ready!
        # We are logged in and ready to chat and use commands...
        print(f'Logged in as | {self.nick}')
        print(f'User id is | {self.user_id}')
        await self.on_ready_handler()

    async def event_message(self, message: twitchio.Message):
        # Messages with echo set to True are messages sent by the bot...
        # For now we just want to ignore them...
        if message.echo:
            return

        user=message.author.name
        msg_content=message.content
        channel=message.channel.name
        timestamp=message.timestamp

        if not user or not message or not channel:
            return

        self.on_message_handler(user=user, message=msg_content, channel=channel, timestamp=timestamp)

    # Joining top streams in batches of 20 because of joining rate limit
    async def join_top_streams_in_batches(self, streams_to_join: int) -> List[str]:
        top_live_channel_dict = {stream.user_login: stream for stream in get_top_streams(limit=streams_to_join)}

        joined_channel_names = [channel.name for channel in self.connected_channels]
        channels_to_join = list(set(top_live_channel_dict.keys()) - set(joined_channel_names))
        channels_to_part = list(set(joined_channel_names) - set(top_live_channel_dict.keys()))
        
        max_channels_to_join = streams_to_join - len(joined_channel_names)
        print(f"Total channels to join: {max_channels_to_join}")

        for i in range(0, len(channels_to_join[:max_channels_to_join]), 20):
            channels_names_batch = channels_to_join[i:i + 20]
            
            print(f"Joining channels {len(channels_names_batch)}: {channels_names_batch}")
            await self.join_channels(channels_names_batch)
            
            await asyncio.sleep(15)  # Wait for 15 seconds between batches

        return top_live_channel_dict.values()


    async def part_channels(self, top_streams: List[TwitchStream]) -> List[str]:
        print(top_streams)
        joined_channel_names = [channel.name for channel in self.connected_channels]
        top_stream_names = [stream.user_login for stream in top_streams]
        
        channels_to_part = list(set(joined_channel_names) - set(top_stream_names))
        await self.part_channels(channels_to_part)

        print(f'Parted from {len(channels_to_part)} channels: {channels_to_part}')
        return channels_to_part