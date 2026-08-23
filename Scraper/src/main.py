import json
import os
import time
from datetime import datetime, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel, HttpUrl, ValidationError


BASE_URL = "https://books.toscrape.com/"
CACHE_DIR = "Scraper/cache"
OUTPUT_DIR = "Scraper/output"

USER_AGENT = "FlyRankInternship-A9/1.0"
TIMEOUT = 10
DELAY = 0.5

# Keep this False for normal runs.
# Change to True only when testing the deliberately broken URL.
TEST_FAILURE = False


class Book(BaseModel):
    title: str
    product_url: HttpUrl
    price_text: str
    price_gbp: float
    availability_text: str
    rating_text: str
    description: str | None
    source_page: HttpUrl
    fetched_at: str


def get_page(url, cache_file, stats):
    os.makedirs(CACHE_DIR, exist_ok=True)

    # Use cache when available
    if os.path.exists(cache_file):

        with open(cache_file, "r", encoding="utf-8") as file:
            html = file.read()

        stats["cache_hits"] += 1

        print(
            f"CACHE HIT: {cache_file} "
            f"({len(html)} bytes)"
        )

        return html

    headers = {
        "User-Agent": USER_AGENT
    }

    # First request + one retry for timeout/5xx
    for attempt in range(1, 3):

        try:
            time.sleep(DELAY)

            response = requests.get(
                url,
                headers=headers,
                timeout=TIMEOUT
            )

            print(
                f"FETCH: {url} "
                f"status={response.status_code} "
                f"attempt={attempt}"
            )

            # Success
            if response.status_code == 200:

                html = response.content.decode(
                    "utf-8"
                )

                with open(
                    cache_file,
                    "w",
                    encoding="utf-8"
                ) as file:

                    file.write(html)

                stats["pages_fetched"] += 1

                print(
                    f"FETCH: saved {len(html)} bytes"
                )

                return html

            # 403 and 404: never retry
            if response.status_code in (403, 404):

                print(
                    f"FAILED: {url} "
                    f"status={response.status_code} "
                    f"(no retry)"
                )

                return None

            # 5xx: retry once
            if 500 <= response.status_code <= 599:

                if attempt == 1:

                    print(
                        "Server error. "
                        "Retrying once..."
                    )

                    time.sleep(1)
                    continue

                print(
                    f"FAILED: {url} "
                    f"after retry"
                )

                return None

            # Other non-200 status
            print(
                f"FAILED: {url} "
                f"status={response.status_code}"
            )

            return None

        except requests.Timeout:

            print(
                f"TIMEOUT: {url} "
                f"attempt={attempt}"
            )

            if attempt == 1:

                print(
                    "Timeout. Retrying once..."
                )

                time.sleep(1)
                continue

            print(
                f"FAILED: {url} "
                f"after retry"
            )

            return None

        except requests.RequestException as error:

            print(
                f"REQUEST ERROR: {url} "
                f"{error}"
            )

            return None

        except UnicodeDecodeError as error:

            print(
                f"DECODE FAILED: {url} "
                f"{error}"
            )

            return None

    return None


def discover_books(stats):

    current_url = BASE_URL

    book_sources = {}

    catalogue_pages = 0

    while current_url and catalogue_pages < 3:

        catalogue_pages += 1

        source_page = current_url

        cache_file = os.path.join(
            CACHE_DIR,
            f"catalogue-page-{catalogue_pages}.html"
        )

        html = get_page(
            current_url,
            cache_file,
            stats
        )

        if html is None:
            break

        soup = BeautifulSoup(
            html,
            "html.parser"
        )

        for article in soup.select(
            "article.product_pod"
        ):

            link = article.select_one(
                "h3 a"
            )

            if link and link.get("href"):

                absolute_url = urljoin(
                    current_url,
                    link["href"]
                )

                book_sources[absolute_url] = (
                    source_page
                )

        next_link = soup.select_one(
            "li.next a"
        )

        if next_link and next_link.get("href"):

            current_url = urljoin(
                current_url,
                next_link["href"]
            )

        else:

            current_url = None

    print()
    print("DISCOVERY COMPLETE")
    print(
        f"catalogue_pages={catalogue_pages}"
    )
    print(
        f"discovered={len(book_sources)}"
    )
    print(
        f"unique_urls={len(book_sources)}"
    )
    print()

    return book_sources


def normalize_price(price_text):

    if not price_text:
        return None

    cleaned = price_text.strip()

    cleaned = cleaned.replace("Â£", "")
    cleaned = cleaned.replace("£", "")
    cleaned = cleaned.replace(",", "")
    cleaned = cleaned.strip()

    return float(cleaned)


