import os
import datetime
import asyncio
from typing import List
import quixstreams as qx
from twitch_api import TwitchStream
from twitch_bot import Bot


streams_to_join_count = max(int(os.environ["StreamsToJoinCount"]), 100) # Current max is 100 duo to API limitations, can be increased with additional work
client = qx.QuixStreamingClient()

topic_producer = client.get_topic_producer(os.environ["output"])

def publish_chat_message(user: str, message: str, channel: str, timestamp: datetime, role: str = "Customer"):
    timeseries_data = qx.TimeseriesData()
    timeseries_data \
        .add_timestamp(timestamp) \
        .add_value("chat-message", message) \
        .add_tags({"room": "channel", "name": user, "role": role})

    stream_producer = topic_producer.get_or_create_stream(channel)
    stream_producer.timeseries.publish(timeseries_data)

async def update_stream_properties(channel: TwitchStream, topic_producer):
    stream = topic_producer.get_or_create_stream(channel.user_login)
    stream.properties.metadata = {
        "game_name": channel.game_name,
        "tags": channel.tags,
        "thumbnail_url": channel.thumbnail_url,
        "title": channel.title,
        "viewer_count": channel.viewer_count
    }

async def close_offline_streams(parted_channels: List[str], topic_producer):
    for parted_channel in parted_channels:
        stream = topic_producer.get_or_create_stream(parted_channel.user_login)
        stream.close()

async def join_channels_in_batches():
    while True:
        print(f"Connected channels: {len(bot.connected_channels)}")  

        # Join top twitch channels and update stream properties
        async for joined_channels in bot.join_top_streams_in_batches(int(streams_to_join_count)):
            for channel in joined_channels:
                await update_stream_properties(channel, topic_producer)

        await asyncio.sleep(900)  # Wait for 15 minutes

        # Disconnect from offline channels and close streams
        parted_channels = await bot.part_offline_channels()
        await close_offline_streams(parted_channels, topic_producer)
        
        await asyncio.sleep(10)  # Wait for 10 seconds
        
twitch_token = os.environ["TwitchBotToken"]
bot = Bot(token=twitch_token, on_ready_handler=join_channels_in_batches, on_message_handler=publish_chat_message)
bot.run()