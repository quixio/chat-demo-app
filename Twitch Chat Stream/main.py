import os
import time
import quixstreams as qx
from twitch_bot import Bot

twitch_token = os.environ["TwitchToken"]
channels_to_join = ["xQc", "ElMariana", "PaymoneyWubby", "rivers_gg", "Rubius", "eliasn97", "sneakylol", "Caedrel", "Becca", "Fextralife", "k3soju", "ratirl"]

client = qx.QuixStreamingClient()

print(f"Opening producer topic: {os.environ['Topic']}")
topic_producer = client.get_topic_producer(os.environ["Topic"])

def publish_chat_message(user: str, message: str, channel: str, role: str = "Customer"):
    print(user + " " + message)


bot = Bot(token=twitch_token, channels_to_join=channels_to_join, on_message_handler=publish_chat_message)
bot.run()