def extract_book(
    book_url,
    source_page,
    index,
    stats
):

    cache_file = os.path.join(
        CACHE_DIR,
        f"book-{index}.html"
    )

    html = get_page(
        book_url,
        cache_file,
        stats
    )

    if html is None:

        stats["failed_pages"] += 1

        return None

    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    title_element = soup.select_one(
        "div.product_main h1"
    )

    title = (
        title_element.get_text(
            strip=True
        )
        if title_element
        else None
    )

    price_element = soup.select_one(
        "div.product_main p.price_color"
    )

    price_text = (
        price_element.get_text(
            strip=True
        )
        if price_element
        else None
    )

    availability_element = soup.select_one(
        "div.product_main p.instock"
    )

    availability_text = (
        availability_element.get_text(
            " ",
            strip=True
        )
        if availability_element
        else None
    )

    rating_element = soup.select_one(
        "div.product_main p.star-rating"
    )

    rating_text = None

    if rating_element:

        classes = rating_element.get(
            "class",
            []
        )

        for class_name in classes:

            if class_name != "star-rating":

                rating_text = class_name
                break

    description_element = soup.select_one(
        "#product_description + p"
    )

    description = (
        description_element.get_text(
            " ",
            strip=True
        )
        if description_element
        else None
    )

    fetched_at = datetime.now(
        timezone.utc
    ).isoformat()

    return {
        "title": title,
        "product_url": book_url,
        "price_text": price_text,
        "availability_text": availability_text,
        "rating_text": rating_text,
        "description": description,
        "source_page": source_page,
        "fetched_at": fetched_at
    }


def extract_all_books(book_sources, stats):

    records = []

    sorted_urls = sorted(
        book_sources.keys()
    )

    # Deliberately add one fake URL
    # ONLY when testing failure handling.
    if TEST_FAILURE:

        sorted_urls.append(
            "https://books.toscrape.com/"
            "catalogue/this-page-does-not-exist_9999/"
            "index.html"
        )

    print(
        "STARTING DETAIL PAGE EXTRACTION"
    )

    print(
        f"detail_pages={len(sorted_urls)}"
    )

    print()

    for index, book_url in enumerate(
        sorted_urls,
        start=1
    ):

        print(
            f"[{index}/{len(sorted_urls)}] "
            f"Extracting book"
        )

        if book_url in book_sources:

            source_page = book_sources[
                book_url
            ]

        else:

            source_page = (
                "https://books.toscrape.com/"
                "catalogue/page-1.html"
            )

        record = extract_book(
            book_url,
            source_page,
            index,
            stats
        )

        if record is not None:

            records.append(record)

    print()
    print(
        "EXTRACTION COMPLETE"
    )

    print(
        f"records_extracted={len(records)}"
    )

    print(
        f"failed_pages={stats['failed_pages']}"
    )

    print()

    return records


def normalize_record(raw_record):

    normalized = raw_record.copy()

    normalized["price_gbp"] = (
        normalize_price(
            raw_record["price_text"]
        )
    )

    return normalized


def validate_records(records):

    valid_records = []
    errors = []

    for record in records:

        try:

            book = Book.model_validate(
                record
            )

            valid_records.append(
                book.model_dump(
                    mode="json"
                )
            )

        except ValidationError as error:

            errors.append({
                "record": record,
                "reason": error.errors()
            })

    return valid_records, errors


def save_json(filename, data):

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    with open(
        path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=2,
            ensure_ascii=False
        )

    print(
        f"Saved: {path}"
    )


def main():

    start_time = time.time()

    start_time_iso = (
        datetime.now(
            timezone.utc
        ).isoformat()
    )

    stats = {
        "pages_fetched": 0,
        "cache_hits": 0,
        "valid_records": 0,
        "invalid_records": 0,
        "failed_pages": 0
    }

    # Stage 2
    book_sources = discover_books(
        stats
    )

    # Stage 3 + Stage 5
    raw_records = extract_all_books(
        book_sources,
        stats
    )

    print(
        f"Raw records: "
        f"{len(raw_records)}"
    )

    # Stage 4
    normalized_records = []

    normalization_errors = []

    for record in raw_records:

        try:

            normalized = normalize_record(
                record
            )

            normalized_records.append(
                normalized
            )

        except (
            ValueError,
            TypeError
        ) as error:

            normalization_errors.append({
                "record": record,
                "reason": str(error)
            })

    valid_records, validation_errors = (
        validate_records(
            normalized_records
        )
    )

    errors = (
        normalization_errors
        + validation_errors
    )

    stats["valid_records"] = len(
        valid_records
    )

    stats["invalid_records"] = len(
        errors
    )

    save_json(
        "books.json",
        valid_records
    )

    save_json(
        "errors.json",
        errors
    )

    # Stage 5 run report
    duration = time.time() - start_time

    run_report = {
        "start_time": start_time_iso,
        "duration_seconds": round(
            duration,
            2
        ),
        "pages_fetched": stats[
            "pages_fetched"
        ],
        "cache_hits": stats[
            "cache_hits"
        ],
        "valid_records": stats[
            "valid_records"
        ],
        "invalid_records": stats[
            "invalid_records"
        ],
        "failed_pages": stats[
            "failed_pages"
        ]
    }

    save_json(
        "run-report.json",
        run_report
    )

    print()
    print(
        "RUN COMPLETE"
    )

    print(
        f"valid_records="
        f"{stats['valid_records']}"
    )

    print(
        f"invalid_records="
        f"{stats['invalid_records']}"
    )

    print(
        f"failed_pages="
        f"{stats['failed_pages']}"
    )

    print(
        f"cache_hits="
        f"{stats['cache_hits']}"
    )

    print(
        f"duration_seconds="
        f"{round(duration, 2)}"
    )


if __name__ == "__main__":
    main()