# The Polite Scraper

A small Python scraping pipeline built for FlyRank Internship Week 5,
Assignment A9 — The Polite Scraper.

The project collects 60 books from the first three catalogue pages of
Books to Scrape, extracts structured information from each detail page,
normalizes the price, validates every record with Pydantic, handles a
broken page without crashing, caches downloaded HTML, and produces a
run report.

---

## Target Classification

### Target

https://books.toscrape.com/

Books to Scrape is a public practice website designed for learning and
practicing web scraping.

### Scope

This scraper intentionally processes only:

- Catalogue page 1
- Catalogue page 2
- Catalogue page 3
- The 60 book detail pages discovered from those three pages

The scraper does not crawl the rest of the catalogue.

### Robots Check

I checked:

https://books.toscrape.com/robots.txt

The URL returned a 404 response and did not provide a robots.txt file.

A missing robots.txt file was not treated as permission to scrape arbitrary
websites. This project remains limited to the Books to Scrape practice
sandbox.

---

## Language and Tools

The implementation uses Python.

Main libraries:

- requests
- BeautifulSoup
- Pydantic
- Playwright for the separate browser-cost comparison

Python version used during development:

Python 3.13

---

## Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd CRUD-API