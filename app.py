from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/test', methods=['POST'])
def test():
    data = request.json
    if 'name' in data and len(data['name']) > 10:
        print(data['name']);
        return jsonify({"Result": data['name']})
    else:
        return jsonify({"Error": "Name should be provided and longer than 10 characters."}), 400

if __name__ == '__main__':
    app.run(debug=True)
