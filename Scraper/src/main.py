import os
import requests

URL = "https://books.toscrape.com/"
CACHE_FILE = "Scraper/cache/catalogue-page-1.html"

USER_AGENT = "FlyRankInternship-A9/1.0"


def fetch_page():
    os.makedirs("Scraper/cache", exist_ok=True)

    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as file:
            html = file.read()

        print(f"CACHE HIT: {len(html)} bytes")
        return html

    headers = {
        "User-Agent": USER_AGENT
    }

    try:
        response = requests.get(
            URL,
            headers=headers,
            timeout=10
        )

        print(f"FETCH: status={response.status_code}")

        if response.status_code != 200:
            print("Fetch failed: expected status 200")
            return None

        html = response.text

        with open(CACHE_FILE, "w", encoding="utf-8") as file:
            file.write(html)

        print(f"FETCH: saved {len(html)} bytes")
        return html

    except requests.RequestException as error:
        print(f"FETCH FAILED: {error}")
        return None


if __name__ == "__main__":
    fetch_page()