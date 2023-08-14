from dataclasses import dataclass

@dataclass(frozen=True)
class DraftMessage:
    draft_id: str
    created_at_ns: int

    DIVIDER = "|"

    @property
    def _started_writing_ms(self) -> int:
        """Converts the nanoseconds timestamp to milliseconds."""
        return self.created_at_ns // 1_000_000  # Convert ns to ms
        
    def get_typing_duration_ms(self, end_time_ns: int) -> int:
        """Calculates the typing duration in milliseconds from a given end time in nanoseconds."""
        duration_ns = end_time_ns - self.created_at_ns
        return duration_ns // 1_000_000  # Convert the difference from ns to ms
    
    @staticmethod
    def from_string(message_str: str) -> 'DraftMessage':
        """Creates an instance of DraftMessage from its string representation."""
                
        # Basic validation
        if DraftMessage.DIVIDER not in message_str:
            raise ValueError("Invalid message string format.")

        draft_id, created_at = message_str.split(DraftMessage.DIVIDER)
        
        return DraftMessage(
            str(draft_id), 
            int(created_at)
        )

    def __str__(self) -> str:
        """Returns the string representation of the DraftMessage."""
        return f"{self.draft_id}{DraftMessage.DIVIDER}{self._started_writing_ms}"
