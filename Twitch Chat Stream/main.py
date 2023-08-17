import os
import time
import asyncio
import quixstreams as qx
from twitch_bot import Bot
from twitch_api import get_top_streams


client = qx.QuixStreamingClient()

print(f"Opening producer topic: {os.environ['Topic']}")
topic_producer = client.get_topic_producer(os.environ["Topic"])

def publish_chat_message(user: str, message: str, channel: str, role: str = "Customer"):
    timeseries_data = qx.TimeseriesData()
    timeseries_data \
        .add_timestamp_nanoseconds(time.time_ns()) \
        .add_value("chat-message", message) \
        .add_tags({"room": channel, "name": user, "role": role})

    stream_producer = topic_producer.get_or_create_stream(channel)
    stream_producer.timeseries.publish(timeseries_data)

# Joining 100 top streams in batches of 20 because of joining rate limit
async def join_channels_in_batches():

    channels_to_join = get_top_streams(limit=100)
    while True:  
        for i in range(0, len(channels_to_join), 20):
            batch = channels_to_join[i:i + 20]
            print(f"Joining channels: {batch}")
            await bot.join_channels(batch)
            await asyncio.sleep(11)  # Wait for 11 seconds between batches
            await bot.get_connected_offline_channels()
        
        await asyncio.sleep(1800)  # Wait for 30 minutes before the next cycle

    
twitch_token = os.environ["TwitchBotToken"]
bot = Bot(token=twitch_token, on_ready_handler=join_channels_in_batches, on_message_handler=publish_chat_message)
bot.run()