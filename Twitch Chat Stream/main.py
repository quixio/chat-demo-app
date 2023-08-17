import quixstreams as qx
import time
import os
import socket


twitch_channel_name = os.environ["TwitchChannel"]
twitch_nickname = os.environ["TwitchNickname"]
twitch_oauth = os.environ["TwitchToken"]

twitch_channels_to_join = ["xQc", "ElMariana", "PaymoneyWubby", "rivers_gg", "Rubius", "eliasn97", "sneakylol", "Caedrel", "Becca", "Fextralife"]

# Quix Platform injects credentials automatically to the client.
# Alternatively, you can always pass an SDK token manually as an argument.
client = qx.QuixStreamingClient()

print(f"Opening producer topic: {os.environ['Topic']}")
# The producer topic is where the data will be published to
# It's the output from this demo data source code.
topic_producer = client.get_topic_producer(os.environ["Topic"])


def publish_chat_message(user: str, message: str, channel: str, role: str = "Customer"):
    # create a Timeseries Data
    timeseries_data = qx.TimeseriesData()

    timeseries_data \
        .add_timestamp_nanoseconds(time.time_ns()) \
        .add_value("chat-message", message) \
        .add_tags({"room": channel, "name": user, "role": role})

    # publish the data to the Quix stream created earlier
    stream_producer = topic_producer.get_or_create_stream(channel)
    stream_producer.timeseries.publish(timeseries_data)


def on_message(ws, message):
    data = json.loads(message)
    if data['type'] == 'MESSAGE':
        channel = data['data']['channel_name']
        user = data['data']['from_broadcaster_user']['display_name']
        msg = data['data']['text']
        print(f"[{channel}] {user}: {msg}")

        publish_chat_message(user=user, message=msg, channel=channel)

def on_open(ws):
    for channel in twitch_channels_to_join:
        ws.send(json.dumps({
            "type": "LISTEN",
            "nonce": "noncename",  # you can replace this with any unique string
            "data": {
                "topics": [f"channel-points-channel-v1.{channel}", f"chat_moderator_actions.{channel}", f"whispers.{channel}"],
                "auth_token": twitch_oauth  # Replace with your OAuth token
            }
        }))

    print("Connection opened!")

def on_error(ws, error):
    print(error)

def on_close(ws, close_status_code, close_msg):
    print("### closed ###")

websocket.enableTrace(True)
ws = websocket.WebSocketApp("wss://irc-ws.chat.twitch.tv/",
                            on_message=on_message,
                            on_error=on_error,
                            on_close=on_close,
                            on_open=on_open)

ws.run_forever()
