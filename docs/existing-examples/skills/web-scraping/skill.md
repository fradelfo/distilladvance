# Web Scraping Skill

Advanced web scraping and data extraction expertise covering modern scraping frameworks, anti-bot circumvention, scalable architectures, and ethical scraping practices.

## Skill Overview

Expert web scraping knowledge including Scrapy, Playwright, BeautifulSoup, Selenium automation, proxy management, CAPTCHA solving, distributed scraping, and compliance with robots.txt and legal frameworks.

## Core Capabilities

### Modern Scraping Frameworks
- **Scrapy ecosystem** - Advanced spider development, middlewares, item pipelines
- **Playwright/Puppeteer** - JavaScript-heavy sites, SPA scraping, browser automation
- **Requests & BeautifulSoup** - Lightweight scraping, API interaction, HTML parsing
- **Selenium WebDriver** - Complex user interactions, form submissions, dynamic content

### Anti-Detection & Scaling
- **Proxy rotation** - Residential, datacenter, mobile proxy management
- **User agent rotation** - Browser fingerprinting avoidance, header manipulation
- **Rate limiting** - Respectful scraping, distributed delays, backoff strategies
- **CAPTCHA solving** - 2captcha, AntiCaptcha integration, image recognition

### Data Processing & Storage
- **Data cleaning** - Text normalization, duplicate detection, validation
- **Structured extraction** - Schema.org, JSON-LD, microdata parsing
- **Storage backends** - MongoDB, PostgreSQL, Elasticsearch integration
- **Real-time processing** - Kafka, Redis streams, WebSocket handling

### Enterprise Features
- **Distributed scraping** - Kubernetes deployment, worker scaling, job queuing
- **Monitoring & alerting** - Prometheus metrics, failure detection, health checks
- **Legal compliance** - robots.txt parsing, rate limiting, terms of service adherence
- **Data quality** - Validation pipelines, anomaly detection, freshness tracking

## Modern Web Scraping Implementation

