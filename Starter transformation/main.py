import quixstreams as qx
import os
import pandas as pd


client = qx.QuixStreamingClient()

topic_consumer = client.get_topic_consumer(os.environ["input"], consumer_group = "counter", auto_offset_reset=qx.AutoOffsetReset.Earliest)
topic_producer = client.get_topic_producer(os.environ["output"])


def on_data_released(stream_consumer: qx.StreamConsumer, data: qx.TimeseriesData):

    stream_producer = topic_producer.get_or_create_stream(stream_id = "count")
    stream_producer.timeseries.buffer.add_timestamp_nanoseconds(data.timestamps[0].timestamp_nanoseconds) \
        .add_value("count", len(data.timestamps)) \
        .publish()
    print(len(data.timestamps))



def on_stream_received_handler(stream_consumer: qx.StreamConsumer):
    buffer = stream_consumer.timeseries.create_buffer()
    buffer.time_span_in_milliseconds = 1000
    buffer.on_data_released = on_data_released


# subscribe to new streams being received
topic_consumer.on_stream_received = on_stream_received_handler

print("Listening to streams. Press CTRL-C to exit.")

# Handle termination signals and provide a graceful exit
qx.App.run()