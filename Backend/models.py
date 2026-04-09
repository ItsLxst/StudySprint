from dataclasses import dataclass
from typing import Optional

@dataclass
class User:
    id: Optional[int]
    username: str
    email: str
    password: str

@dataclass
class Task:
    id: Optional[int]
    user_id: int
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = "medium"
    completed: bool = False

@dataclass
class StudySession:
    id: Optional[int]
    user_id: int
    task_id: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration: Optional[int] = None