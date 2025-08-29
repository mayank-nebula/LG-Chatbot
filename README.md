"""
WHO Publication Downloader
Downloads the latest N publications (PDFs) from WHO website
Improved version with JSON metadata, logging, and better error handling
"""

import re
import json
import logging
import requests
import argparse
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin
from typing import List, Dict, Optional

DOWNLOAD_DIR = "who_downloads"
BASE_URL = "https://www.who.int/api/news/publications"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


class WHOPublicationDownloader:
    def __init__(self, download_dir: str = DOWNLOAD_DIR):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)

        # Setup logging
        self.setup_logging()

        # Metadata tracking
        self.session_metadata = {
            "session_start": datetime.now().isoformat(),
            "total_requested": 0,
            "total_found": 0,
            "total_downloaded": 0,
            "total_failed": 0,
            "publications": [],
            "errors": [],
            "statistics": {},
        }

        # Load existing metadata if available
        self.load_existing_metadata()

    def setup_logging(self):
        """Setup logging configuration with proper Unicode handling"""
        log_file = self.download_dir / "downloader.log"

        # Clear any existing handlers
        for handler in logging.root.handlers[:]:
            logging.root.removeHandler(handler)

        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(log_file, encoding="utf-8"),
                logging.StreamHandler(),
            ],
        )
        self.logger = logging.getLogger(__name__)

        # Set console handler encoding for Windows
        for handler in self.logger.handlers:
            if (
                isinstance(handler, logging.StreamHandler)
                and handler.stream.name == "<stderr>"
            ):
                handler.stream.reconfigure(encoding="utf-8", errors="replace")

    def load_existing_metadata(self):
        """Load existing metadata from JSON file"""
        metadata_file = self.download_dir / "metadata.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                    # Keep track of previously downloaded publications
                    self.existing_publications = {
                        pub.get("id"): pub
                        for pub in existing_data.get("publications", [])
                    }
                    self.logger.info(
                        f"Loaded {len(self.existing_publications)} existing publication records"
                    )
            except Exception as e:
                self.logger.warning(f"Could not load existing metadata: {e}")
                self.existing_publications = {}
        else:
            self.existing_publications = {}

    def sanitize_filename(self, text: str) -> str:
        """Make filename safe and remove problematic Unicode characters."""
        if not text:
            return "untitled"

        # Remove or replace problematic Unicode characters
        text = re.sub(
            r"[\u200e\u200f\u202a-\u202e]", "", text
        )  # Remove directional marks
        text = re.sub(r"[^\w\s\-\.\(\)]", "_", text)  # Keep only safe characters
        text = re.sub(r"\s+", "_", text.strip())  # Replace spaces with underscores
        text = text[:200] if len(text) > 200 else text  # Limit length

        return text.strip("_") or "untitled"

    def fetch_latest_publications(self, n: int = 100) -> List[Dict]:
        """Fetch metadata of latest publications from WHO API."""
        self.logger.info(f"Fetching latest {n} publications from WHO API...")

        url = (
            f"{BASE_URL}"
            f"?$orderby=PublicationDateAndTime desc"
            f"&$top={n}"
            f"&$select=Id,Title,PublicationDateAndTime,ItemDefaultUrl,Summary"
        )

        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            publications = data.get("value", [])

            self.session_metadata["total_requested"] = n
            self.session_metadata["total_found"] = len(publications)

            self.logger.info(f"Successfully fetched {len(publications)} publications")
            return publications

        except Exception as e:
            error_msg = f"Failed to fetch publications: {e}"
            self.logger.error(error_msg)
            self.session_metadata["errors"].append(
                {
                    "timestamp": datetime.now().isoformat(),
                    "type": "api_fetch_error",
                    "message": error_msg,
                }
            )
            return []

    def extract_pdf_link(self, html_text: str, base_url: str) -> Optional[str]:
        """Extract PDF download link from publication page."""
        try:
            soup = BeautifulSoup(html_text, "html.parser")

            # 1) Look for WHO "Download" button with class="download-url"
            link = soup.find("a", class_="download-url")
            if link and link.get("href"):
                return urljoin(base_url, link["href"])

            # 2) Look for any download button or link
            download_buttons = soup.find_all(
                "a", class_=re.compile(r"download", re.IGNORECASE)
            )
            for button in download_buttons:
                href = button.get("href")
                if href and ".pdf" in href.lower():
                    return urljoin(base_url, href)

            # 3) Fallback: any anchor with .pdf
            for a in soup.find_all("a", href=True):
                if ".pdf" in a["href"].lower():
                    return urljoin(base_url, a["href"])

            return None

        except Exception as e:
            self.logger.error(f"Error extracting PDF link: {e}")
            return None

    def clean_text_for_logging(self, text: str) -> str:
        """Clean text for safe logging by removing problematic Unicode characters"""
        if not text:
            return ""

        # Remove directional marks and other problematic Unicode characters
        text = re.sub(r"[\u200e\u200f\u202a-\u202e\u2066-\u2069]", "", text)
        # Replace other non-printable characters
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)

        return text

    def get_file_info(self, pdf_url: str) -> Dict:
        """Get file information without downloading"""
        try:
            response = requests.head(pdf_url, headers=HEADERS, timeout=30)
            return {
                "content_length": response.headers.get("Content-Length"),
                "content_type": response.headers.get("Content-Type"),
                "last_modified": response.headers.get("Last-Modified"),
                "status_code": response.status_code,
            }
        except Exception:
            return {}

    def download_pdf(self, pdf_url: str, filepath: Path, title: str) -> Dict:
        """Download PDF file and return download info"""
        download_info = {
            "attempted": True,
            "success": False,
            "file_size": 0,
            "download_time": None,
            "error": None,
        }

        try:
            start_time = datetime.now()

            self.logger.info(f"Downloading: {pdf_url}")
            response = requests.get(pdf_url, headers=HEADERS, timeout=60, stream=True)
            response.raise_for_status()

            # Download with progress tracking
            total_size = 0
            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        total_size += len(chunk)

            end_time = datetime.now()
            download_duration = (end_time - start_time).total_seconds()

            download_info.update(
                {
                    "success": True,
                    "file_size": total_size,
                    "download_time": download_duration,
                    "downloaded_at": end_time.isoformat(),
                }
            )

            self.logger.info(
                f"Successfully downloaded {self.clean_text_for_logging(title)} ({total_size:,} bytes in {download_duration:.1f}s)"
            )

        except Exception as e:
            error_msg = f"Failed to download {self.clean_text_for_logging(title)}: {e}"
            self.logger.error(error_msg)
            download_info["error"] = str(e)

            # Clean up partial download
            if filepath.exists():
                filepath.unlink()

        return download_info

    def process_publication(self, pub: Dict, index: int, total: int) -> Dict:
        """Process a single publication and return metadata"""
        pub_id = pub.get("Id")
        title = pub.get("Title", "untitled")
        date_str = pub.get("PublicationDateAndTime", "")
        summary = pub.get("Summary", "")
        item_url = "https://www.who.int/publications/i/item" + pub.get(
            "ItemDefaultUrl", ""
        )

        # Create publication metadata
        pub_metadata = {
            "id": pub_id,
            "title": title,
            "summary": summary,
            "publication_date": date_str,
            "item_url": item_url,
            "processed_at": datetime.now().isoformat(),
            "pdf_info": {},
            "download_info": {"attempted": False},
            "status": "processing",
        }

        # Parse publication date
        try:
            pub_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
            pub_metadata["publication_date_parsed"] = pub_date.isoformat()
        except Exception:
            pub_date = None
            pub_metadata["publication_date_parsed"] = None

        self.logger.info(
            f"[{index}/{total}] {pub_date} — {self.clean_text_for_logging(title)}"
        )
        self.logger.info(f"   Page: {item_url}")

        # Check if already downloaded
        if pub_id in self.existing_publications:
            existing_pub = self.existing_publications[pub_id]
            if existing_pub.get("download_info", {}).get("success"):
                self.logger.info("   Already downloaded, skipping...")
                pub_metadata["status"] = "already_downloaded"
                pub_metadata["download_info"] = existing_pub.get("download_info", {})
                return pub_metadata

        # Fetch publication page
        try:
            page = requests.get(item_url, headers=HEADERS, timeout=30)
            if page.status_code != 200:
                pub_metadata["status"] = "page_fetch_failed"
                pub_metadata["error"] = f"HTTP {page.status_code}"
                self.logger.warning("   Failed to fetch page")
                return pub_metadata
        except Exception as e:
            pub_metadata["status"] = "page_fetch_error"
            pub_metadata["error"] = str(e)
            self.logger.error(f"   Error fetching page: {e}")
            return pub_metadata

        # Extract PDF link
        pdf_link = self.extract_pdf_link(page.text, item_url)
        if not pdf_link:
            pub_metadata["status"] = "no_pdf_found"
            self.logger.warning("   No PDF found")
            return pub_metadata

        pub_metadata["pdf_url"] = pdf_link

        # Get file info
        file_info = self.get_file_info(pdf_link)
        pub_metadata["pdf_info"] = file_info

        # Build filename
        filename = (
            f"{pub_date}_{self.sanitize_filename(title)}.pdf"
            if pub_date
            else f"{self.sanitize_filename(title)}.pdf"
        )
        filepath = self.download_dir / filename
        pub_metadata["filename"] = filename
        pub_metadata["filepath"] = str(filepath)

        # Download PDF
        download_info = self.download_pdf(pdf_link, filepath, title)
        pub_metadata["download_info"] = download_info

        if download_info["success"]:
            pub_metadata["status"] = "downloaded"
            self.session_metadata["total_downloaded"] += 1
        else:
            pub_metadata["status"] = "download_failed"
            self.session_metadata["total_failed"] += 1

        return pub_metadata

    def generate_statistics(self):
        """Generate download statistics"""
        publications = self.session_metadata["publications"]

        # Status counts
        status_counts = {}
        file_types = {}
        download_sizes = []

        for pub in publications:
            status = pub.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

            if pub.get("download_info", {}).get("success"):
                file_size = pub.get("download_info", {}).get("file_size", 0)
                if file_size > 0:
                    download_sizes.append(file_size)

        # Calculate statistics
        total_size = sum(download_sizes)
        avg_size = total_size / len(download_sizes) if download_sizes else 0

        self.session_metadata["statistics"] = {
            "status_counts": status_counts,
            "total_download_size": total_size,
            "average_file_size": avg_size,
            "largest_file": max(download_sizes) if download_sizes else 0,
            "smallest_file": min(download_sizes) if download_sizes else 0,
        }

    def save_metadata(self):
        """Save comprehensive metadata to JSON file"""
        self.session_metadata["session_end"] = datetime.now().isoformat()

        # Generate statistics
        self.generate_statistics()

        # Merge with existing publications
        all_publications = list(self.existing_publications.values())

        # Update or add new publications
        for new_pub in self.session_metadata["publications"]:
            pub_id = new_pub.get("id")
            if pub_id:
                # Update existing or add new
                found = False
                for i, existing_pub in enumerate(all_publications):
                    if existing_pub.get("id") == pub_id:
                        all_publications[i] = new_pub
                        found = True
                        break
                if not found:
                    all_publications.append(new_pub)

        # Create final metadata structure
        final_metadata = {
            "last_updated": datetime.now().isoformat(),
            "total_publications": len(all_publications),
            "session_info": self.session_metadata,
            "publications": sorted(
                all_publications,
                key=lambda x: x.get("publication_date", ""),
                reverse=True,
            ),
        }

        # Save to file
        metadata_file = self.download_dir / "metadata.json"
        try:
            with open(metadata_file, "w", encoding="utf-8") as f:
                json.dump(final_metadata, f, indent=2, ensure_ascii=False)

            self.logger.info(f"Metadata saved to: {metadata_file}")

        except Exception as e:
            self.logger.error(f"Failed to save metadata: {e}")

    def generate_report(self):
        """Generate a human-readable report"""
        report_file = self.download_dir / "download_report.txt"

        try:
            with open(report_file, "w", encoding="utf-8") as f:
                f.write("WHO PUBLICATIONS DOWNLOAD REPORT\n")
                f.write("=" * 50 + "\n\n")

                f.write(
                    f"Session Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
                )
                f.write(f"Download Directory: {self.download_dir.absolute()}\n\n")

                # Session statistics
                stats = self.session_metadata["statistics"]
                f.write("SESSION SUMMARY:\n")
                f.write("-" * 20 + "\n")
                f.write(
                    f"Publications Requested: {self.session_metadata['total_requested']}\n"
                )
                f.write(f"Publications Found: {self.session_metadata['total_found']}\n")
                f.write(
                    f"Successfully Downloaded: {self.session_metadata['total_downloaded']}\n"
                )
                f.write(f"Failed Downloads: {self.session_metadata['total_failed']}\n")
                f.write(
                    f"Total Download Size: {stats.get('total_download_size', 0):,} bytes\n"
                )
                f.write(
                    f"Average File Size: {stats.get('average_file_size', 0):,.0f} bytes\n\n"
                )

                # Status breakdown
                f.write("STATUS BREAKDOWN:\n")
                f.write("-" * 20 + "\n")
                for status, count in stats.get("status_counts", {}).items():
                    f.write(f"{status.replace('_', ' ').title()}: {count}\n")
                f.write("\n")

                # Recent downloads
                f.write("RECENT DOWNLOADS:\n")
                f.write("-" * 20 + "\n")
                recent_downloads = [
                    pub
                    for pub in self.session_metadata["publications"]
                    if pub.get("download_info", {}).get("success")
                ]

                for pub in recent_downloads[:10]:  # Show last 10
                    f.write(f"• {pub.get('title', 'Unknown')}\n")
                    f.write(
                        f"  Date: {pub.get('publication_date_parsed', 'Unknown')}\n"
                    )
                    f.write(f"  File: {pub.get('filename', 'Unknown')}\n")
                    f.write(
                        f"  Size: {pub.get('download_info', {}).get('file_size', 0):,} bytes\n\n"
                    )

            self.logger.info(f"Report saved to: {report_file}")

        except Exception as e:
            self.logger.error(f"Failed to generate report: {e}")

    def download_publications(self, n: int = 100):
        """Main method to download the latest N publications as PDF."""
        self.logger.info(f"Starting download of latest {n} WHO publications...")

        # Fetch publications
        publications = self.fetch_latest_publications(n)
        if not publications:
            self.logger.error("No publications found. Exiting.")
            return

        # Process each publication
        for idx, pub in enumerate(publications, start=1):
            pub_metadata = self.process_publication(pub, idx, len(publications))
            self.session_metadata["publications"].append(pub_metadata)

        # Save metadata and generate report
        self.save_metadata()
        self.generate_report()

        # Final summary
        self.logger.info("=" * 50)
        self.logger.info(f"DOWNLOAD COMPLETED")
        self.logger.info(f"Total Publications: {len(publications)}")
        self.logger.info(
            f"Successfully Downloaded: {self.session_metadata['total_downloaded']}"
        )
        self.logger.info(f"Failed: {self.session_metadata['total_failed']}")
        self.logger.info(f"Files saved to: {self.download_dir.absolute()}")
        self.logger.info("=" * 50)


def main():
    parser = argparse.ArgumentParser(
        description="Download latest WHO publications with comprehensive metadata tracking"
    )
    parser.add_argument(
        "--count",
        "-n",
        type=int,
        default=5,
        help="Number of latest publications to download (default: 5)",
    )
    parser.add_argument(
        "--download-dir",
        "-d",
        default=DOWNLOAD_DIR,
        help=f"Download directory (default: {DOWNLOAD_DIR})",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable verbose logging"
    )

    args = parser.parse_args()

    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Create downloader and run
    downloader = WHOPublicationDownloader(download_dir=args.download_dir)
    downloader.download_publications(args.count)


if __name__ == "__main__":
    main()
