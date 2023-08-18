import quixstreams as qx
import os
import threading
import time

client = qx.QuixStreamingClient()

topic_consumer = client.get_topic_consumer(os.environ["input"], consumer_group = "counter", auto_offset_reset=qx.AutoOffsetReset.Latest)
topic_producer = client.get_topic_producer(os.environ["output"])

messages_received_accross_all_streams = 0

def on_data_released(stream_consumer: qx.StreamConsumer, data: qx.TimeseriesData):
    global messages_received_accross_all_streams
    messages_received_accross_all_streams =+ len(data.timestamps)
    
def on_stream_received_handler(stream_consumer: qx.StreamConsumer):
    buffer = stream_consumer.timeseries.create_buffer()
    buffer.on_data_released = on_data_released

def publish_count_every_second():
    global messages_received_accross_all_streams
    while True:
        total_msgs = messages_received_accross_all_streams
        messages_received_accross_all_streams = 0
        
        stream_producer = topic_producer.get_or_create_stream(stream_id = "count")
        stream_producer.timeseries.buffer.add_timestamp_nanoseconds(time.time_ns()) \
            .add_value("count", total_msgs) \
            .publish()
        print("count: " + str(total_msgs))
        time.sleep(1)

# Create a new thread that will execute the print_message function
t = threading.Thread(target=publish_count_every_second)

# subscribe to new streams being received
topic_consumer.on_stream_received = on_stream_received_handler

# Start the new thread
t.start()

# Handle termination signals and provide a graceful exit
qx.App.run()