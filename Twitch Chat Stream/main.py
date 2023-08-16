# This code will publish the CSV data to a stream as if the data were being generated in real-time.

import quixstreams as qx
import time
import os
import irc
import irc.connection


twitch_channel_name = os.environ["Twitch_channel"]
twitch_nickname = os.environ["Twitch_nickname"]
twitch_oauth = os.environ["Twitch_oauth"]

# Quix Platform injects credentials automatically to the client.
# Alternatively, you can always pass an SDK token manually as an argument.
client = qx.QuixStreamingClient()

print(f"Opening producer topic: {os.environ['Topic']}")
# The producer topic is where the data will be published to
# It's the output from this demo data source code.
topic_producer = client.get_topic_producer(os.environ["Topic"])

#####################
# Create a new stream
#####################
# A stream is a collection of data that belong to a single session of a single source.
stream_producer = topic_producer.create_stream(twitch_channel_name)

# Configure the buffer to publish data as desired.
# See docs for more options. Search "using-a-buffer"
stream_producer.timeseries.buffer.time_span_in_milliseconds = 100


def publish_chat_message(user: str, message: str, role: str = "Customer"):
    # create a Timeseries Data
    timeseries_data = qx.TimeseriesData()

    timeseries_data \
        .add_timestamp_nanoseconds(time.time_ns()) \
        .add_value("chat-message", message) \
        .add_tags({"room": twitch_channel_name, "name": user, "role": role})

    # publish the data to the Quix stream created earlier
    stream_producer.timeseries.buffer.publish(timeseries_data)

# Callback function when a public message is received
def on_pubmsg(connection, event):
    # Publish the message to the Quix stream
    publish_chat_message(event.source.nick, event.arguments[0])


# Create an IRC connection and client
irc_conn = irc.connection.Factory().connect(
    server="irc.chat.twitch.tv",
    port=6667,
    nickname=twitch_nickname,
    password=twitch_oauth
)

irc_client = irc.client.IRC()
irc_client.add_global_handler("pubmsg", on_pubmsg)
irc_client.add_connection(irc_conn)

# Join the desired Twitch channel
irc_conn.join(f"#{twitch_channel_name}")

# Start processing events
irc_client.process_forever()



# keep the app running and handle termination signals.
qx.App.run()