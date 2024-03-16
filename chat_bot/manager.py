from types import TracebackType
from typing import Optional, Type
from .chat_bot import ChatBot


class ChatBotManager:
    def __init__(self, chat_bot: ChatBot) -> None:
        self.chat_bot = chat_bot

    def __enter__(self) -> ChatBot:
        return self.chat_bot

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ):
        if exc_type:
            print(f"Something went wrong: {exc_val}")
        self.chat_bot.save_current_memory()
