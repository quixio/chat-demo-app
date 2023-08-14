import quixstreams as qx
from transformers import Pipeline
import pandas as pd
from .draft_message import DraftMessage


class QuixFunction:
    def __init__(self, consumer_stream: qx.StreamConsumer, producer_stream: qx.StreamProducer, classifier: Pipeline, state):
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

        user = df_all_messages['TAG__name'][0]
        draft_id = df_all_messages['TAG__draft_id'][0]
        timestamp = df_all_messages['timestamp'][0]

        last_draft_msg = DraftMessage.from_string(self.state[user]) if self.state[user] is not None else None

        if last_draft_msg is None or last_draft_msg.draft_id != draft_id:
            draft_msg = DraftMessage(draft_id=draft_id, created_at_ns=timestamp)
            self.state[user] = str(draft_msg)
        else:
            draft_msg = DraftMessage.from_string(self.state[user])


        # Use the model to predict sentiment label and confidence score on received messages
        model_response = self.classifier(list(df_all_messages["chat-message"]))

        print(df_all_messages)       

        # Add the model response ("label" and "score") to the pandas dataframe
        df = pd.concat([df_all_messages, pd.DataFrame(model_response)], axis = 1)

        # Iterate over the df to work on each message
        for i, row in df.iterrows():

            # Calculate "sentiment" feature using label for sign and score for magnitude
            df.loc[i, "sentiment"] = row["score"] if row["label"] == "POSITIVE" else - row["score"]

            # Add typing_duration_ms and words_count
            df.loc[i, "typing_duration_ms"] = draft_msg.get_typing_duration_ms(row["timestamp"]) # type: ignore
            df.loc[i, "words_count"] = len(row["chat-message"].split()) # type: ignore

        # Output data with new features
        self.producer_stream.timeseries.publish(df)