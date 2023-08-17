import os
import time
import quixstreams as qx
from twitch_bot import Bot
from twitch_api import get_top_streams


twitch_token = os.environ["TwitchBotToken"]
channels_to_join = get_top_streams(limit=70)

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


bot = Bot(token=twitch_token, channels_to_join=channels_to_join, on_message_handler=publish_chat_message)
bot.run()