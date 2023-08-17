import asyncio
import websockets
import json

NICK = 'your_twitch_username'
TOKEN = 'oauth:your_twitch_oauth_token'  # Use https://twitchapps.com/tmi/ to get your OAuth token
CHANNELS = ['thijs']  # List of channels you want to join

async def join_channel(channel_name):
    uri = f"wss://irc-ws.chat.twitch.tv:443"
    
    async with websockets.connect(uri) as ws:
        await ws.send(f"PASS {TOKEN}")
        await ws.send(f"NICK {NICK}")
        await ws.send(f"JOIN {channel_name}")

        while True:
            message = await ws.recv()
            if "PRIVMSG" in message:
                # Extract username and message from the raw message string
                username = message.split('!', 1)[0][1:]
                chat_message = message.split('PRIVMSG', 1)[1].split(':', 1)[1]
                print(f"[{channel_name}] {username}: {chat_message}")
            elif "PING" in message:
                await ws.send("PONG :tmi.twitch.tv")

async def main():
    tasks = [join_channel(channel) for channel in CHANNELS]
    await asyncio.gather(*tasks)

if __name__ == '__main__':
    asyncio.run(main())