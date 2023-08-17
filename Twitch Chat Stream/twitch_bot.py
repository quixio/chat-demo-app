import asyncio
import twitchio
from twitchio.ext import commands
from twitch_api import get_top_streams


class Bot(commands.Bot):

    def __init__(self, token: str, on_ready_handler, on_message_handler):
        # Initialise our Bot with our access token, prefix and a list of channels to join on boot...
        # prefix can be a callable, which returns a list of strings or a string...
        # initial_channels can also be a callable which returns a list of strings...
        self.on_message_handler = on_message_handler 
        self.on_ready_handler = on_ready_handler
        super().__init__(token=token, prefix='!')

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

        if not user or not message or not channel:
            return

        self.on_message_handler(user=user, message=msg_content, channel=channel)

    # Joining top streams in batches of 20 because of joining rate limit
    async def join_top_streams_in_batches(self, desired_streams_to_join: int):
        top_live_channel_names = get_top_streams(limit=desired_streams_to_join)

        joined_channel_names = [channel.name for channel in self.connected_channels]
        channels_to_join = list(set(top_live_channel_names) - set(joined_channel_names))

        print(f"Total channels to join: {len(channels_to_join)}")

        for i in range(0, len(channels_to_join), 20):
            batch = channels_to_join[i:i + 20]
            
            print(f"Joining channels: {batch}")
            await self.join_channels(batch)
            await asyncio.sleep(11)  # Wait for 11 seconds between batches

    async def part_offline_channels(self):
        joined_channel_names = [channel.name for channel in self.connected_channels]
        live_channels = await self.fetch_streams(user_logins=joined_channel_names, type='live')
        live_channel_names = [stream.user.name for stream in live_channels]
        offline_channel_names = list(set(joined_channel_names) - set(live_channel_names))

        await self.part_channels(offline_channel_names)

        print(f'Parted from {len(offline_channel_names)} channels: {offline_channel_names}')