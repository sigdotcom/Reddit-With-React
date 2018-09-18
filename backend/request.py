import requests

session = requests.session()

print("Creating account")
response = session.post(
    "http://localhost:5000/signup",
    json={"username": "test", "password": "test"}
)
print(response.content)

print("Logging in")
esponse = session.post(
    "http://localhost:5000/login",
    json={"username": "test", "password": "test"}
)
print(response.content)

print("Attempting relogin")
response = session.post(
    "http://localhost:5000/login",
    json={"username": "test", "password": "test"}
)
print(response.content)
