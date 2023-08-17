import os
from twitch_bot import Bot

twitch_token = os.environ["TwitchToken"]
channels_to_join = ["xQc", "ElMariana", "PaymoneyWubby", "rivers_gg", "Rubius", "eliasn97", "sneakylol", "Caedrel", "Becca", "Fextralife"]

print(twitch_token)

bot = Bot(token=twitch_token, channels_to_join=channels_to_join)
bot.run()