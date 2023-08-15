from dataclasses import dataclass

@dataclass(frozen=True)
class DraftMessage:
    draft_id: str
    created_at_ns: int

    def get_typing_duration_ms(self, end_time_ns: int) -> int:
        """Calculates the typing duration in milliseconds from a given end time in nanoseconds."""
        duration_ns = end_time_ns - self.created_at_ns
        return duration_ns // 1_000_000  # Convert the difference from ns to ms
    
    def __str__(self) -> str:
        """Returns the string representation of the DraftMessage."""
        return f"{self.draft_id}|{self.created_at_ns}"
