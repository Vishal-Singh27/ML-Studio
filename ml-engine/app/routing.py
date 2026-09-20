from typing import Optional

def determine_task_type(target_column: Optional[str]) -> str:
    """
    Determines if the task is supervised or unsupervised based on the presence
    of a target column.
    """
    if target_column and target_column.strip():
        return "SUPERVISED"
    return "UNSUPERVISED"
