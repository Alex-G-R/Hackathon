import os
import re
import random
import requests
import numpy as np
from datetime import datetime
from bs4 import BeautifulSoup


class ChatBot:
    def __init__(self, first_name: str, last_name) -> None:
        self.fist_name = first_name
        self.last_name = last_name

        self.__memory_path = os.path.normpath("chat_bot/memory")
        if os.path.exists(self.__memory_path):
            with open(self.__memory_path, mode="r", encoding='latin-1') as file:
                decoded_lines = [line.strip().encode('latin1').decode('utf-8') for line in file]
                self.current_memory = np.array(decoded_lines)
        else:
            self.current_memory = np.array(self.__get_baics_words())

    @staticmethod
    def __get_baics_words() -> list[str]:
        response = requests.get(
            "https://pl.m.wiktionary.org/wiki/Indeks:Polski_-_Wulgaryzmy?fbclid=IwAR0csCaU9fHrdc8-VtM3J"
            "DmzhNbvqoR0x6didnpl2Sx3hR9feJFWUMkrgMs"
        )
        response.raise_for_status()
        parsed_page = BeautifulSoup(response.text, features="html.parser")

        def is_word_on_page(tag) -> bool:
            return (
                tag.name == "a"
                and tag.has_attr("title")
                and tag.has_attr("href")
                and not tag.has_attr("class")
            )

        return [var.get_text() for var in parsed_page.find_all(is_word_on_page)]

    #  __get_baics_words: pobiera z wikipedi podstawowe wulgaryzmy

    def learn_new_words(self, words: list[str]) -> None:
        if self.current_memory is not None:
            for word in words:
                if word not in self.current_memory:
                    self.current_memory = np.append(self.current_memory, word)
        else:
            self.current_memory = np.array(words)

    #  learn_new_word: nauka nowych słów

    def forget_old_words(self, words: list[str]) -> None:
        if self.current_memory is not None:
            for word in words:
                if word in self.current_memory:
                    index = np.where(self.current_memory == word)
                    self.current_memory = np.delete(self.current_memory, index)

    #  forget_old_words: usuwanie z pamięci bota słów

    def offensive_words_in(self, message: str) -> bool:
        x = "".join([f"{word}|" for word in self.current_memory])
        pattern = re.compile(x, flags=re.IGNORECASE)
        message = [word.strip() for word in message.split(" ")]
        for word in message:
            if pattern.fullmatch(word) is not None:
                return True
        return False

    #  offensive_words_in: sprawdza czy w wyrazie znajdują się ofensywne słowa

    def save_current_memory(self) -> None:
        with open(self.__memory_path, mode="w") as file:
            for word in self.current_memory:
                file.write(f"{word}\n")

    #  save_current_memory: zapis pamięci bota

    def generate_answer(self) -> str:
        current_datetime = datetime.now()
        if 5 <= current_datetime.hour < 12:
            special_welcome = "Dobry poranek!"
        elif 12 <= current_datetime.hour < 17:
            special_welcome = "Dobre popołudnie!"
        else:
            special_welcome = "Dobry wieczór!"
        welcome = random.choice(
            ["Hej!", "Cześć!", "Witam!", special_welcome, "Dzień dobry!"]
        )
        reaction = random.choice(
            [
                "Uważam, że twoja wypowiedź jest nieodpowiednia.",
                "Nie toleruję takich komentarzy.",
                "Słowa mają moc, używaj ich mądrze.",
                "Mam nadzieję, że zastanowisz się nad swoją retoryką.",
                "Twój komentarz jest obraźliwy i nie na miejscu.",
                "To nie jest sposób na konstruktywną rozmowę.",
                "Takie komentarze nie przynoszą niczego dobrego.",
                "Jestem zawiedziony twoją wypowiedzią.",
                "Brak empatii w twojej wypowiedzi jest zauważalny.",
            ]
        )
        return f"{self.fist_name} {self.last_name}: {welcome} {reaction}"

    #  generate_answer: tworzenie komentarza na ofensywne słowa