### Scrapy Advanced Spider Framework
```python
# Advanced Scrapy spider with modern patterns and anti-detection
import scrapy
import json
import random
import asyncio
from scrapy.http import Request
from scrapy.utils.project import get_project_settings
from scrapy_playwright.page import PageMethod
from scrapy_rotating_proxies.middlewares import BanDetectionPolicy
from itemadapter import ItemAdapter
import pandas as pd
from typing import Dict, List, Optional, Generator
import logging
from datetime import datetime, timedelta
import hashlib
import re

class AdvancedSpider(scrapy.Spider):
    name = 'advanced_spider'

    # Custom settings for this spider
    custom_settings = {
        'CONCURRENT_REQUESTS': 16,
        'CONCURRENT_REQUESTS_PER_DOMAIN': 4,
        'DOWNLOAD_DELAY': 2,
        'RANDOMIZE_DOWNLOAD_DELAY': True,
        'DOWNLOAD_TIMEOUT': 30,
        'RETRY_TIMES': 3,
        'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],

        # Playwright integration
        'DOWNLOAD_HANDLERS': {
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },

        # Middlewares for anti-detection
        'DOWNLOADER_MIDDLEWARES': {
            'scrapy_rotating_proxies.middlewares.RotatingProxyMiddleware': 610,
            'scrapy_rotating_proxies.middlewares.BanDetectionMiddleware': 620,
            'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,
            'scrapy_user_agents.middlewares.RandomUserAgentMiddleware': 400,
            'myproject.middlewares.HeaderRotationMiddleware': 350,
            'myproject.middlewares.CaptchaSolverMiddleware': 650,
        },

        # Item pipelines
        'ITEM_PIPELINES': {
            'myproject.pipelines.ValidationPipeline': 300,
            'myproject.pipelines.DuplicatesPipeline': 400,
            'myproject.pipelines.DataCleaningPipeline': 500,
            'myproject.pipelines.DatabasePipeline': 800,
        },

        # Proxy settings
        'ROTATING_PROXY_LIST_PATH': 'proxy_list.txt',
        'ROTATING_PROXY_BACKOFF_BASE': 300,
        'ROTATING_PROXY_BACKOFF_CAP': 3600,
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_cookies = {}
        self.failed_urls = set()
        self.success_count = 0
        self.error_count = 0

        # Initialize monitoring
        self.start_time = datetime.now()
        self.metrics = {
            'requests_sent': 0,
            'responses_received': 0,
            'items_scraped': 0,
            'errors_encountered': 0
        }

    def start_requests(self) -> Generator[Request, None, None]:
        """Generate initial requests with advanced configuration"""

        start_urls = self.get_start_urls()

        for url in start_urls:
            yield Request(
                url=url,
                callback=self.parse,
                meta={
                    'playwright': True,
                    'playwright_page_methods': [
                        PageMethod('wait_for_selector', 'body'),
                        PageMethod('evaluate', 'window.scrollTo(0, document.body.scrollHeight)'),
                        PageMethod('wait_for_timeout', 2000),
                    ],
                    'playwright_context_kwargs': {
                        'java_script_enabled': True,
                        'ignore_https_errors': True,
                    },
                    'proxy_country': 'US',  # For geo-specific content
                    'captcha_solver': 'auto',
                    'retry_count': 0,
                    'priority': 100,  # High priority for start URLs
                },
                headers=self.get_random_headers(),
                dont_filter=False
            )

    def parse(self, response):
        """Main parsing method with error handling and data extraction"""

        # Update metrics
        self.metrics['responses_received'] += 1

        try:
            # Check for anti-bot measures
            if self.is_blocked(response):
                self.logger.warning(f"Blocked response detected for {response.url}")
                yield self.handle_blocked_response(response)
                return

            # Extract structured data using multiple strategies
            items = []

            # Strategy 1: JSON-LD structured data
            json_ld_data = self.extract_json_ld(response)
            if json_ld_data:
                items.extend(self.parse_json_ld(json_ld_data))

            # Strategy 2: Microdata extraction
            microdata = self.extract_microdata(response)
            if microdata:
                items.extend(self.parse_microdata(microdata))

            # Strategy 3: CSS selector-based extraction
            css_items = self.extract_with_css(response)
            items.extend(css_items)

            # Strategy 4: XPath-based extraction for complex structures
            xpath_items = self.extract_with_xpath(response)
            items.extend(xpath_items)

            # Yield extracted items
            for item in items:
                self.metrics['items_scraped'] += 1
                yield self.create_item(item, response)

            # Follow pagination and related links
            yield from self.follow_links(response)

        except Exception as e:
            self.logger.error(f"Error parsing {response.url}: {str(e)}")
            self.metrics['errors_encountered'] += 1
            yield self.create_error_item(response, str(e))

    def extract_json_ld(self, response) -> List[Dict]:
        """Extract JSON-LD structured data"""
        json_scripts = response.css('script[type="application/ld+json"]::text').getall()

        data = []
        for script in json_scripts:
            try:
                parsed = json.loads(script.strip())
                if isinstance(parsed, list):
                    data.extend(parsed)
                else:
                    data.append(parsed)
            except json.JSONDecodeError:
                continue

        return data

    def extract_microdata(self, response) -> List[Dict]:
        """Extract microdata using itemscope and itemprop attributes"""
        items = []

        # Find all elements with itemscope
        itemscope_elements = response.css('[itemscope]')

        for element in itemscope_elements:
            item_data = {}
            item_type = element.css('::attr(itemtype)').get()

            if item_type:
                item_data['@type'] = item_type.split('/')[-1]

            # Extract properties
            props = element.css('[itemprop]')
            for prop in props:
                prop_name = prop.css('::attr(itemprop)').get()

                # Get content based on element type
                if prop.root.tag in ['meta']:
                    content = prop.css('::attr(content)').get()
                elif prop.root.tag in ['img']:
                    content = prop.css('::attr(src)').get()
                elif prop.root.tag in ['a']:
                    content = prop.css('::attr(href)').get()
                else:
                    content = prop.css('::text').get()

                if prop_name and content:
                    item_data[prop_name] = content.strip()

            if item_data:
                items.append(item_data)

        return items

    def extract_with_css(self, response) -> List[Dict]:
        """Extract data using CSS selectors"""
        items = []

        # Define extraction rules based on common patterns
        extraction_rules = {
            'articles': {
                'selector': 'article, .article, [role="article"]',
                'fields': {
                    'title': 'h1, h2, .title, .headline ::text',
                    'content': '.content, .body, p ::text',
                    'author': '.author, .byline ::text',
                    'date': 'time ::attr(datetime), .date ::text',
                    'url': 'a ::attr(href)',
                }
            },
            'products': {
                'selector': '.product, [data-testid="product"]',
                'fields': {
                    'name': '.product-name, .title, h1 ::text',
                    'price': '.price, .amount ::text',
                    'description': '.description, .summary ::text',
                    'image': 'img ::attr(src)',
                    'rating': '.rating, .stars ::text',
                }
            },
            'reviews': {
                'selector': '.review, .comment',
                'fields': {
                    'text': '.review-text, .comment-body ::text',
                    'rating': '.rating, .score ::text',
                    'author': '.reviewer, .author ::text',
                    'date': '.review-date, time ::text',
                }
            }
        }

        for item_type, config in extraction_rules.items():
            elements = response.css(config['selector'])

            for element in elements:
                item_data = {'type': item_type}

                for field, selector in config['fields'].items():
                    values = element.css(selector).getall()
                    if values:
                        # Clean and join multiple values
                        cleaned_values = [self.clean_text(v) for v in values if v.strip()]
                        if cleaned_values:
                            item_data[field] = cleaned_values[0] if len(cleaned_values) == 1 else cleaned_values

                if len(item_data) > 1:  # More than just the type field
                    items.append(item_data)

        return items

    def extract_with_xpath(self, response) -> List[Dict]:
        """Extract data using XPath for complex structures"""
        items = []

        # Extract table data
        tables = response.xpath('//table[contains(@class, "data") or contains(@class, "results")]')
        for table in tables:
            headers = table.xpath('.//th/text()').getall()
            if not headers:
                headers = table.xpath('.//tr[1]/td/text()').getall()

            rows = table.xpath('.//tr[position()>1]')
            for row in rows:
                cells = row.xpath('.//td//text()').getall()
                if len(cells) >= len(headers):
                    item_data = dict(zip(headers, cells[:len(headers)]))
                    item_data['type'] = 'table_row'
                    items.append(item_data)

        # Extract list items with complex structure
        complex_lists = response.xpath('//ul[@class or @id]//li[count(*)>2]')
        for li in complex_lists:
            item_data = {'type': 'list_item'}

            # Extract nested data
            texts = li.xpath('.//text()[normalize-space()]').getall()
            links = li.xpath('.//a/@href').getall()
            images = li.xpath('.//img/@src').getall()

            if texts:
                item_data['text'] = [self.clean_text(t) for t in texts]
            if links:
                item_data['links'] = links
            if images:
                item_data['images'] = images

            if len(item_data) > 1:
                items.append(item_data)

        return items

    def follow_links(self, response) -> Generator[Request, None, None]:
        """Follow pagination and related links intelligently"""

        # Pagination patterns
        pagination_selectors = [
            'a[aria-label*="next"]',
            'a[rel="next"]',
            '.pagination .next a',
            '.pager .next a',
            'a:contains("Next")',
            'a:contains(">")',
        ]

        for selector in pagination_selectors:
            next_links = response.css(selector + '::attr(href)').getall()
            for link in next_links:
                if link and not self.is_duplicate_url(link):
                    yield Request(
                        url=response.urljoin(link),
                        callback=self.parse,
                        meta={
                            'playwright': True,
                            'priority': 50,  # Lower priority for pagination
                        },
                        headers=self.get_random_headers()
                    )
                    break  # Only follow one pagination link

        # Category/section links
        category_selectors = [
            '.category a',
            '.section a',
            '.menu a',
            'nav a',
        ]

        for selector in category_selectors:
            category_links = response.css(selector + '::attr(href)').getall()
            for link in category_links[:10]:  # Limit to avoid too many requests
                if link and not self.is_duplicate_url(link):
                    yield Request(
                        url=response.urljoin(link),
                        callback=self.parse,
                        meta={
                            'playwright': True,
                            'priority': 25,  # Lower priority for categories
                        },
                        headers=self.get_random_headers()
                    )

    def is_blocked(self, response) -> bool:
        """Detect if the response indicates blocking or anti-bot measures"""

        # Check status codes
        if response.status in [403, 429, 503]:
            return True

        # Check for CAPTCHA indicators
        captcha_indicators = [
            'captcha', 'recaptcha', 'hcaptcha',
            'please verify', 'security check',
            'unusual traffic', 'robot'
        ]

        body_text = response.text.lower()
        for indicator in captcha_indicators:
            if indicator in body_text:
                return True

        # Check for redirect to blocking pages
        if any(term in response.url.lower() for term in ['blocked', 'error', 'denied']):
            return True

        # Check content length (too short might indicate blocking)
        if len(response.text) < 500:
            return True

        return False

    def handle_blocked_response(self, response) -> Request:
        """Handle blocked responses with appropriate retry strategies"""

        retry_count = response.meta.get('retry_count', 0)

        if retry_count < 3:
            # Increase delay and change proxy
            return Request(
                url=response.url,
                callback=self.parse,
                meta={
                    **response.meta,
                    'retry_count': retry_count + 1,
                    'download_delay': (retry_count + 1) * 10,  # Exponential backoff
                    'proxy_country': random.choice(['US', 'GB', 'CA', 'AU']),
                    'captcha_solver': 'manual',  # Upgrade to manual solving
                },
                headers=self.get_random_headers(),
                dont_filter=True
            )
        else:
            # Give up and log the failure
            self.failed_urls.add(response.url)
            self.logger.error(f"Failed to scrape {response.url} after {retry_count} retries")
            return None

    def create_item(self, data: Dict, response) -> Dict:
        """Create a standardized item from extracted data"""

        item = {
            'url': response.url,
            'scraped_at': datetime.now().isoformat(),
            'spider_name': self.name,
            'data_hash': self.generate_hash(data),
            **data
        }

        return item

    def create_error_item(self, response, error_message: str) -> Dict:
        """Create an error item for tracking failures"""

        return {
            'type': 'error',
            'url': response.url,
            'error': error_message,
            'status_code': response.status,
            'scraped_at': datetime.now().isoformat(),
            'spider_name': self.name,
        }

    def get_random_headers(self) -> Dict[str, str]:
        """Generate random headers to avoid detection"""

        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': random.choice([
                'en-US,en;q=0.9',
                'en-GB,en;q=0.9',
                'en-CA,en;q=0.9',
            ]),
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': random.choice(['no-cache', 'max-age=0']),
        }

        return headers

    def clean_text(self, text: str) -> str:
        """Clean and normalize text content"""

        if not text:
            return ""

        # Remove extra whitespace and normalize
        cleaned = ' '.join(text.split())

        # Remove common artifacts
        cleaned = re.sub(r'[\r\n\t]+', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned)

        return cleaned.strip()

    def generate_hash(self, data: Dict) -> str:
        """Generate a hash for duplicate detection"""

        # Create a string representation of the data for hashing
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()

    def is_duplicate_url(self, url: str) -> bool:
        """Check if URL has already been processed"""

        # Simple duplicate detection (in production, use Redis or database)
        url_hash = hashlib.md5(url.encode()).hexdigest()
        return url_hash in getattr(self, '_seen_urls', set())

    def get_start_urls(self) -> List[str]:
        """Get initial URLs to scrape"""

        # This would typically come from settings, database, or API
        return getattr(self, 'start_urls', [])

    def closed(self, reason):
        """Spider closing callback for cleanup and reporting"""

        end_time = datetime.now()
        duration = end_time - self.start_time

        # Log final statistics
        self.logger.info(f"""
        Spider {self.name} finished. Stats:
        - Duration: {duration}
        - Items scraped: {self.metrics['items_scraped']}
        - Requests sent: {self.metrics['requests_sent']}
        - Responses received: {self.metrics['responses_received']}
        - Errors encountered: {self.metrics['errors_encountered']}
        - Failed URLs: {len(self.failed_urls)}
        - Success rate: {(self.success_count / (self.success_count + self.error_count)) * 100:.2f}%
        """)

# Custom middlewares for advanced functionality
class HeaderRotationMiddleware:
    """Rotate headers to avoid detection"""

    def process_request(self, request, spider):
        # Add randomized headers
        request.headers.update(spider.get_random_headers())

class CaptchaSolverMiddleware:
    """Solve CAPTCHAs automatically"""

    def __init__(self):
        self.solver_api_key = "your_2captcha_api_key"

    def process_response(self, request, response, spider):
        if spider.is_blocked(response) and 'captcha' in response.text.lower():
            # Implement CAPTCHA solving logic
            # This is a simplified example
            spider.logger.info(f"CAPTCHA detected for {response.url}, attempting to solve...")
            # In real implementation, integrate with 2captcha or similar service

        return response

# Custom pipelines for data processing
class ValidationPipeline:
    """Validate item data"""

    def process_item(self, item, spider):
        # Implement validation logic
        required_fields = ['url', 'scraped_at']

        for field in required_fields:
            if field not in item:
                raise scrapy.exceptions.DropItem(f"Missing required field: {field}")

        return item

class DuplicatesPipeline:
    """Remove duplicate items"""

    def __init__(self):
        self.seen_hashes = set()

    def process_item(self, item, spider):
        data_hash = item.get('data_hash')

        if data_hash in self.seen_hashes:
            raise scrapy.exceptions.DropItem(f"Duplicate item found: {item['url']}")

        self.seen_hashes.add(data_hash)
        return item

class DataCleaningPipeline:
    """Clean and normalize item data"""

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        # Clean text fields
        for field_name, field_value in adapter.items():
            if isinstance(field_value, str):
                adapter[field_name] = spider.clean_text(field_value)
            elif isinstance(field_value, list):
                adapter[field_name] = [spider.clean_text(v) if isinstance(v, str) else v for v in field_value]

        return item

class DatabasePipeline:
    """Store items in database"""

    def __init__(self, mongodb_server, mongodb_port, mongodb_db):
        self.mongodb_server = mongodb_server
        self.mongodb_port = mongodb_port
        self.mongodb_db = mongodb_db

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            mongodb_server=crawler.settings.get("MONGODB_SERVER"),
            mongodb_port=crawler.settings.get("MONGODB_PORT"),
            mongodb_db=crawler.settings.get("MONGODB_DB"),
        )

    def open_spider(self, spider):
        from pymongo import MongoClient
        self.client = MongoClient(self.mongodb_server, self.mongodb_port)
        self.db = self.client[self.mongodb_db]

    def close_spider(self, spider):
        self.client.close()

    def process_item(self, item, spider):
        collection_name = f"{spider.name}_items"
        self.db[collection_name].insert_one(dict(item))
        return item
```

