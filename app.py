from flask import Flask, render_template, jsonify, request
import asyncio
from assistant import Assistant
from speech_recognition import WaitTimeoutError

app = Flask(__name__)
assistant = Assistant()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/listen', methods=['POST'])
def listen():
    try:
        text = assistant.listen()
        if text:
            return jsonify({"success": True, "text": text})
        return jsonify({"success": False, "error": "No speech detected"})
    except WaitTimeoutError:
        return jsonify({"success": False, "error": "Listening timed out"})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message')
    
    if not user_input:
        return jsonify({"success": False, "error": "No message provided"})
    
    # If get_response is a coroutine, use `asyncio.run()` to execute it synchronously
    response = asyncio.run(assistant.get_response(user_input))
    
    return jsonify({
        "success": True,
        "response": response,
        "history": assistant.get_history()
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify({
        "success": True,
        "history": assistant.get_history()
    })

if __name__ == '__main__':
    app.run(debug=True)
