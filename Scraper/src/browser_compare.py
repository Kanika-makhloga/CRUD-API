import time
import requests
from playwright.sync_api import sync_playwright


URL = "https://quotes.toscrape.com/js/"


def plain_http():
    start = time.perf_counter()

    response = requests.get(
        URL,
        headers={
            "User-Agent": "FlyRankInternship-A9/1.0"
        },
        timeout=10
    )

    elapsed = time.perf_counter() - start

    quote_count = response.text.count(
        'class="quote"'
    )

    return {
        "status": response.status_code,
        "seconds": round(elapsed, 3),
        "quotes_found_in_initial_html": quote_count
    }


def playwright():
    start = time.perf_counter()

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        page = browser.new_page()

        page.goto(
            URL,
            wait_until="networkidle"
        )

        quotes = page.locator(
            ".quote"
        ).count()

        browser.close()

    elapsed = time.perf_counter() - start

    return {
        "seconds": round(elapsed, 3),
        "quotes_after_render": quotes
    }


if __name__ == "__main__":

    http_result = plain_http()
    browser_result = playwright()

    print()
    print("PLAIN HTTP")
    print(http_result)

    print()
    print("PLAYWRIGHT")
    print(browser_result)

    print()
    print("COMPARISON")
    print(
        f"HTTP time: "
        f"{http_result['seconds']} seconds"
    )

    print(
        f"Playwright time: "
        f"{browser_result['seconds']} seconds"
    )

    print(
        "Quotes in initial HTML: "
        f"{http_result['quotes_found_in_initial_html']}"
    )

    print(
        "Quotes after browser rendering: "
        f"{browser_result['quotes_after_render']}"
    )