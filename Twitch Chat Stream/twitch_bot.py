import twitchio
from twitchio.ext import commands


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

    async def part_offline_channels(self):
        connected_channel_names = [channel.name for channel in self.connected_channels]
        live_channels = await self.fetch_streams(user_logins=connected_channel_names, type='live')
        live_channel_names = [stream.user.name for stream in live_channels]
        offline_channel_names = list(set(connected_channel_names) - set(live_channel_names))

        await self.part_channels(offline_channel_names)

        print(f'Parted from channels: {offline_channel_names}')

    async def get_unjoined_top_streams(self, count: int):
        connected_channel_names = [channel.name for channel in self.connected_channels]
        live_channels = await self.fetch_streams(user_logins=connected_channel_names, type='live')
        live_channel_names = [stream.user.name for stream in live_channels]
        offline_channel_names = list(set(connected_channel_names) - set(live_channel_names))

        await self.part_channels(offline_channel_names)

        print(f'Parted from channels: {offline_channel_names}')