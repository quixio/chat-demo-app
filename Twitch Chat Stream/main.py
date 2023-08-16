import quixstreams as qx
import time
import os
import socket


twitch_channel_name = os.environ["TwitchChannel"]
twitch_nickname = os.environ["TwitchNickname"]
twitch_oauth = os.environ["TwitchOauth"]

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


def connect_to_twitch():
    server = 'irc.chat.twitch.tv'
    port = 6667
    s = socket.socket()
    
    # Connect to the server
    s.connect((server, port))

    # Send authentication commands to the server
    s.send(f"PASS {twitch_oauth}\r\n".encode('utf-8'))
    s.send(f"NICK {twitch_nickname}\r\n".encode('utf-8'))
    s.send(f"JOIN #{twitch_channel_name}\r\n".encode('utf-8'))

    return s


s = connect_to_twitch()

try:
    while True:
        resp = s.recv(2048).decode('utf-8')

        # Respond to Twitch's Ping messages with Pong to maintain the connection
        if resp.startswith('PING'):
            s.send("PONG\n".encode('utf-8'))

        # Extract nickname and message from chat
        elif 'PRIVMSG' in resp:
            nickname = resp.split('!', 1)[0][1:]
            message = resp.split('PRIVMSG', 1)[1].split(':', 1)[1]
            publish_chat_message(user=nickname, message=message.strip())
except KeyboardInterrupt:
    s.close()
    print("\nConnection closed!")
