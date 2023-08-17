import os
import time
import asyncio
import quixstreams as qx
from twitch_bot import Bot


desired_streams_to_join = os.environ["ChannelJoinCount"] # Current max is 100
client = qx.QuixStreamingClient()

topic_producer = client.get_topic_producer(os.environ["Topic"])

def publish_chat_message(user: str, message: str, channel: str, role: str = "Customer"):
    timeseries_data = qx.TimeseriesData()
    timeseries_data \
        .add_timestamp_nanoseconds(time.time_ns()) \
        .add_value("chat-message", message) \
        .add_tags({"room": channel, "name": user, "role": role})

    stream_producer = topic_producer.get_or_create_stream(channel)
    stream_producer.timeseries.publish(timeseries_data)

async def join_channels_in_batches():
    while True:
        print(f"Connected channels: {len(bot.connected_channels)}")  
        await bot.join_top_streams_in_batches(desired_streams_to_join)
        await asyncio.sleep(5)  # Wait for 30 minutes
        await bot.part_offline_channels()
        
twitch_token = os.environ["TwitchBotToken"]
bot = Bot(token=twitch_token, on_ready_handler=join_channels_in_batches, on_message_handler=publish_chat_message)
bot.run()