import os
import datetime
import asyncio
from typing import List
import quixstreams as qx
from twitch_api import TwitchStream
from twitch_bot import Bot


streams_to_join_count = min(int(os.environ["StreamsToJoinCount"]), 100) # Current max is 100 duo to API limitations, can be increased with additional work
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

async def update_stream_properties(channel: TwitchStream, topic_producer: qx.TopicProducer):
    stream = topic_producer.get_or_create_stream(channel.user_login)
    meta = stream.properties.metadata
    meta['game_name']= channel.game_name
    meta['thumbnail_url'] = channel.thumbnail_url
    meta['title'] = channel.title
    meta['viewer_count'] = str(channel.viewer_count)

async def close_streams(stream_ids: List[str], topic_producer: qx.TopicProducer):
    for stream_id in stream_ids:
        stream = topic_producer.get_or_create_stream(stream_id)
        stream.close()

async def join_channels_in_batches():
    while True:
        print(f"Connected channels: {len(bot.connected_channels)}")  

        # Join top twitch channels and update stream properties
        joined_channels = await bot.join_top_streams_in_batches(int(streams_to_join_count))
        for channel in joined_channels:
            await update_stream_properties(channel, topic_producer)

        # Disconnect from offline channels and close streams
        parted_channels = await bot.part_channels_except(joined_channels)
        await close_streams(parted_channels, topic_producer)
        
        await asyncio.sleep(300)  # Wait for 5 minutes
        
twitch_token = os.environ["TwitchBotToken"]
bot = Bot(token=twitch_token, on_ready_handler=join_channels_in_batches, on_message_handler=publish_chat_message)
bot.run()