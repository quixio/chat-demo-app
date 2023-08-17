from typing import List
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
        self.on_ready_handler()

    async def event_message(self, message: twitchio.Message):
        # Messages with echo set to True are messages sent by the bot...
        # For now we just want to ignore them...
        if message.echo:
            return

        print("timestamp: " + message.timestamp)

        user=message.author.name
        message=message.content
        channel=message.channel.name

        if not user or not message or not channel:
            return

        self.on_message_handler(user=user, message=message, channel=channel)

    async def event_join(self, channel: twitchio.Channel, user: twitchio.User):
        print(f"Joined channel: {channel.name}")

    async def event_join(self, user: twitchio.User):
        print(f"Parted user: {user.name}")