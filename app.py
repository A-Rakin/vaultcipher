from flask import Flask, render_template, request, jsonify, session
from cryptography.fernet import Fernet
import secrets
import string
import json
import os
from functools import wraps

app = Flask(__name__)
app.secret_key = secrets.token_urlsafe(32)

# Generate or load encryption key
KEY_FILE = 'secret.key'
PASSWORDS_FILE = 'passwords.json'


def generate_key():
    return Fernet.generate_key()


def load_key():
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, 'rb') as key_file:
            return key_file.read()
    else:
        key = generate_key()
        with open(KEY_FILE, 'wb') as key_file:
            key_file.write(key)
        return key



cipher = Fernet(load_key())


def encrypt_password(password):
    return cipher.encrypt(password.encode()).decode()


def decrypt_password(encrypted_password):
    return cipher.decrypt(encrypted_password.encode()).decode()


def load_passwords():
    if os.path.exists(PASSWORDS_FILE):
        with open(PASSWORDS_FILE, 'r') as f:
            return json.load(f)
    return []


def save_passwords(passwords):
    with open(PASSWORDS_FILE, 'w') as f:
        json.dump(passwords, f, indent=4)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/passwords', methods=['GET'])
def get_passwords():
    passwords = load_passwords()
    # Decrypt for display
    for pwd in passwords:
        pwd['password'] = decrypt_password(pwd['password'])
    return jsonify(passwords)


@app.route('/api/passwords', methods=['POST'])
def add_password():
    data = request.json
    passwords = load_passwords()

    new_entry = {
        'id': secrets.token_hex(8),
        'website': data['website'],
        'username': data['username'],
        'password': encrypt_password(data['password'])
    }

    passwords.append(new_entry)
    save_passwords(passwords)

    return jsonify({'success': True, 'id': new_entry['id']})


@app.route('/api/passwords/<id>', methods=['DELETE'])
def delete_password(id):
    passwords = load_passwords()
    passwords = [p for p in passwords if p['id'] != id]
    save_passwords(passwords)
    return jsonify({'success': True})


@app.route('/api/search', methods=['GET'])
def search_passwords():
    query = request.args.get('q', '').lower()
    passwords = load_passwords()

    results = []
    for pwd in passwords:
        if query in pwd['website'].lower():
            decrypted = pwd.copy()
            decrypted['password'] = decrypt_password(pwd['password'])
            results.append(decrypted)

    return jsonify(results)


@app.route('/api/generate-password', methods=['GET'])
def generate_password():
    length = int(request.args.get('length', 16))


    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    # Ensure at least one from each category
    password_chars = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(symbols)
    ]


    all_chars = lowercase + uppercase + digits + symbols
    password_chars.extend(secrets.choice(all_chars) for _ in range(length - 4))


    secrets.SystemRandom().shuffle(password_chars)
    password = ''.join(password_chars)

    return jsonify({'password': password})


if __name__ == '__main__':
    app.run(debug=True)