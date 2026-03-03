import requests

# Replace with your actual homepage URL
url = "https://yourdomain.com/"

# Force no cache headers
headers = {
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
}

try:
    response = requests.get(url, headers=headers, timeout=10)

    print("Status Code:", response.status_code)
    print("----- PAGE CONTENT START -----")
    print(response.text)
    print("----- PAGE CONTENT END -----")

except requests.exceptions.RequestException as e:
    print("Error fetching page:", e)
