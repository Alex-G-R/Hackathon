from flask import Flask, jsonify, request
from flaskcors import CORS
from chatbot import *

app = Flask(name)
CORS(app)


@app.route('/test', methods=['POST'])
def test():
    with ChatBotManager(ChatBot("Bot", "John")) as bot:
        data = request.json
        if 'name' in data and len(data['name']) > 10:
            result = bot.offensivewordsin(data["name"])
            return jsonify({"Result": result})
        else:
            return jsonify({"Error": "Name should be provided and longer than 10 characters."}), 400


if __name == '__main':
    app.run(debug=True)