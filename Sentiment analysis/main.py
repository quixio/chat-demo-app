from streamingdataframes import Application
from streamingdataframes.models import (
    QuixTimeseriesDeserializer,
    QuixTimeseriesSerializer,
    JSONDeserializer
)
import os
print(os.environ["input"])
print(os.environ["Quix__Sdk__Token"])

app = Application.Quix(consumer_group="sentiment-v3", auto_offset_reset="earliest")

source_topic = app.topic(os.environ["input"], value_deserializer=JSONDeserializer())
output_topic = app.topic(os.environ["output"], value_serializer=QuixTimeseriesSerializer())

sdf = app.dataframe([source_topic])
sdf.apply(lambda row: print(row["V"]["Timestamps"]))

app.run(sdf)





import quixstreams as qx
from quix_function import QuixFunction
from transformers import pipeline
import os

classifier = pipeline('sentiment-analysis')

buffer_delay = int(os.environ["buffer_delay"])

# Quix injects credentials automatically to the client.
# Alternatively, you can always pass an SDK token manually as an argument.
client = qx.QuixStreamingClient()

# Change consumer group to a different constant if you want to run model locally.
print("Opening input and output topics")

consumer_topic = client.get_topic_consumer(
    os.environ["input"], 
    "sentiment-analysis",
    auto_offset_reset = qx.AutoOffsetReset.Earliest)
producer_topic = client.get_topic_producer(os.environ["output"])


# Callback called for each incoming stream
def read_stream(consumer_stream: qx.StreamConsumer):

    # Create a new stream to output data
    producer_stream = producer_topic.get_or_create_stream(consumer_stream.stream_id)
    producer_stream.properties.parents.append(consumer_stream.stream_id)

    # handle the data in a function to simplify the example
    quix_function = QuixFunction(consumer_stream, producer_stream, classifier)

    buffer = consumer_stream.timeseries.create_buffer()
    buffer.time_span_in_milliseconds = buffer_delay
    buffer.buffer_timeout = buffer_delay

    # React to new data received from input topic.
    buffer.on_dataframe_released = quix_function.on_dataframe_handler

    # When input stream closes, we close output stream as well. 
    def on_stream_close(stream_consumer: qx.StreamConsumer, end_type: qx.StreamEndType):
        producer_stream.close()
        print("Stream closed:" + producer_stream.stream_id)

    consumer_stream.on_stream_closed = on_stream_close


# Subscribe to events before initiating read to avoid losing out on any data
consumer_topic.on_stream_received = read_stream

print("Listening to streams. Press CTRL-C to exit.")

# Handle graceful exit of the model.
qx.App.run()