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


def get_page(url, cache_file):
    os.makedirs(CACHE_DIR, exist_ok=True)

    if os.path.exists(cache_file):
        with open(cache_file, "r", encoding="utf-8") as file:
            html = file.read()

        print(f"CACHE HIT: {cache_file} ({len(html)} bytes)")
        return html

    headers = {
        "User-Agent": USER_AGENT
    }

    try:
        time.sleep(DELAY)

        response = requests.get(
            url,
            headers=headers,
            timeout=TIMEOUT
        )

        print(
            f"FETCH: {url} "
            f"status={response.status_code}"
        )

        if response.status_code != 200:
            print(f"Fetch failed: {url}")
            return None

        html = response.content.decode("utf-8")

        with open(
            cache_file,
            "w",
            encoding="utf-8"
        ) as file:
            file.write(html)

        print(f"FETCH: saved {len(html)} bytes")

        return html

    except requests.RequestException as error:
        print(f"FETCH FAILED: {url} - {error}")
        return None

    except UnicodeDecodeError as error:
        print(f"DECODE FAILED: {url} - {error}")
        return None


def discover_books():
    current_url = BASE_URL

    # Dictionary keeps the exact catalogue page
    # that produced each book URL.
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
            cache_file
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

                # Save the actual catalogue page
                # that contained this book.
                book_sources[absolute_url] = source_page

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
    print(f"catalogue_pages={catalogue_pages}")
    print(f"discovered={len(book_sources)}")
    print(f"unique_urls={len(book_sources)}")
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
    index
):

    cache_file = os.path.join(
        CACHE_DIR,
        f"book-{index}.html"
    )

    html = get_page(
        book_url,
        cache_file
    )

    if html is None:
        return None

    soup = BeautifulSoup(
        html,
        "html.parser"
    )

    title_element = soup.select_one(
        "div.product_main h1"
    )

    title = (
        title_element.get_text(strip=True)
        if title_element
        else None
    )

    price_element = soup.select_one(
        "div.product_main p.price_color"
    )

    price_text = (
        price_element.get_text(strip=True)
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


def extract_all_books(book_sources):

    records = []

    print("STARTING DETAIL PAGE EXTRACTION")
    print(f"detail_pages={len(book_sources)}")
    print()

    for index, book_url in enumerate(
        sorted(book_sources.keys()),
        start=1
    ):

        source_page = book_sources[book_url]

        print(
            f"[{index}/{len(book_sources)}] "
            f"Extracting book"
        )

        record = extract_book(
            book_url,
            source_page,
            index
        )

        if record is not None:
            records.append(record)

    print()
    print("EXTRACTION COMPLETE")
    print(
        f"detail_pages={len(book_sources)}"
    )
    print(
        f"records_extracted={len(records)}"
    )
    print()

    return records


def normalize_record(raw_record):

    normalized = raw_record.copy()

    normalized["price_gbp"] = normalize_price(
        raw_record["price_text"]
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

    print(f"Saved: {path}")


def main():

    # Stage 2
    book_sources = discover_books()

    # Stage 3
    raw_records = extract_all_books(
        book_sources
    )

    print(
        f"Raw records: {len(raw_records)}"
    )

    # Stage 4 - normalize
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

    # Stage 4 - validate
    valid_records, validation_errors = (
        validate_records(
            normalized_records
        )
    )

    errors = (
        normalization_errors
        + validation_errors
    )

    save_json(
        "books.json",
        valid_records
    )

    save_json(
        "errors.json",
        errors
    )

    print()
    print("VALIDATION COMPLETE")
    print(
        f"valid_records={len(valid_records)}"
    )
    print(
        f"invalid_records={len(errors)}"
    )

    if valid_records:

        print()
        print("SAMPLE VALID RECORD")
        print("-------------------")

        print(
            json.dumps(
                valid_records[0],
                indent=2,
                ensure_ascii=False
            )
        )

        print("-------------------")


if __name__ == "__main__":
    main()