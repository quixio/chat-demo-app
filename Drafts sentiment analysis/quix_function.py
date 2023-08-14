import quixstreams as qx
from transformers import Pipeline
import pandas as pd


class QuixFunction:
    def __init__(self, consumer_stream: qx.StreamConsumer, producer_stream: qx.StreamProducer, classifier: Pipeline, state: qx.DictStreamState):
        self.consumer_stream = consumer_stream
        self.producer_stream = producer_stream
        self.classifier = classifier
        self.state = state

    # Callback triggered for each new event.
    def on_event_data_handler(self, stream_consumer: qx.StreamConsumer, data: qx.EventData):
        print(data.value)
        print("events")

    # Callback triggered for each new parameter data.
    def on_dataframe_handler(self, consumer_stream: qx.StreamConsumer, df_all_messages: pd.DataFrame):

        print(df_all_messages)
        name = df_all_messages['TagValues.name'][0][0]
        print(name)
        # Use the model to predict sentiment label and confidence score on received messages
        model_response = self.classifier(list(df_all_messages["chat-message"]))

        print(df_all_messages)       

        # Add the model response ("label" and "score") to the pandas dataframe
        df = pd.concat([df_all_messages, pd.DataFrame(model_response)], axis = 1)

        # Iterate over the df to work on each message
        for i, row in df.iterrows():

            # Calculate "sentiment" feature using label for sign and score for magnitude
            df.loc[i, "sentiment"] = row["score"] if row["label"] == "POSITIVE" else - row["score"]

            # Add average sentiment (and update memory)
            self.state['count'] = self.state['count'] + 1
            self.state['sum'] = self.state['sum'] + df.loc[i, "sentiment"]
            df.loc[i, "average_sentiment"] = self.state['sum']/self.state['count']

        # Output data with new features
        self.producer_stream.timeseries.publish(df)