import os
from .chat_bot import ChatBot
from typing import Optional


class ChatBotMode:
    @staticmethod
    def learning_mode(chat_bot: ChatBot) -> None:
        words = input("Enter new offensive words (word1, word2, ...): ").split(",")
        words = [word.strip() for word in words]
        chat_bot.learn_new_words(words)

    #  learining_mode: uczenie nowych ofensywnych słów

    @staticmethod
    def file_analysis_mode(chat_bot: ChatBot) -> None:
        dir_path = os.path.normpath("comments")
        for f in os.listdir(dir_path):
            file_path = os.path.join(dir_path, f)
            with open(file_path, mode="r") as file:
                file_data = file.read()
                if chat_bot.offensive_words_in(file_data):
                    with open(file_path, mode="w") as verified_file:
                        verified_file.write("true\n"+file_data)
                else:
                    with open(file_path, mode="w") as verified_file:
                        verified_file.write("false\n"+file_data)

    #  file_analysis_mode: zwraca fałsz jeśli plik nie zawiera ofensywnych słów, prawda jeśli zawiera

    @staticmethod
    def reaction_mode(chat_bot: ChatBot, message: str) -> Optional[str]:
        if chat_bot.offensive_words_in(message):
            return chat_bot.generate_answer()
        return None

    #  reaction_mode: zwraca odpowiedź jeśli wiadomość jest obraźliwa