### Playwright Browser Automation
```python
# Advanced Playwright scraping with anti-detection
import asyncio
from playwright.async_api import async_playwright, BrowserContext, Page
import random
import json
from typing import Dict, List, Optional
import logging
from datetime import datetime
import aiohttp
import aiofiles

class PlaywrightScraper:
    def __init__(self, headless: bool = True, proxy_list: Optional[List[str]] = None):
        self.headless = headless
        self.proxy_list = proxy_list or []
        self.browser = None
        self.context = None
        self.logger = logging.getLogger(__name__)

        # Anti-detection settings
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]

        self.viewports = [
            {'width': 1920, 'height': 1080},
            {'width': 1366, 'height': 768},
            {'width': 1440, 'height': 900},
            {'width': 1536, 'height': 864},
        ]

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def start(self):
        """Initialize browser and context"""
        self.playwright = await async_playwright().start()

        # Launch browser with stealth settings
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-default-apps',
                '--disable-translate',
                '--disable-device-discovery-notifications',
                '--disable-component-extensions-with-background-pages',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-client-side-phishing-detection',
                '--disable-sync',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-field-trial-config',
                '--no-default-browser-check',
                '--mute-audio',
            ]
        )

        await self.create_context()

    async def create_context(self):
        """Create browser context with random settings"""

        proxy = None
        if self.proxy_list:
            proxy_url = random.choice(self.proxy_list)
            proxy = {'server': proxy_url}

        user_agent = random.choice(self.user_agents)
        viewport = random.choice(self.viewports)

        self.context = await self.browser.new_context(
            user_agent=user_agent,
            viewport=viewport,
            proxy=proxy,
            java_script_enabled=True,
            ignore_https_errors=True,
            extra_http_headers={
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="99", "Google Chrome";v="120", "Chromium";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            }
        )

        # Add stealth scripts
        await self.context.add_init_script(self.get_stealth_script())

    async def scrape_page(self, url: str, wait_for: str = 'networkidle') -> Dict:
        """Scrape a single page with comprehensive data extraction"""

        page = await self.context.new_page()

        try:
            # Navigate with random delay
            await asyncio.sleep(random.uniform(1, 3))

            response = await page.goto(
                url,
                wait_until=wait_for,
                timeout=30000
            )

            # Check if page loaded successfully
            if not response or response.status >= 400:
                raise Exception(f"Failed to load page: {response.status if response else 'No response'}")

            # Random human-like behavior
            await self.simulate_human_behavior(page)

            # Extract data using multiple strategies
            page_data = {
                'url': url,
                'title': await page.title(),
                'html': await page.content(),
                'text_content': await page.evaluate('document.body.innerText'),
                'links': await self.extract_links(page),
                'images': await self.extract_images(page),
                'json_ld': await self.extract_json_ld_data(page),
                'meta_tags': await self.extract_meta_tags(page),
                'forms': await self.extract_forms(page),
                'tables': await self.extract_tables(page),
                'performance': await self.get_performance_metrics(page),
                'screenshot': None,  # Optional screenshot
                'scraped_at': datetime.now().isoformat(),
            }

            # Take screenshot if needed
            if self.should_take_screenshot(page_data):
                screenshot_path = f"screenshots/{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(url) % 10000}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                page_data['screenshot'] = screenshot_path

            return page_data

        except Exception as e:
            self.logger.error(f"Error scraping {url}: {str(e)}")
            return {
                'url': url,
                'error': str(e),
                'scraped_at': datetime.now().isoformat(),
            }
        finally:
            await page.close()

    async def simulate_human_behavior(self, page: Page):
        """Simulate human-like browsing behavior"""

        # Random scrolling
        for _ in range(random.randint(1, 3)):
            await page.evaluate(f'window.scrollBy(0, {random.randint(200, 800)})')
            await asyncio.sleep(random.uniform(0.5, 1.5))

        # Random mouse movements
        viewport_size = page.viewport_size
        for _ in range(random.randint(1, 3)):
            x = random.randint(0, viewport_size['width'])
            y = random.randint(0, viewport_size['height'])
            await page.mouse.move(x, y)
            await asyncio.sleep(random.uniform(0.1, 0.5))

    async def extract_links(self, page: Page) -> List[Dict]:
        """Extract all links from the page"""

        return await page.evaluate('''
            Array.from(document.querySelectorAll('a[href]')).map(a => ({
                href: a.href,
                text: a.textContent.trim(),
                title: a.title || '',
                rel: a.rel || '',
                target: a.target || ''
            }))
        ''')

    async def extract_images(self, page: Page) -> List[Dict]:
        """Extract all images from the page"""

        return await page.evaluate('''
            Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                alt: img.alt || '',
                title: img.title || '',
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
            }))
        ''')

    async def extract_json_ld_data(self, page: Page) -> List[Dict]:
        """Extract JSON-LD structured data"""

        json_ld_scripts = await page.evaluate('''
            Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
                .map(script => script.textContent)
        ''')

        parsed_data = []
        for script in json_ld_scripts:
            try:
                data = json.loads(script)
                if isinstance(data, list):
                    parsed_data.extend(data)
                else:
                    parsed_data.append(data)
            except json.JSONDecodeError:
                continue

        return parsed_data

    async def extract_meta_tags(self, page: Page) -> Dict:
        """Extract meta tags"""

        return await page.evaluate('''
            {
                title: document.querySelector('title')?.textContent || '',
                description: document.querySelector('meta[name="description"]')?.content || '',
                keywords: document.querySelector('meta[name="keywords"]')?.content || '',
                author: document.querySelector('meta[name="author"]')?.content || '',
                viewport: document.querySelector('meta[name="viewport"]')?.content || '',
                ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
                ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
                ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
                twitterCard: document.querySelector('meta[name="twitter:card"]')?.content || '',
                canonical: document.querySelector('link[rel="canonical"]')?.href || ''
            }
        ''')

    async def extract_forms(self, page: Page) -> List[Dict]:
        """Extract form information"""

        return await page.evaluate('''
            Array.from(document.querySelectorAll('form')).map(form => ({
                action: form.action,
                method: form.method,
                id: form.id,
                class: form.className,
                inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
                    type: input.type || input.tagName.toLowerCase(),
                    name: input.name,
                    id: input.id,
                    placeholder: input.placeholder || '',
                    required: input.required,
                    value: input.value
                }))
            }))
        ''')

    async def extract_tables(self, page: Page) -> List[Dict]:
        """Extract table data"""

        return await page.evaluate('''
            Array.from(document.querySelectorAll('table')).map(table => {
                const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
                const rows = Array.from(table.querySelectorAll('tbody tr, tr:not(:first-child)')).map(tr =>
                    Array.from(tr.querySelectorAll('td, th')).map(cell => cell.textContent.trim())
                );

                return {
                    headers: headers,
                    rows: rows,
                    rowCount: rows.length,
                    columnCount: headers.length || (rows[0] ? rows[0].length : 0)
                };
            })
        ''')

    async def get_performance_metrics(self, page: Page) -> Dict:
        """Get page performance metrics"""

        return await page.evaluate('''
            const navigation = performance.getEntriesByType('navigation')[0];
            const paintMetrics = performance.getEntriesByType('paint');

            ({
                loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
                domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                firstPaint: paintMetrics.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paintMetrics.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                resourceCount: performance.getEntriesByType('resource').length
            })
        ''')

    def should_take_screenshot(self, page_data: Dict) -> bool:
        """Determine if a screenshot should be taken"""

        # Take screenshot for errors or specific content types
        return (
            'error' in page_data or
            'captcha' in page_data.get('text_content', '').lower() or
            len(page_data.get('forms', [])) > 0
        )

    def get_stealth_script(self) -> str:
        """Get JavaScript to make browser appear more human-like"""

        return '''
            // Remove webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });

            // Mock languages and plugins
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });

            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Mock chrome object
            window.chrome = {
                runtime: {},
            };

            // Mock permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );

            // Add random properties
            window.outerHeight = window.screen.height;
            window.outerWidth = window.screen.width;
        '''

    async def bulk_scrape(self, urls: List[str], max_concurrent: int = 5) -> List[Dict]:
        """Scrape multiple URLs concurrently"""

        semaphore = asyncio.Semaphore(max_concurrent)

        async def scrape_with_semaphore(url: str) -> Dict:
            async with semaphore:
                return await self.scrape_page(url)

        tasks = [scrape_with_semaphore(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    'url': urls[i],
                    'error': str(result),
                    'scraped_at': datetime.now().isoformat(),
                })
            else:
                processed_results.append(result)

        return processed_results

    async def close(self):
        """Clean up resources"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()

# Usage example
async def main():
    urls = [
        'https://example.com',
        'https://httpbin.org/html',
        'https://quotes.toscrape.com/',
    ]

    proxy_list = [
        'http://proxy1:8080',
        'http://proxy2:8080',
    ]

    async with PlaywrightScraper(headless=True, proxy_list=proxy_list) as scraper:
        results = await scraper.bulk_scrape(urls, max_concurrent=3)

        for result in results:
            print(f"Scraped {result.get('url')}: {len(result.get('html', ''))} chars")

if __name__ == '__main__':
    asyncio.run(main())
```

## Skill Activation Triggers

This skill automatically activates when:
- Web scraping projects are needed
- Data extraction from websites is required
- Automated web testing is requested
- Large-scale data collection is needed
- API alternatives through scraping are required
- Competitive analysis automation is requested

This comprehensive web scraping skill provides expert-level capabilities for extracting data from modern websites using advanced anti-detection techniques and scalable architectures.