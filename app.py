from flask import Flask, jsonify, request
from flask_cors import CORS
from chat_bot import *

app = Flask(__name__)
CORS(app)


@app.route('/test', methods=['POST'])
def test():
    with ChatBotManager(ChatBot("Bot", "John")) as bot:
        data = request.json
        if 'name' in data and len(data['name']) > 10:
            result = bot.offensive_words_in(data["name"])
            return jsonify({"Result": result})
        else:
            return jsonify({"Error": "Name should be provided and longer than 10 characters."}), 400


if __name__ == '__main__':
    app.run(debug=True)
