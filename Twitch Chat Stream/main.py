# This code will publish the CSV data to a stream as if the data were being generated in real-time.

import quixstreams as qx
import time
import os
from twitchio.ext import commands



twitch_channel_name = "nmplol"
twitch_nickname = "quixdemo"
twitch_oauth = "oauth:0sioqjjxi5ohy70u8fkvtpxf9zrrxy"

# Quix Platform injects credentials automatically to the client.
# Alternatively, you can always pass an SDK token manually as an argument.
# client = qx.QuixStreamingClient()

# The producer topic is where the data will be published to
# It's the output from this demo data source code.
# topic_producer = client.get_topic_producer(os.environ["Topic"])

#####################
# Create a new stream
#####################
# A stream is a collection of data that belong to a single session of a single source.
# stream_producer = topic_producer.create_stream(twitch_channel_name)

# Configure the buffer to publish data as desired.
# See docs for more options. Search "using-a-buffer"
# stream_producer.timeseries.buffer.time_span_in_milliseconds = 100


# def publish_chat_message(user: str, message: str, role: str = "Customer"):
#     # create a Timeseries Data
#     timeseries_data = qx.TimeseriesData()

#     timeseries_data \
#         .add_timestamp_nanoseconds(time.time_ns()) \
#         .add_value("chat-message", message) \
#         .add_tags({"room": twitch_channel_name, "name": user, "role": role})

#     # publish the data to the Quix stream created earlier
#     stream_producer.timeseries.buffer.publish(timeseries_data)

# Callback function when a public message is received
# def on_pubmsg(connection, event):
#     # Publish the message to the Quix stream
#     publish_chat_message(event.source.nick, event.arguments[0])


twitch_bot = commands.Bot(
    irc_token=twitch_oauth,
    api_token=twitch_oauth,
    token=twitch_oauth,
    nick=twitch_nickname,
    prefix="!",  # This is the prefix for commands you'll use in chat, e.g. "!hello"
    initial_channels=[twitch_channel_name],
    client_secret=twitch_oauth
    
)


@twitch_bot.event
async def event_ready():
    print(f'We are logged in as {twitch_bot.nick}')

@twitch_bot.event
async def event_message(ctx):

    await twitch_bot.handle_commands(ctx)

    # Print the chat message to console
    print(f'Message from {ctx.author.name}: {ctx.content}')


twitch_bot.run()

# # keep the app running and handle termination signals.
# qx.App.run()

# import quixstreams as qx
# import time
# import os
# import irc
# import irc.connection


# twitch_channel_name = os.environ["TwitchChannel"]
# twitch_nickname = os.environ["TwitchNickname"]
# twitch_oauth = os.environ["TwitchOauth"]

# # Quix Platform injects credentials automatically to the client.
# # Alternatively, you can always pass an SDK token manually as an argument.
# client = qx.QuixStreamingClient()

# print(f"Opening producer topic: {os.environ['Topic']}")
# # The producer topic is where the data will be published to
# # It's the output from this demo data source code.
# topic_producer = client.get_topic_producer(os.environ["Topic"])

# #####################
# # Create a new stream
# #####################
# # A stream is a collection of data that belong to a single session of a single source.
# stream_producer = topic_producer.create_stream(twitch_channel_name)

# # Configure the buffer to publish data as desired.
# # See docs for more options. Search "using-a-buffer"
# stream_producer.timeseries.buffer.time_span_in_milliseconds = 100


# def publish_chat_message(user: str, message: str, role: str = "Customer"):
#     # create a Timeseries Data
#     timeseries_data = qx.TimeseriesData()

#     timeseries_data \
#         .add_timestamp_nanoseconds(time.time_ns()) \
#         .add_value("chat-message", message) \
#         .add_tags({"room": twitch_channel_name, "name": user, "role": role})

#     # publish the data to the Quix stream created earlier
#     stream_producer.timeseries.buffer.publish(timeseries_data)

# # Callback function when a public message is received
# def on_pubmsg(connection, event):
#     # Publish the message to the Quix stream
#     print(f"Received a msg from: {event.source.nick}, msg: {event.arguments[0]}")
#     publish_chat_message(event.source.nick, event.arguments[0])


# # Create an IRC connection and client
# irc_conn = irc.client.Server().connect(
#     server="irc.chat.twitch.tv",
#     port=6667,
#     nickname=twitch_nickname,
#     password=twitch_oauth
# )

# irc_client = irc.client.IRC()
# irc_client.add_global_handler("pubmsg", on_pubmsg)
# irc_client.add_connection(irc_conn)

# # Join the desired Twitch channel
# irc_conn.join(f"#{twitch_channel_name}")

# # Start processing events
# irc_client.process_forever()



# # keep the app running and handle termination signals.
# qx.App.run()