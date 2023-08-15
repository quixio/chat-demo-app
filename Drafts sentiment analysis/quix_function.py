import quixstreams as qx
from transformers import Pipeline
import pandas as pd
from draft_message import DraftMessage


class QuixFunction:
    def __init__(self, consumer_stream: qx.StreamConsumer, producer_stream: qx.StreamProducer, classifier: Pipeline, state):
        self.consumer_stream = consumer_stream
        self.producer_stream = producer_stream
        self.classifier = classifier
        self.state = state

    # Callback triggered for each new timeseries data.
    def on_dataframe_handler(self, consumer_stream: qx.StreamConsumer, df_all_messages: pd.DataFrame):
        
        # Use the model to predict sentiment label and confidence score on received messages
        model_response = self.classifier(list(df_all_messages["chat-message"]))

        # Add the model response ("label" and "score") to the pandas dataframe
        df = pd.concat([df_all_messages, pd.DataFrame(model_response)], axis = 1)

        # Iterate over the df to work on each message
        for i, row in df.iterrows():
            
            # Get the draft message for the user, or create a new one if needed.
            draft_msg = self.get_or_create_draft_message(row['TAG__name'], row['TAG__draft_id'], row['timestamp'])

            # Calculate "sentiment" feature using label for sign and score for magnitude
            df.loc[i, "sentiment"] = row["score"] if row["label"] == "POSITIVE" else - row["score"]

            # Add typing_duration_ms and words_count
            df.loc[i, "typing_duration_ms"] = draft_msg.get_typing_duration_ms(row["timestamp"]) # type: ignore
            df.loc[i, "words_count"] = len(row["chat-message"].split()) # type: ignore

        # Output data with new features
        self.producer_stream.timeseries.publish(df)

    def get_or_create_draft_message(self, user: str, draft_id: str, timestamp: int):
        # Get the user's last draft message
        last_draft_msg = self.state[user]

        # If no draft exists or the draft IDs don't match, create a new draft
        if last_draft_msg is None or last_draft_msg.draft_id != draft_id:
            draft_msg = DraftMessage(draft_id=draft_id, created_at_ns=timestamp)
            self.state[user] = draft_msg 
        else:
            # Use the existing draft if the IDs match, indicating the user is still editing the same message
            draft_msg = last_draft_msg

        return draft_msg
