from typing import List
import twitchio
from twitchio.ext import commands


class Bot(commands.Bot):

    def __init__(self, token: str, channels_to_join: List[str], on_message_handler):
        # Initialise our Bot with our access token, prefix and a list of channels to join on boot...
        # prefix can be a callable, which returns a list of strings or a string...
        # initial_channels can also be a callable which returns a list of strings...
        self.on_message_handler = on_message_handler 
        super().__init__(token=token, prefix='!', initial_channels=channels_to_join)

    async def event_ready(self):
        # Notify us when everything is ready!
        # We are logged in and ready to chat and use commands...
        print(f'Logged in as | {self.nick}')
        print(f'User id is | {self.user_id}')

    async def event_message(self, message: twitchio.Message):
        # Messages with echo set to True are messages sent by the bot...
        # For now we just want to ignore them...
        if message.echo:
            return

        user=message.author.name
        message=message.content
        channel=message.channel.name

        if not user or not message or not channel:
            return

        self.on_message_handler(user=user, message=message, channel=channel)

        # Since we have commands and are overriding the default `event_message`
        # We must let the bot know we want to handle and invoke our commands...
        #await self.handle_commands(message)

    # @commands.command()
    # async def hello(self, ctx: commands.Context):
    #     # Here we have a command hello, we can invoke our command with our prefix and command name
    #     # e.g ?hello
    #     # We can also give our commands aliases (different names) to invoke with.

    #     # Send a hello back!
    #     # Sending a reply back to the channel is easy... Below is an example.
    #     await ctx.send(f'Hello {ctx.author.name}!')