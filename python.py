import requests
import base64

CLIENT_ID = "aee507d1c7ef48df9ec21b11449e33fe"
CLIENT_SECRET = "ece51973be82422a80391be316ead0e6"
REDIRECT_URI = "http://localhost:8888/callback"
CODE = "AQARq7hVpW20n9cisuoDEbXxzD-fGsPsIdk5ZyZO4h4e6JMDaJU9ewTffaHryXZKVYkhIxGEXB91srwl8V6J7YoeCHw4gcF_qjhj3_hn3JdZjgawDn7fxlViR_bcPu27EWNbqemrQjFfoFBf_vKp4EVfo17Mf4UV3uXBTxIvGzNesZGfcwwAik3eyCJiis3pandP5rOWI0C_YLKAC0DTKMm3UqYDQQ"

# Encode Client ID và Client Secret theo chuẩn Base64
auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()

# Gửi request lấy Access Token
response = requests.post(
    "https://accounts.spotify.com/api/token",
    headers={
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    data={
        "grant_type": "authorization_code",
        "code": CODE,
        "redirect_uri": REDIRECT_URI
    }
)

token_data = response.json()
print(token_data)
