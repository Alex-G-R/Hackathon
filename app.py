from chat_bot import *

with ChatBotManager(ChatBot("Fast", "Johnny")) as bot:
    ChatBotMode.file_analysis_mode(bot)